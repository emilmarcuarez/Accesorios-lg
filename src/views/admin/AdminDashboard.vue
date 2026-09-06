<script setup>
import { ref, onMounted, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { listProducts, listOrders, listCoupons } from '@/lib/db'
import { useSettingsStore } from '@/store/settings'
import { formatPrice } from '@/utils/format'

const settings = useSettingsStore()
const products = ref([])
const orders = ref([])
const coupons = ref([])
const loaded = ref(false)

// ---- Filtros por fecha ----
const datePreset = ref('14d') // '7d' | '14d' | '30d' | 'this_month' | 'last_month' | 'all' | 'custom'
const customFrom = ref('')
const customTo = ref('')
const hoveredPoint = ref(null)

const datePresets = [
  { id: '7d', label: '7 días' },
  { id: '14d', label: '14 días' },
  { id: '30d', label: '30 días' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'last_month', label: 'Mes anterior' },
  { id: 'all', label: 'Todo' },
  { id: 'custom', label: 'Personalizado' },
]

function selectPreset(preset) {
  datePreset.value = preset
  if (preset === 'custom' && (!customFrom.value || !customTo.value)) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 29)
    customFrom.value = start.toISOString().slice(0, 10)
    customTo.value = end.toISOString().slice(0, 10)
  }
}

// Ventana de fechas calculada
const dateWindow = computed(() => {
  const now = new Date()

  if (datePreset.value === '7d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { start, end, label: 'Últimos 7 días', days: 7, mode: 'daily' }
  }

  if (datePreset.value === '14d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { start, end, label: 'Últimos 14 días', days: 14, mode: 'daily' }
  }

  if (datePreset.value === '30d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { start, end, label: 'Últimos 30 días', days: 30, mode: 'daily' }
  }

  if (datePreset.value === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const monthName = now.toLocaleString('es-ES', { month: 'long' })
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return { start, end, label: `Este mes (${capitalized})`, days, mode: 'daily' }
  }

  if (datePreset.value === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const monthName = start.toLocaleString('es-ES', { month: 'long' })
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return { start, end, label: `Mes anterior (${capitalized})`, days, mode: 'daily' }
  }

  if (datePreset.value === 'custom' && customFrom.value && customTo.value) {
    const start = new Date(`${customFrom.value}T00:00:00`)
    const end = new Date(`${customTo.value}T23:59:59.999`)
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    return {
      start,
      end,
      label: `${customFrom.value} a ${customTo.value}`,
      days: diffDays,
      mode: diffDays <= 45 ? 'daily' : 'monthly',
    }
  }

  // 'all' Histórico completo
  return { start: null, end: null, label: 'Historial completo', days: 0, mode: 'all' }
})

// Pedidos filtrados según la fecha seleccionada
const filteredOrders = computed(() => {
  const win = dateWindow.value
  if (!win.start || !win.end) return orders.value

  const startMs = win.start.getTime()
  const endMs = win.end.getTime()

  return orders.value.filter((o) => {
    if (!o.created_at) return false
    const time = new Date(o.created_at).getTime()
    return time >= startMs && time <= endMs
  })
})

// Métricas de ventas para el período seleccionado
const revenue = computed(() => filteredOrders.value.reduce((s, o) => s + (o.subtotal || 0), 0))
const totalAllRevenue = computed(() => orders.value.reduce((s, o) => s + (o.subtotal || 0), 0))
const lowStock = computed(() => products.value.filter((p) => (p.stock ?? 0) <= settings.lowStock))
const unitsSold = computed(() =>
  filteredOrders.value.reduce((s, o) => s + (o.order_items || []).reduce((a, i) => a + i.qty, 0), 0),
)

const stats = computed(() => [
  {
    label: datePreset.value === 'all' ? 'Ventas totales' : 'Ventas en período',
    value: formatPrice(revenue.value),
    tone: 'rose',
    sub: dateWindow.value.label,
  },
  {
    label: 'Pedidos',
    value: filteredOrders.value.length,
    tone: 'blue',
    sub: datePreset.value === 'all' ? 'Historial' : 'En el período',
  },
  {
    label: 'Unidades vendidas',
    value: unitsSold.value,
    tone: 'green',
    sub: 'Productos despachados',
  },
  {
    label: 'Bajo stock',
    value: lowStock.value.length,
    tone: 'amber',
    sub: 'Alerta inventario',
  },
])

// ---- Serie dinámica de ventas para el gráfico ----
const salesSeries = computed(() => {
  const win = dateWindow.value
  const arr = []

  if (win.mode === 'daily') {
    const daysCount = win.days || 14
    const start = new Date(win.start)

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const dayNum = d.getDate()
      const monthShort = d.toLocaleString('es-ES', { month: 'short' })

      const dayOrders = orders.value.filter((o) => (o.created_at || '').slice(0, 10) === key)
      const total = dayOrders.reduce((s, o) => s + (o.subtotal || 0), 0)

      arr.push({
        key,
        label: dayNum,
        fullDate: `${dayNum} ${monthShort}`,
        value: Number(total.toFixed(2)),
        ordersCount: dayOrders.length,
      })
    }
    return arr
  }

  // Modo 'all' o rango muy largo: agrupar por meses o por los últimos 30 días con registros
  if (win.mode === 'all') {
    // Si no hay pedidos
    if (!orders.value.length) {
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        arr.push({ key: d.toISOString().slice(0, 10), label: d.getDate(), fullDate: d.toLocaleDateString(), value: 0, ordersCount: 0 })
      }
      return arr
    }

    // Agrupar por mes o mostrar últimos 30 días
    const monthsMap = {}
    orders.value.forEach((o) => {
      const ym = (o.created_at || '').slice(0, 7) // YYYY-MM
      if (!ym) return
      monthsMap[ym] = (monthsMap[ym] || 0) + (o.subtotal || 0)
    })

    const keys = Object.keys(monthsMap).sort()
    if (keys.length > 1) {
      keys.forEach((ym) => {
        const [y, m] = ym.split('-')
        const d = new Date(Number(y), Number(m) - 1, 1)
        const label = d.toLocaleString('es-ES', { month: 'short' })
        arr.push({
          key: ym,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          fullDate: `${label} ${y}`,
          value: Number(monthsMap[ym].toFixed(2)),
          ordersCount: orders.value.filter((o) => (o.created_at || '').slice(0, 7) === ym).length,
        })
      })
      return arr
    }

    // Si todo está en el mismo mes, mostrar los últimos 14 días
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dayOrders = orders.value.filter((o) => (o.created_at || '').slice(0, 10) === key)
      const total = dayOrders.reduce((s, o) => s + (o.subtotal || 0), 0)
      arr.push({ key, label: d.getDate(), fullDate: d.toLocaleDateString(), value: total, ordersCount: dayOrders.length })
    }
    return arr
  }

  // Fallback mensual para rangos largos
  return arr
})

const chart = computed(() => {
  const W = 600
  const H = 210
  const padX = 16
  const top = 22
  const bottom = 175
  const n = salesSeries.value.length

  if (n === 0) {
    return { W, H, line: '', area: '', pts: [], bottom, max: 1 }
  }

  const max = Math.max(...salesSeries.value.map((p) => p.value), 1)
  const step = n > 1 ? (W - padX * 2) / (n - 1) : 0

  const pts = salesSeries.value.map((p, i) => {
    const x = padX + i * step
    const y = bottom - (p.value / max) * (bottom - top)
    return { ...p, x, y }
  })

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = pts.length > 1
    ? `${line} L${pts[n - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`
    : ''

  return { W, H, line, area, pts, bottom, max }
})

// ---- Donut de estados (para el período seleccionado) ----
const statusColors = {
  pendiente: '#e0a03a',
  pagado: '#3aa06b',
  enviado: '#4a8bd6',
  entregado: '#8b5cd6',
  cancelado: '#c0392b',
}

const donut = computed(() => {
  const keys = Object.keys(statusColors)
  const targetOrders = filteredOrders.value.length ? filteredOrders.value : orders.value
  const total = targetOrders.length || 1
  const R = 62
  const C = 2 * Math.PI * R
  let offset = 0

  const segs = keys
    .map((k) => {
      const count = targetOrders.filter((o) => o.status === k).length
      const frac = count / total
      const seg = { key: k, count, frac, dash: frac * C, offset, color: statusColors[k], C }
      offset += frac * C
      return seg
    })
    .filter((s) => s.count > 0)

  return { R, C, segs, total: targetOrders.length }
})

// ---- Ventas por categoría (para el período seleccionado) ----
const categorySales = computed(() => {
  const catOf = {}
  products.value.forEach((p) => (catOf[p.id] = p.categories?.name || 'Sin categoría'))
  const acc = {}

  filteredOrders.value.forEach((o) => {
    ;(o.order_items || []).forEach((item) => {
      const name = catOf[item.product_id] || 'Sin categoría'
      acc[name] = (acc[name] || 0) + item.price * item.qty
    })
  })

  const list = Object.entries(acc).map(([name, value]) => ({ name, value }))
  const max = Math.max(...list.map((l) => l.value), 1)

  return list
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((l) => ({ ...l, percent: Math.round((l.value / max) * 100) }))
})

function statusClass(status) {
  return 'st-' + status
}

onMounted(async () => {
  const [p, o, c] = await Promise.all([listProducts(), listOrders(), listCoupons()])
  products.value = p.data || []
  orders.value = o.data || []
  coupons.value = c.data || []
  settings.fetch()
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="dash">
    <div class="admin-toolbar">
      <div>
        <h1 class="admin-title">Dashboard</h1>
        <p class="admin-subtitle">Resumen general y métricas en tiempo real de tu tienda.</p>
      </div>
    </div>

    <!-- BARRA DE FILTROS POR FECHA -->
    <div class="dash-filter-card">
      <div class="filter-card-header">
        <div class="filter-header-title">
          <AppIcon name="sparkles" :size="16" class="filter-spark-icon" />
          <span>Filtro de período para gráficas y métricas:</span>
        </div>
        <div class="filter-badge-info">
          <span class="range-pill">{{ dateWindow.label }}</span>
          <span class="range-total-val">{{ formatPrice(revenue) }}</span>
        </div>
      </div>

      <div class="filter-presets-row">
        <div class="presets-buttons-wrap">
          <button
            v-for="p in datePresets"
            :key="p.id"
            class="dash-preset-btn"
            :class="{ active: datePreset === p.id }"
            @click="selectPreset(p.id)"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Selector personalizado con inputs de fecha -->
        <div v-if="datePreset === 'custom'" class="custom-dates-wrap">
          <div class="date-field">
            <span class="date-label">Desde:</span>
            <input v-model="customFrom" type="date" class="date-picker-input" />
          </div>
          <span class="date-sep">&rarr;</span>
          <div class="date-field">
            <span class="date-label">Hasta:</span>
            <input v-model="customTo" type="date" class="date-picker-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- TARJETAS DE ESTADÍSTICAS -->
    <div class="dash-stats">
      <div v-for="s in stats" :key="s.label" class="stat-card" :class="'tone-' + s.tone">
        <div class="stat-content">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
        <span class="stat-sub">{{ s.sub }}</span>
      </div>
    </div>

    <!-- GRÁFICAS PRINCIPALES -->
    <div class="dash-grid">
      <!-- Gráfica de Ventas -->
      <div class="dash-panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Ventas · {{ dateWindow.label }}</h2>
            <span class="panel-sub-count">{{ filteredOrders.length }} pedido(s) registrados</span>
          </div>
          <div class="panel-meta-block">
            <span class="panel-meta">{{ formatPrice(revenue) }}</span>
            <span class="panel-meta-tag">Período actual</span>
          </div>
        </div>

        <div class="chart-container">
          <svg :viewBox="`0 0 ${chart.W} ${chart.H}`" class="area-chart">
            <defs>
              <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#d96d8b" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#d96d8b" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <!-- Líneas de referencia horizontales -->
            <line :x1="8" :y1="chart.bottom" :x2="chart.W - 8" :y2="chart.bottom" stroke="#f0e2e6" stroke-width="1" />
            <line :x1="8" :y1="(chart.bottom + 22) / 2" :x2="chart.W - 8" :y2="(chart.bottom + 22) / 2" stroke="#f7edf0" stroke-dasharray="3 3" />

            <!-- Área sombreada -->
            <path v-if="chart.area" :d="chart.area" fill="url(#roseGrad)" />

            <!-- Línea de trazado -->
            <path
              v-if="chart.line"
              :d="chart.line"
              fill="none"
              stroke="#d96d8b"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Puntos interactivos -->
            <g v-for="(p, i) in chart.pts" :key="i">
              <!-- Halo al hacer hover -->
              <circle
                v-if="hoveredPoint === p"
                :cx="p.x"
                :cy="p.y"
                r="10"
                fill="rgba(217, 109, 139, 0.25)"
              />
              <circle
                :cx="p.x"
                :cy="p.y"
                :r="hoveredPoint === p ? 5.5 : 3.5"
                fill="#fff"
                stroke="#d96d8b"
                :stroke-width="hoveredPoint === p ? 3 : 2"
                class="chart-dot"
                @mouseenter="hoveredPoint = p"
                @mouseleave="hoveredPoint = null"
              />
            </g>
          </svg>

          <!-- Tooltip flotante al pasar el mouse sobre un punto -->
          <div v-if="hoveredPoint" class="chart-tooltip">
            <strong>{{ hoveredPoint.fullDate }}</strong>: {{ formatPrice(hoveredPoint.value) }}
            <span v-if="hoveredPoint.ordersCount > 0" class="tooltip-orders">({{ hoveredPoint.ordersCount }} pedidos)</span>
          </div>

          <div class="chart-x">
            <span
              v-for="(p, i) in salesSeries"
              :key="i"
              v-show="salesSeries.length <= 14 ? true : i % Math.ceil(salesSeries.length / 10) === 0"
              class="chart-x-label"
            >
              {{ p.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Donut de Estados -->
      <div class="dash-panel">
        <div class="panel-head">
          <h2 class="panel-title">Pedidos por estado</h2>
          <span class="panel-meta">{{ donut.total }} pedidos</span>
        </div>
        <div class="donut-wrap">
          <svg viewBox="0 0 160 160" class="donut">
            <circle cx="80" cy="80" :r="donut.R" fill="none" stroke="#f6ebee" stroke-width="18" />
            <circle
              v-for="seg in donut.segs"
              :key="seg.key"
              cx="80"
              cy="80"
              :r="donut.R"
              fill="none"
              :stroke="seg.color"
              stroke-width="18"
              :stroke-dasharray="`${seg.dash} ${seg.C}`"
              :stroke-dashoffset="-seg.offset"
              transform="rotate(-90 80 80)"
            />
            <text x="80" y="76" text-anchor="middle" class="donut-num">{{ donut.total }}</text>
            <text x="80" y="96" text-anchor="middle" class="donut-cap">pedidos</text>
          </svg>
          <div class="donut-legend">
            <div v-for="seg in donut.segs" :key="seg.key" class="legend-item">
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-label">{{ seg.key }}</span>
              <span class="legend-count">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEGUNDA FILA: CATEGORÍAS Y STOCK -->
    <div class="dash-grid">
      <div class="dash-panel">
        <div class="panel-head">
          <h2 class="panel-title">Ventas por categoría</h2>
          <span class="panel-sub-count">En este período</span>
        </div>
        <div v-if="categorySales.length" class="bars">
          <div v-for="bar in categorySales" :key="bar.name" class="bar-row">
            <span class="bar-label" :title="bar.name">{{ bar.name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: bar.percent + '%' }"></div>
            </div>
            <span class="bar-count">{{ formatPrice(bar.value) }}</span>
          </div>
        </div>
        <p v-else class="empty">No se registraron ventas en este período.</p>
      </div>

      <div class="dash-panel">
        <div class="panel-head">
          <h2 class="panel-title">Stock bajo</h2>
          <router-link to="/admin/productos" class="panel-link">Gestionar</router-link>
        </div>
        <div v-if="lowStock.length" class="stock-list">
          <div v-for="product in lowStock.slice(0, 6)" :key="product.id" class="stock-item">
            <img :src="product.image" class="stock-thumb" :alt="product.name" />
            <span class="stock-name">{{ product.name }}</span>
            <span class="stock-qty" :class="{ out: (product.stock ?? 0) <= 0 }">{{ product.stock ?? 0 }} uds</span>
          </div>
        </div>
        <p v-else class="empty">Todo con stock suficiente, ¡excelente!</p>
      </div>
    </div>

    <!-- PEDIDOS RECIENTES -->
    <div class="dash-panel">
      <div class="panel-head">
        <h2 class="panel-title">Pedidos recientes</h2>
        <router-link to="/admin/pedidos" class="panel-link">Ver todos</router-link>
      </div>
      <div v-if="orders.length" class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders.slice(0, 8)" :key="order.id">
              <td><strong>#{{ String(order.id).padStart(4, '0') }}</strong></td>
              <td>{{ order.customer_name || order.profiles?.name || 'Anónimo' }}</td>
              <td><strong>{{ formatPrice(order.subtotal) }}</strong></td>
              <td><span class="status" :class="statusClass(order.status)">{{ order.status }}</span></td>
              <td>{{ new Date(order.created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">Aún no hay pedidos.</p>
    </div>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* FILTRO DE FECHAS EN EL DASHBOARD */
.dash-filter-card {
  background: #ffffff;
  border: 1px solid #f0e2e6;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 6px rgba(42, 32, 36, 0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-800);
}

.filter-spark-icon {
  color: var(--rose-600);
}

.filter-badge-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-pill {
  font-size: 12px;
  font-weight: 600;
  background: var(--rose-50);
  color: var(--rose-700);
  border: 1px solid var(--rose-200);
  padding: 3px 10px;
  border-radius: 20px;
}

.range-total-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-900);
}

.filter-presets-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.presets-buttons-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dash-preset-btn {
  background: #f8fafc;
  border: 1px solid var(--line);
  color: var(--ink-600);
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dash-preset-btn:hover {
  background: var(--rose-50);
  color: var(--rose-600);
  border-color: var(--rose-200);
}

.dash-preset-btn.active {
  background: var(--rose-gradient);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(216, 90, 127, 0.3);
}

.custom-dates-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #faf6f7;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--rose-200);
}

.date-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-500);
}

.date-picker-input {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--ink-800);
  background: #ffffff;
  outline: none;
}

.date-picker-input:focus {
  border-color: var(--rose-400);
}

.date-sep {
  color: var(--ink-400);
  font-size: 13px;
}

/* TARJETAS DE ESTADÍSTICAS */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  border-top: 4px solid #ccc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.stat-card.tone-rose { border-top-color: #d96d8b; }
.stat-card.tone-blue { border-top-color: #4a8bd6; }
.stat-card.tone-green { border-top-color: #3aa06b; }
.stat-card.tone-amber { border-top-color: #e0a03a; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink-900);
  line-height: 1.15;
}

.stat-label {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-400);
  font-weight: 600;
  margin-top: 4px;
}

.stat-sub {
  font-size: 11.5px;
  color: var(--ink-400);
}

/* GRIDS Y PANELES */
.dash-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 20px;
}

.dash-panel {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 22px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0;
}

.panel-sub-count {
  font-size: 12px;
  color: var(--ink-400);
  display: block;
  margin-top: 2px;
}

.panel-meta-block {
  text-align: right;
}

.panel-meta {
  font-size: 18px;
  font-weight: 800;
  color: var(--rose-600);
  display: block;
}

.panel-meta-tag {
  font-size: 11px;
  color: var(--ink-400);
}

.panel-link {
  font-size: 13px;
  color: var(--rose-600);
  font-weight: 600;
  text-decoration: none;
}

.panel-link:hover {
  text-decoration: underline;
}

/* ÁREA DE GRÁFICO SVG */
.chart-container {
  position: relative;
}

.area-chart {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-dot {
  cursor: pointer;
  transition: r 0.15s ease;
}

.chart-tooltip {
  position: absolute;
  top: 10px;
  right: 14px;
  background: #2a2024;
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.tooltip-orders {
  color: #f7b4c4;
  margin-left: 4px;
}

.chart-x {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--ink-400);
  font-size: 11px;
  padding: 0 4px;
}

.chart-x-label {
  text-align: center;
}

/* DONUT */
.donut-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.donut {
  width: 140px;
  height: 140px;
  flex: 0 0 auto;
}

.donut-num {
  font-size: 24px;
  font-weight: 800;
  fill: var(--ink-900);
}

.donut-cap {
  font-size: 11px;
  fill: var(--ink-400);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 13px;
  color: var(--ink-500);
  text-transform: capitalize;
  flex: 1;
}

.legend-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-800);
}

/* BARS CATEGORÍAS */
.bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  color: var(--ink-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  height: 10px;
  background: #f6ebee;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #e18aa2, #d96d8b);
  transition: width 0.3s ease;
}

.bar-count {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-800);
  text-align: right;
}

/* STOCK LIST */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stock-thumb {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--rose-50);
}

.stock-name {
  flex: 1;
  font-size: 13px;
  color: var(--ink-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-qty {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-500);
}

.stock-qty.out {
  color: #dc2626;
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.empty {
  color: var(--ink-400);
  text-align: center;
  padding: 24px;
  font-size: 13.5px;
}

/* RESPONSIVE DESIGN */
@media (max-width: 900px) {
  .dash-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .dash-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-card {
    padding: 14px 16px;
  }
  .stat-value {
    font-size: 22px;
  }
  .filter-presets-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .presets-buttons-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    overflow: visible;
  }
  .dash-preset-btn {
    flex: 1 1 calc(33.333% - 8px);
    min-width: 76px;
    text-align: center;
    padding: 8px 6px;
    font-size: 12px;
  }
  .custom-dates-wrap {
    flex-wrap: wrap;
    justify-content: space-between;
  }
}

@media (max-width: 520px) {
  .dash-preset-btn {
    flex: 1 1 calc(50% - 6px);
  }
  .dash-panel {
    padding: 16px 14px;
    border-radius: 12px;
  }
  .bar-row {
    grid-template-columns: 85px 1fr 65px;
    gap: 8px;
  }
  .donut-wrap {
    flex-direction: column;
    gap: 16px;
  }
  .panel-title {
    font-size: 15.5px;
  }
}
</style>
