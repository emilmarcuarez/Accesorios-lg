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

const revenue = computed(() => orders.value.reduce((s, o) => s + (o.subtotal || 0), 0))
const lowStock = computed(() => products.value.filter((p) => (p.stock ?? 0) <= settings.lowStock))
const unitsSold = computed(() =>
  orders.value.reduce((s, o) => s + (o.order_items || []).reduce((a, i) => a + i.qty, 0), 0),
)

const stats = computed(() => [
  { label: 'Ventas totales', value: formatPrice(revenue.value), tone: 'rose' },
  { label: 'Pedidos', value: orders.value.length, tone: 'blue' },
  { label: 'Unidades vendidas', value: unitsSold.value, tone: 'green' },
  { label: 'Bajo stock', value: lowStock.value.length, tone: 'amber' },
])

// ---- Serie de ventas (últimos 14 días) ----
const salesSeries = computed(() => {
  const arr = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const total = orders.value
      .filter((o) => (o.created_at || '').slice(0, 10) === key)
      .reduce((s, o) => s + (o.subtotal || 0), 0)
    arr.push({ label: d.getDate(), value: total })
  }
  return arr
})

const chart = computed(() => {
  const W = 600
  const H = 200
  const padX = 8
  const top = 14
  const bottom = 176
  const n = salesSeries.value.length
  const max = Math.max(...salesSeries.value.map((p) => p.value), 1)
  const step = (W - padX * 2) / (n - 1)
  const pts = salesSeries.value.map((p, i) => {
    const x = padX + i * step
    const y = bottom - (p.value / max) * (bottom - top)
    return { x, y }
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[n - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`
  return { W, H, line, area, pts, bottom }
})

// ---- Donut de estados ----
const statusColors = {
  pendiente: '#e0a03a',
  pagado: '#3aa06b',
  enviado: '#4a8bd6',
  entregado: '#8b5cd6',
  cancelado: '#c0392b',
}
const donut = computed(() => {
  const keys = Object.keys(statusColors)
  const total = orders.value.length || 1
  const R = 62
  const C = 2 * Math.PI * R
  let offset = 0
  const segs = keys
    .map((k) => {
      const count = orders.value.filter((o) => o.status === k).length
      const frac = count / total
      const seg = { key: k, count, frac, dash: frac * C, offset, color: statusColors[k], C }
      offset += frac * C
      return seg
    })
    .filter((s) => s.count > 0)
  return { R, C, segs, total: orders.value.length }
})

// ---- Ventas por categoría ----
const categorySales = computed(() => {
  const catOf = {}
  products.value.forEach((p) => (catOf[p.id] = p.categories?.name || 'Sin categoría'))
  const acc = {}
  orders.value.forEach((o) => {
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
    <div class="dash-stats">
      <div v-for="s in stats" :key="s.label" class="stat-card" :class="'tone-' + s.tone">
        <span class="stat-value">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </div>

    <div class="dash-grid">
      <div class="dash-panel">
        <div class="panel-head">
          <h2 class="panel-title">Ventas · últimos 14 días</h2>
          <span class="panel-meta">{{ formatPrice(revenue) }}</span>
        </div>
        <svg :viewBox="`0 0 ${chart.W} ${chart.H}`" class="area-chart">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d96d8b" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#d96d8b" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="chart.area" fill="url(#grad)" />
          <path :d="chart.line" fill="none" stroke="#d96d8b" stroke-width="3" stroke-linecap="round" />
          <circle
            v-for="(p, i) in chart.pts"
            :key="i"
            :cx="p.x"
            :cy="p.y"
            r="3.5"
            fill="#fff"
            stroke="#d96d8b"
            stroke-width="2"
          />
        </svg>
        <div class="chart-x">
          <span v-for="(p, i) in salesSeries" :key="i" v-show="i % 2 === 0">{{ p.label }}</span>
        </div>
      </div>

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

    <div class="dash-grid">
      <div class="dash-panel">
        <div class="panel-head">
          <h2 class="panel-title">Ventas por categoría</h2>
        </div>
        <div v-if="categorySales.length" class="bars">
          <div v-for="bar in categorySales" :key="bar.name" class="bar-row">
            <span class="bar-label">{{ bar.name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: bar.percent + '%' }"></div>
            </div>
            <span class="bar-count">{{ formatPrice(bar.value) }}</span>
          </div>
        </div>
        <p v-else class="empty">Aún no hay ventas por categoría.</p>
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
        <p v-else class="empty">Todo con stock, genial.</p>
      </div>
    </div>

    <div class="dash-panel">
      <div class="panel-head">
        <h2 class="panel-title">Pedidos recientes</h2>
        <router-link to="/admin/pedidos" class="panel-link">Ver todos</router-link>
      </div>
      <div v-if="orders.length" class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            <tr v-for="order in orders.slice(0, 8)" :key="order.id">
              <td><strong>#{{ String(order.id).padStart(4, '0') }}</strong></td>
              <td>{{ order.customer_name || order.profiles?.name || 'Anónimo' }}</td>
              <td>{{ formatPrice(order.subtotal) }}</td>
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
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--rose-500);
}

.stat-card.tone-blue::before { background: #4a8bd6; }
.stat-card.tone-green::before { background: #3aa06b; }
.stat-card.tone-amber::before { background: #e0a03a; }

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}

.stat-label {
  color: var(--ink-500);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dash-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.dash-panel {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink-900);
}

.panel-meta {
  font-size: 13px;
  font-weight: 600;
  color: var(--rose-600);
}

.panel-link {
  font-size: 13px;
  color: var(--rose-600);
  font-weight: 600;
}

.area-chart {
  width: 100%;
  height: auto;
}

.chart-x {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--ink-400);
  font-size: 11px;
}

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 26px;
}

.donut {
  width: 150px;
  height: 150px;
  flex: 0 0 auto;
}

.donut-num {
  font-size: 26px;
  font-weight: 700;
  fill: var(--ink-900);
}

.donut-cap {
  font-size: 11px;
  fill: var(--ink-400);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-label {
  font-size: 13px;
  color: var(--ink-500);
  text-transform: capitalize;
  flex: 1;
}

.legend-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-row {
  display: grid;
  grid-template-columns: 130px 1fr 90px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  color: var(--ink-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  height: 12px;
  background: #f6ebee;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #e18aa2, #d96d8b);
}

.bar-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-700);
  text-align: right;
}

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
  font-size: 13.5px;
  color: var(--ink-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-qty {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
}

.stock-qty.out {
  color: #c0392b;
}

.table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-400);
  padding: 12px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid #f7e9ec;
  font-size: 14px;
  color: var(--ink-700);
  vertical-align: middle;
}

.status {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.st-pendiente.status { background: #fff3e0; color: #b26a00; }
.st-pagado.status { background: #e3f6e9; color: #1f8a4c; }
.st-enviado.status { background: #e3edfb; color: #1f5fbf; }
.st-entregado.status { background: #f0e6fb; color: #6a3fb5; }
.st-cancelado.status { background: #fbe9e9; color: #b04b4b; }

.empty {
  color: var(--ink-400);
  text-align: center;
  padding: 24px;
}

@media (max-width: 900px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
  .donut-wrap {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .dash-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .bar-row {
    grid-template-columns: 90px 1fr 80px;
  }
}
</style>
