<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import AppIcon from '@/components/AppIcon.vue'
import { listOrders, updateOrderStatus, insertOrder, recordOrderCoupon, listCoupons } from '@/lib/db'
import { useCartStore } from '@/store/cart'
import { useCatalogStore } from '@/store/catalog'
import { resolveImage } from '@/utils/image'

const cart = useCartStore()
const catalog = useCatalogStore()

const orders = ref([])
const loaded = ref(false)

// Filtros básicos
const statuses = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']
const statusFilter = ref('all')
const couponFilter = ref('all') // 'all' | 'with_coupon' | 'without_coupon' | 'CODE'
const searchQuery = ref('')
const allCoupons = ref([])

// Filtro por rango de fechas
const rangePreset = ref('all') // 'all' | 'today' | '7days' | 'this_month' | 'last_month' | 'custom'
const dateFrom = ref('')
const dateTo = ref('')

// Modo de vista: 'list' (detallado) | 'by_day' (agrupado por día) | 'by_month' (agrupado por mes)
const viewMode = ref('list')
const expandedGroups = ref({})

// Modal para agregar nueva venta manual
const manualSaleModal = ref(false)
const savingManualSale = ref(false)
const selectedProdId = ref('')
const manualProductSearch = ref('')

const manualForm = ref({
  customer_name: '',
  customer_phone: '',
  status: 'pagado',
  created_at: '',
  coupon_code: '',
  coupon_discount: 0,
  items: [],
})

async function load() {
  const [resOrders, resCoupons] = await Promise.all([listOrders(), listCoupons()])
  orders.value = resOrders.data || []
  allCoupons.value = (resCoupons.data || []).filter((c) => c.active)
  loaded.value = true
}

onMounted(async () => {
  await Promise.all([load(), catalog.fetch()])
})

async function changeStatus(order, event) {
  const newStatus = event.target.value
  const oldStatus = order.status
  await updateOrderStatus(order.id, newStatus, oldStatus)
  await load()
  await catalog.fetch(true)
}

// Ventanas de fechas para cálculo y comparación
const dateWindows = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (rangePreset.value === 'today') {
    const priorStart = new Date(todayStart)
    priorStart.setDate(priorStart.getDate() - 1)
    const priorEnd = new Date(todayEnd)
    priorEnd.setDate(priorEnd.getDate() - 1)
    return {
      current: { from: todayStart, to: todayEnd },
      prior: { from: priorStart, to: priorEnd },
      label: 'Hoy',
      priorLabel: 'Ayer',
    }
  }

  if (rangePreset.value === '7days') {
    const from = new Date(todayStart)
    from.setDate(from.getDate() - 6)
    const priorTo = new Date(from.getTime() - 1)
    const priorFrom = new Date(from)
    priorFrom.setDate(priorFrom.getDate() - 7)
    return {
      current: { from, to: todayEnd },
      prior: { from: priorFrom, to: priorTo },
      label: 'Últimos 7 días',
      priorLabel: '7 días previos',
    }
  }

  if (rangePreset.value === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const priorFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    const priorTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return {
      current: { from, to: todayEnd },
      prior: { from: priorFrom, to: priorTo },
      label: 'Este mes',
      priorLabel: 'Mes anterior',
    }
  }

  if (rangePreset.value === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const priorFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0)
    const priorTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
    return {
      current: { from, to },
      prior: { from: priorFrom, to: priorTo },
      label: 'Mes anterior',
      priorLabel: '2 meses atrás',
    }
  }

  if (rangePreset.value === 'custom' && dateFrom.value && dateTo.value) {
    const from = new Date(`${dateFrom.value}T00:00:00`)
    const to = new Date(`${dateTo.value}T23:59:59.999`)
    const diffMs = to.getTime() - from.getTime()
    const priorTo = new Date(from.getTime() - 1)
    const priorFrom = new Date(priorTo.getTime() - diffMs)
    return {
      current: { from, to },
      prior: { from: priorFrom, to: priorTo },
      label: `${dateFrom.value} a ${dateTo.value}`,
      priorLabel: 'Período anterior',
    }
  }

  return {
    current: null,
    prior: null,
    label: 'Historial completo',
    priorLabel: null,
  }
})

function setPreset(preset) {
  rangePreset.value = preset
  if (preset === 'today') {
    const d = new Date().toISOString().slice(0, 10)
    dateFrom.value = d
    dateTo.value = d
  } else if (preset === '7days') {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    dateFrom.value = start.toISOString().slice(0, 10)
    dateTo.value = end.toISOString().slice(0, 10)
  } else if (preset === 'this_month') {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    dateFrom.value = start.toISOString().slice(0, 10)
    dateTo.value = now.toISOString().slice(0, 10)
  } else if (preset === 'last_month') {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    dateFrom.value = start.toISOString().slice(0, 10)
    dateTo.value = end.toISOString().slice(0, 10)
  } else if (preset === 'all') {
    dateFrom.value = ''
    dateTo.value = ''
  }
}

// Filtro de pedidos por fecha, estado, cupón y búsqueda
const filteredOrders = computed(() => {
  const win = dateWindows.value.current

  return orders.value.filter((order) => {
    // Filtro de fecha
    if (win) {
      const orderTime = new Date(order.created_at).getTime()
      if (orderTime < win.from.getTime() || orderTime > win.to.getTime()) {
        return false
      }
    }

    // Filtro de estado
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) {
      return false
    }

    // Filtro de cupón
    if (couponFilter.value === 'with_coupon' && !order.coupon_code) {
      return false
    }
    if (couponFilter.value === 'without_coupon' && order.coupon_code) {
      return false
    }
    if (
      couponFilter.value !== 'all' &&
      couponFilter.value !== 'with_coupon' &&
      couponFilter.value !== 'without_coupon'
    ) {
      if ((order.coupon_code || '').toUpperCase() !== couponFilter.value.toUpperCase()) {
        return false
      }
    }

    // Filtro de búsqueda (por ID, #padded, cliente, teléfono o código de cupón)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const cleanQ = q.replace(/^#/, '')
      const idStr = String(order.id)
      const paddedId = idStr.padStart(4, '0')
      const hashId = `#${idStr}`
      const hashPadded = `#${paddedId}`
      const clientName = `${order.profiles?.name || order.customer_name || ''} ${order.profiles?.lastname || ''}`.toLowerCase()
      const phone = (order.customer_phone || '').toLowerCase()
      const coupon = (order.coupon_code || '').toLowerCase()
      if (
        !idStr.includes(cleanQ) &&
        !paddedId.includes(cleanQ) &&
        !hashId.includes(q) &&
        !hashPadded.includes(q) &&
        !clientName.includes(q) &&
        !phone.includes(q) &&
        !coupon.includes(q)
      ) {
        return false
      }
    }
    return true
  })
})

// Pedidos del período anterior para métricas comparativas
const priorPeriodOrders = computed(() => {
  const win = dateWindows.value.prior
  if (!win) return []
  return orders.value.filter((order) => {
    const orderTime = new Date(order.created_at).getTime()
    return orderTime >= win.from.getTime() && orderTime <= win.to.getTime()
  })
})

// Métricas y comparaciones
function calcVariation(current, prior) {
  if (!prior || prior === 0) {
    if (current > 0) return { text: '+100%', positive: true, zero: false }
    return { text: '0%', positive: true, zero: true }
  }
  const pct = ((current - prior) / prior) * 100
  const isPos = pct >= 0
  return {
    text: `${isPos ? '+' : ''}${pct.toFixed(1)}%`,
    positive: isPos,
    zero: pct === 0,
  }
}

const metrics = computed(() => {
  const currOrders = filteredOrders.value
  const priorOrders = priorPeriodOrders.value

  const currSales = currOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0)
  const priorSales = priorOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0)

  const currCount = currOrders.length
  const priorCount = priorOrders.length

  const currUnits = currOrders.reduce((s, o) => s + (o.order_items || []).reduce((sum, i) => sum + (i.qty || 0), 0), 0)
  const priorUnits = priorOrders.reduce((s, o) => s + (o.order_items || []).reduce((sum, i) => sum + (i.qty || 0), 0), 0)

  const currTicket = currCount > 0 ? currSales / currCount : 0
  const priorTicket = priorCount > 0 ? priorSales / priorCount : 0

  return {
    sales: {
      current: currSales,
      prior: priorSales,
      diff: calcVariation(currSales, priorSales),
    },
    count: {
      current: currCount,
      prior: priorCount,
      diff: calcVariation(currCount, priorCount),
    },
    ticket: {
      current: currTicket,
      prior: priorTicket,
      diff: calcVariation(currTicket, priorTicket),
    },
    units: {
      current: currUnits,
      prior: priorUnits,
      diff: calcVariation(currUnits, priorUnits),
    },
  }
})

// Conteo de estados según el rango de fechas seleccionado
const statusCounts = computed(() => {
  const win = dateWindows.value.current
  const base = win
    ? orders.value.filter((o) => {
        const t = new Date(o.created_at).getTime()
        return t >= win.from.getTime() && t <= win.to.getTime()
      })
    : orders.value

  const counts = {
    all: base.length,
    pendiente: 0,
    pagado: 0,
    enviado: 0,
    entregado: 0,
    cancelado: 0,
  }
  for (const o of base) {
    if (counts[o.status] !== undefined) {
      counts[o.status]++
    }
  }
  return counts
})

// Conteo de pedidos que usaron cupón en la selección de fecha
const withCouponCount = computed(() => {
  const win = dateWindows.value.current
  const base = win
    ? orders.value.filter((o) => {
        const t = new Date(o.created_at).getTime()
        return t >= win.from.getTime() && t <= win.to.getTime()
      })
    : orders.value
  return base.filter((o) => Boolean(o.coupon_code)).length
})

// Lista única de códigos de cupón usados en los pedidos
const uniqueCouponsInOrders = computed(() => {
  const set = new Set()
  for (const o of orders.value) {
    if (o.coupon_code) set.add(o.coupon_code.toUpperCase())
  }
  return Array.from(set).sort()
})

// Agrupación por Día
const ordersByDay = computed(() => {
  const map = {}
  for (const o of filteredOrders.value) {
    const d = new Date(o.created_at)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

    if (!map[key]) {
      map[key] = {
        key,
        label,
        rawDate: d,
        orders: [],
        total: 0,
        units: 0,
      }
    }
    map[key].orders.push(o)
    map[key].total += Number(o.subtotal || 0)
    map[key].units += (o.order_items || []).reduce((s, i) => s + (i.qty || 0), 0)
  }
  return Object.values(map).sort((a, b) => b.rawDate - a.rawDate)
})

// Agrupación por Mes
const ordersByMonth = computed(() => {
  const map = {}
  for (const o of filteredOrders.value) {
    const d = new Date(o.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const rawMonth = d.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
    const label = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)

    if (!map[key]) {
      map[key] = {
        key,
        label,
        orders: [],
        total: 0,
        units: 0,
      }
    }
    map[key].orders.push(o)
    map[key].total += Number(o.subtotal || 0)
    map[key].units += (o.order_items || []).reduce((s, i) => s + (i.qty || 0), 0)
  }
  return Object.values(map).sort((a, b) => b.key.localeCompare(a.key))
})

function toggleGroup(key) {
  expandedGroups.value[key] = !expandedGroups.value[key]
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  couponFilter.value = 'all'
  setPreset('all')
}

// Exportar a Excel (.xlsx)
function exportToExcel() {
  if (!filteredOrders.value.length) {
    alert('No hay pedidos en la selección actual para exportar.')
    return
  }

  const rows = filteredOrders.value.map((order) => {
    const itemsDetail = (order.order_items || [])
      .map((i) => {
        const pName = i.products?.name || 'Producto'
        return `${pName} x${i.qty} ($${Number(i.price).toFixed(2)})`
      })
      .join('; ')

    const clientName = [order.profiles?.name || order.customer_name || 'Anónimo', order.profiles?.lastname || '']
      .filter(Boolean)
      .join(' ')

    const dateObj = new Date(order.created_at)
    const dateFormatted = dateObj.toLocaleDateString('es-VE')
    const timeFormatted = dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    const totalUnits = (order.order_items || []).reduce((s, i) => s + (i.qty || 0), 0)

    return {
      'N° Pedido': `#${String(order.id).padStart(4, '0')}`,
      Fecha: dateFormatted,
      Hora: timeFormatted,
      Cliente: clientName,
      Teléfono: order.customer_phone || '—',
      'Artículos / Detalle': itemsDetail || '—',
      'Unidades Totales': totalUnits,
      'Cupón': order.coupon_code ? `${order.coupon_code} (-${order.coupon_discount}%)` : '—',
      'Descuento Cupón ($)': order.coupon_amount ? Number(Number(order.coupon_amount).toFixed(2)) : 0,
      'Total Facturado ($)': Number(Number(order.subtotal || 0).toFixed(2)),
      Estado: (order.status || 'pendiente').toUpperCase(),
    }
  })

  // Fila de resumen total
  const totalSalesVal = filteredOrders.value.reduce((s, o) => s + Number(o.subtotal || 0), 0)
  const totalUnitsVal = filteredOrders.value.reduce(
    (s, o) => s + (o.order_items || []).reduce((sum, i) => sum + (i.qty || 0), 0),
    0,
  )
  const totalCouponDiscVal = filteredOrders.value.reduce((s, o) => s + Number(o.coupon_amount || 0), 0)

  rows.push({}) // Fila vacía
  rows.push({
    'N° Pedido': 'TOTALES',
    Fecha: '',
    Hora: '',
    Cliente: `Total Pedidos: ${filteredOrders.value.length}`,
    Teléfono: '',
    'Artículos / Detalle': '',
    'Unidades Totales': totalUnitsVal,
    'Cupón': `Con cupón: ${filteredOrders.value.filter((o) => o.coupon_code).length}`,
    'Descuento Cupón ($)': Number(totalCouponDiscVal.toFixed(2)),
    'Total Facturado ($)': Number(totalSalesVal.toFixed(2)),
    Estado: '',
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 26 },
    { wch: 16 },
    { wch: 45 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas')

  const nowStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Ventas_Detallitos_${nowStr}.xlsx`)
}

// Modal: Registrar Venta Manual
function openManualSaleModal() {
  const now = new Date()
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  manualForm.value = {
    customer_name: '',
    customer_phone: '',
    status: 'pagado',
    created_at: localIso,
    coupon_code: '',
    coupon_discount: 0,
    items: [],
  }
  selectedProdId.value = ''
  manualProductSearch.value = ''
  manualSaleModal.value = true
}

function onManualCouponChange() {
  if (!manualForm.value.coupon_code) {
    manualForm.value.coupon_discount = 0
    return
  }
  const found = allCoupons.value.find((c) => c.code.toUpperCase() === manualForm.value.coupon_code.toUpperCase())
  if (found) {
    manualForm.value.coupon_discount = Number(found.discount || 0)
  }
}

const availableProducts = computed(() => {
  let list = catalog.products || []
  if (manualProductSearch.value.trim()) {
    const q = manualProductSearch.value.toLowerCase().trim()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  return list
})

function addProductToSale() {
  if (!selectedProdId.value) return
  const prod = catalog.products.find((p) => p.id === Number(selectedProdId.value))
  if (!prod) return

  const existing = manualForm.value.items.find((i) => i.id === prod.id)
  if (existing) {
    existing.qty += 1
  } else {
    manualForm.value.items.push({
      id: prod.id,
      name: prod.name,
      price: Number(prod.price || 0),
      originalPrice: Number(prod.originalPrice || prod.price || 0),
      image: prod.image || '',
      qty: 1,
    })
  }
  selectedProdId.value = ''
}

function removeManualItem(index) {
  manualForm.value.items.splice(index, 1)
}

const manualSaleSubtotal = computed(() => {
  return manualForm.value.items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
})

const manualCouponDiscountAmount = computed(() => {
  if (!manualForm.value.coupon_code || !manualForm.value.coupon_discount) return 0
  return (manualSaleSubtotal.value * Number(manualForm.value.coupon_discount)) / 100
})

const manualSaleTotal = computed(() => {
  return Math.max(0, manualSaleSubtotal.value - manualCouponDiscountAmount.value)
})

async function saveManualSale() {
  if (!manualForm.value.customer_name.trim()) {
    alert('Por favor indica el nombre del cliente.')
    return
  }
  if (!manualForm.value.items.length) {
    alert('Debes agregar al menos un producto a la venta.')
    return
  }

  savingManualSale.value = true
  const orderPayload = {
    customer_name: manualForm.value.customer_name.trim(),
    customer_phone: manualForm.value.customer_phone?.trim() || null,
    subtotal: Number(manualSaleTotal.value.toFixed(2)),
    status: manualForm.value.status || 'pagado',
    created_at: manualForm.value.created_at ? new Date(manualForm.value.created_at).toISOString() : new Date().toISOString(),
  }

  const itemsPayload = manualForm.value.items.map((i) => ({
    id: i.id,
    qty: Number(i.qty) || 1,
    price: Number(i.price) || 0,
  }))

  const res = await insertOrder(orderPayload, itemsPayload)
  savingManualSale.value = false

  if (res.error) {
    alert('Error al registrar la venta: ' + (res.error.message || res.error))
    return
  }

  // Si se aplicó cupón a la venta manual, registrarlo en la asociación
  if (res.data?.id && manualForm.value.coupon_code) {
    await recordOrderCoupon(res.data.id, {
      code: manualForm.value.coupon_code.toUpperCase(),
      discount: manualForm.value.coupon_discount,
      amount: manualCouponDiscountAmount.value,
    })
  }

  manualSaleModal.value = false
  await load()
}
</script>

<template>
  <div class="orders-page">
    <!-- Encabezado Principal y Acciones -->
    <div class="admin-toolbar">
      <div>
        <h1 class="admin-title">Pedidos / Ventas</h1>
        <p class="admin-subtitle">
          Métricas de ventas, comparación de períodos, agrupación por fecha y registro de ventas.
        </p>
      </div>
      <div class="toolbar-actions">
        <button class="admin-btn admin-btn-ghost export-btn" title="Exportar reporte en formato Excel .xlsx" @click="exportToExcel">
          <AppIcon name="download" :size="16" />
          Exportar a Excel
        </button>
        <button class="admin-btn new-sale-btn" @click="openManualSaleModal">
          <AppIcon name="plus" :size="16" />
          Registrar Venta
        </button>
      </div>
    </div>

    <!-- Tarjetas de Métricas con Comparaciones -->
    <div class="metrics-grid">
      <!-- Total Facturado -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Ventas Totales</span>
          <span
            v-if="dateWindows.prior"
            class="badge-diff"
            :class="{ positive: metrics.sales.diff.positive, negative: !metrics.sales.diff.positive && !metrics.sales.diff.zero }"
          >
            <AppIcon :name="metrics.sales.diff.positive ? 'trendingUp' : 'trendingDown'" :size="12" />
            {{ metrics.sales.diff.text }}
          </span>
        </div>
        <div class="metric-value">${{ metrics.sales.current.toFixed(2) }}</div>
        <div class="metric-sub">
          <template v-if="dateWindows.prior">
            vs. {{ dateWindows.priorLabel }} (${{ metrics.sales.prior.toFixed(2) }})
          </template>
          <template v-else>
            {{ dateWindows.label }}
          </template>
        </div>
      </div>

      <!-- Total Pedidos -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Total Pedidos</span>
          <span
            v-if="dateWindows.prior"
            class="badge-diff"
            :class="{ positive: metrics.count.diff.positive, negative: !metrics.count.diff.positive && !metrics.count.diff.zero }"
          >
            <AppIcon :name="metrics.count.diff.positive ? 'trendingUp' : 'trendingDown'" :size="12" />
            {{ metrics.count.diff.text }}
          </span>
        </div>
        <div class="metric-value">{{ metrics.count.current }} <span class="val-unit">pedidos</span></div>
        <div class="metric-sub">
          <template v-if="dateWindows.prior">
            vs. {{ dateWindows.priorLabel }} ({{ metrics.count.prior }} pedidos)
          </template>
          <template v-else>
            {{ dateWindows.label }}
          </template>
        </div>
      </div>

      <!-- Ticket Promedio -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Ticket Promedio</span>
          <span
            v-if="dateWindows.prior"
            class="badge-diff"
            :class="{ positive: metrics.ticket.diff.positive, negative: !metrics.ticket.diff.positive && !metrics.ticket.diff.zero }"
          >
            <AppIcon :name="metrics.ticket.diff.positive ? 'trendingUp' : 'trendingDown'" :size="12" />
            {{ metrics.ticket.diff.text }}
          </span>
        </div>
        <div class="metric-value">${{ metrics.ticket.current.toFixed(2) }}</div>
        <div class="metric-sub">
          <template v-if="dateWindows.prior">
            vs. {{ dateWindows.priorLabel }} (${{ metrics.ticket.prior.toFixed(2) }})
          </template>
          <template v-else>
            Promedio por venta
          </template>
        </div>
      </div>

      <!-- Unidades Vendidas -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Unidades Vendidas</span>
          <span
            v-if="dateWindows.prior"
            class="badge-diff"
            :class="{ positive: metrics.units.diff.positive, negative: !metrics.units.diff.positive && !metrics.units.diff.zero }"
          >
            <AppIcon :name="metrics.units.diff.positive ? 'trendingUp' : 'trendingDown'" :size="12" />
            {{ metrics.units.diff.text }}
          </span>
        </div>
        <div class="metric-value">{{ metrics.units.current }} <span class="val-unit">artículos</span></div>
        <div class="metric-sub">
          <template v-if="dateWindows.prior">
            vs. {{ dateWindows.priorLabel }} ({{ metrics.units.prior }} uds)
          </template>
          <template v-else>
            En {{ metrics.count.current }} transacciones
          </template>
        </div>
      </div>
    </div>

    <!-- Barra de Rangos de Fecha y Modo de Agrupación -->
    <div class="control-panel">
      <!-- Selector de Rangos Rápidos -->
      <div class="date-presets-row">
        <div class="presets-group">
          <span class="filter-label"><AppIcon name="calendar" :size="14" /> Período:</span>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === 'all' }"
            @click="setPreset('all')"
          >
            Todo
          </button>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === 'today' }"
            @click="setPreset('today')"
          >
            Hoy
          </button>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === '7days' }"
            @click="setPreset('7days')"
          >
            7 días
          </button>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === 'this_month' }"
            @click="setPreset('this_month')"
          >
            Este mes
          </button>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === 'last_month' }"
            @click="setPreset('last_month')"
          >
            Mes pasado
          </button>
          <button
            class="preset-btn"
            :class="{ active: rangePreset === 'custom' }"
            @click="rangePreset = 'custom'"
          >
            Personalizado
          </button>
        </div>

        <!-- Inputs de Rango Personalizado -->
        <div v-if="rangePreset === 'custom'" class="custom-range-inputs">
          <div class="date-input-wrap">
            <span class="date-tag">Desde:</span>
            <input v-model="dateFrom" type="date" class="date-picker" />
          </div>
          <div class="date-input-wrap">
            <span class="date-tag">Hasta:</span>
            <input v-model="dateTo" type="date" class="date-picker" />
          </div>
        </div>

        <!-- Selector de Agrupación / Vista -->
        <div class="view-mode-selector">
          <span class="filter-label"><AppIcon name="layers" :size="14" /> Agrupar:</span>
          <div class="view-tabs">
            <button
              class="view-tab-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              Detallado
            </button>
            <button
              class="view-tab-btn"
              :class="{ active: viewMode === 'by_day' }"
              @click="viewMode = 'by_day'"
            >
              Por Día
            </button>
            <button
              class="view-tab-btn"
              :class="{ active: viewMode === 'by_month' }"
              @click="viewMode = 'by_month'"
            >
              Por Mes
            </button>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros por Estado y Búsqueda -->
      <div class="filter-bar">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'all' && couponFilter === 'all' }"
            @click="statusFilter = 'all'; couponFilter = 'all'"
          >
            Todos <span class="tab-count">{{ statusCounts.all }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'pendiente' }"
            @click="statusFilter = 'pendiente'"
          >
            Pendiente <span class="tab-count">{{ statusCounts.pendiente }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'pagado' }"
            @click="statusFilter = 'pagado'"
          >
            Pagado <span class="tab-count">{{ statusCounts.pagado }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'enviado' }"
            @click="statusFilter = 'enviado'"
          >
            Enviado <span class="tab-count">{{ statusCounts.enviado }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'entregado' }"
            @click="statusFilter = 'entregado'"
          >
            Entregado <span class="tab-count">{{ statusCounts.entregado }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: statusFilter === 'cancelado' }"
            @click="statusFilter = 'cancelado'"
          >
            Cancelado <span class="tab-count">{{ statusCounts.cancelado }}</span>
          </button>

          <!-- Filtro rápido por Cupón -->
          <button
            class="tab-btn coupon-tab"
            :class="{ active: couponFilter === 'with_coupon' }"
            title="Filtrar pedidos que usaron cupón de descuento"
            @click="couponFilter = couponFilter === 'with_coupon' ? 'all' : 'with_coupon'"
          >
            <span class="tab-icon">🎟</span> Con Cupón <span class="tab-count">{{ withCouponCount }}</span>
          </button>
        </div>

        <div class="filter-controls">
          <!-- Selector de Cupones usados si hay variedad -->
          <div v-if="uniqueCouponsInOrders.length" class="coupon-dropdown-box">
            <select
              v-model="couponFilter"
              class="coupon-filter-select"
              :class="{ 'has-filter': couponFilter !== 'all' }"
              title="Filtrar por código de cupón"
            >
              <option value="all">🎟 Todos los pedidos</option>
              <option value="with_coupon">Con cualquier cupón ({{ withCouponCount }})</option>
              <option value="without_coupon">Sin cupón</option>
              <optgroup label="Cupones específicos:">
                <option v-for="c in uniqueCouponsInOrders" :key="c" :value="c">
                  Cupón: {{ c }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="search-box">
            <AppIcon name="search" :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por #, cliente, teléfono o cupón..."
              class="search-input"
            />
            <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
              <AppIcon name="close" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENIDO SEGÚN MODO DE VISTA -->
    <div v-if="loaded" class="admin-card">
      <!-- 1. VISTA DETALLADA INDIVIDUAL -->
      <div v-if="viewMode === 'list'" class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Artículos</th>
              <th>Cupón</th>
              <th>Total</th>
              <th>Fecha y Hora</th>
              <th>Estado</th>
              <th>Factura</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td>
                <span class="order-id-badge">#{{ String(order.id).padStart(4, '0') }}</span>
              </td>
              <td>
                <div class="client-cell">
                  <strong>{{ order.profiles?.name || order.customer_name || 'Anónimo' }}</strong>
                  <span v-if="order.profiles?.lastname"> {{ order.profiles?.lastname }}</span>
                  <small v-if="order.customer_phone" class="client-phone">{{ order.customer_phone }}</small>
                </div>
              </td>
              <td>
                <div v-if="order.order_items?.length" class="items-cell">
                  <span class="items-count">
                    {{ order.order_items.reduce((s, i) => s + i.qty, 0) }} uds
                  </span>
                  <div class="items-popover">
                    <span v-for="it in order.order_items" :key="it.id" class="it-pill">
                      {{ it.products?.name || 'Producto' }} (x{{ it.qty }})
                    </span>
                  </div>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <!-- Columna de Cupón -->
              <td>
                <div
                  v-if="order.coupon_code"
                  class="order-coupon-badge"
                  :title="`Cupón ${order.coupon_code}: -${order.coupon_discount}% ($${Number(order.coupon_amount || 0).toFixed(2)})`"
                >
                  <span class="coupon-code-text">{{ order.coupon_code }}</span>
                  <span class="coupon-disc-text">-{{ order.coupon_discount }}%</span>
                </div>
                <span v-else class="muted">—</span>
              </td>
              <td class="order-price">${{ Number(order.subtotal || 0).toFixed(2) }}</td>
              <td class="muted">
                {{ new Date(order.created_at).toLocaleDateString('es-VE') }}
                <span class="time-sub">{{ new Date(order.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </td>
              <td>
                <select
                  class="status-select"
                  :class="`status-${order.status}`"
                  :value="order.status"
                  @change="changeStatus(order, $event)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td>
                <button
                  class="admin-mini invoice-btn"
                  title="Ver / Imprimir Factura con descuentos"
                  aria-label="Factura"
                  @click="cart.printInvoice(order)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. VISTA AGRUPADA POR DÍA -->
      <div v-else-if="viewMode === 'by_day'" class="grouped-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cantidad Pedidos</th>
              <th>Unidades Vendidas</th>
              <th>Ticket Promedio</th>
              <th>Total Facturado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="grp in ordersByDay" :key="grp.key">
              <tr class="group-row" :class="{ 'is-expanded': expandedGroups[grp.key] }" @click="toggleGroup(grp.key)">
                <td>
                  <strong>{{ grp.label }}</strong>
                </td>
                <td>
                  <span class="pill-metric">{{ grp.orders.length }} pedidos</span>
                </td>
                <td>{{ grp.units }} uds</td>
                <td>${{ (grp.total / grp.orders.length).toFixed(2) }}</td>
                <td class="order-price">${{ grp.total.toFixed(2) }}</td>
                <td>
                  <button class="expand-btn">
                    {{ expandedGroups[grp.key] ? 'Ocultar ▲' : 'Ver pedidos ▼' }}
                  </button>
                </td>
              </tr>
              <!-- Desglose de pedidos del día -->
              <tr v-if="expandedGroups[grp.key]" class="subtable-row">
                <td colspan="7">
                  <div class="nested-orders">
                    <table class="nested-table">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Artículos</th>
                          <th>Cupón</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th>Factura</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="subOrder in grp.orders" :key="subOrder.id">
                          <td><span class="order-id-badge">#{{ String(subOrder.id).padStart(4, '0') }}</span></td>
                          <td>{{ subOrder.profiles?.name || subOrder.customer_name || 'Anónimo' }}</td>
                          <td>{{ subOrder.order_items?.length || 0 }} uds</td>
                          <td>
                            <div v-if="subOrder.coupon_code" class="order-coupon-badge sm">
                              <span class="coupon-code-text">{{ subOrder.coupon_code }}</span>
                              <span class="coupon-disc-text">-{{ subOrder.coupon_discount }}%</span>
                            </div>
                            <span v-else class="muted">—</span>
                          </td>
                          <td class="order-price">${{ Number(subOrder.subtotal).toFixed(2) }}</td>
                          <td>
                            <select
                              class="status-select"
                              :class="`status-${subOrder.status}`"
                              :value="subOrder.status"
                              @change="changeStatus(subOrder, $event)"
                            >
                              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                            </select>
                          </td>
                          <td>
                            <button
                              class="admin-mini invoice-btn"
                              title="Ver Factura"
                              @click="cart.printInvoice(subOrder)"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 3. VISTA AGRUPADA POR MES -->
      <div v-else-if="viewMode === 'by_month'" class="grouped-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mes / Año</th>
              <th>Cantidad Pedidos</th>
              <th>Unidades Vendidas</th>
              <th>Ticket Promedio</th>
              <th>Total Facturado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="grp in ordersByMonth" :key="grp.key">
              <tr class="group-row" :class="{ 'is-expanded': expandedGroups[grp.key] }" @click="toggleGroup(grp.key)">
                <td>
                  <strong>{{ grp.label }}</strong>
                </td>
                <td>
                  <span class="pill-metric">{{ grp.orders.length }} pedidos</span>
                </td>
                <td>{{ grp.units }} uds</td>
                <td>${{ (grp.total / grp.orders.length).toFixed(2) }}</td>
                <td class="order-price">${{ grp.total.toFixed(2) }}</td>
                <td>
                  <button class="expand-btn">
                    {{ expandedGroups[grp.key] ? 'Ocultar ▲' : 'Ver pedidos ▼' }}
                  </button>
                </td>
              </tr>
              <!-- Desglose de pedidos del mes -->
              <tr v-if="expandedGroups[grp.key]" class="subtable-row">
                <td colspan="7">
                  <div class="nested-orders">
                    <table class="nested-table">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Artículos</th>
                          <th>Cupón</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th>Factura</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="subOrder in grp.orders" :key="subOrder.id">
                          <td><span class="order-id-badge">#{{ String(subOrder.id).padStart(4, '0') }}</span></td>
                          <td class="muted">{{ new Date(subOrder.created_at).toLocaleDateString('es-VE') }}</td>
                          <td>{{ subOrder.profiles?.name || subOrder.customer_name || 'Anónimo' }}</td>
                          <td>{{ subOrder.order_items?.length || 0 }} uds</td>
                          <td>
                            <div v-if="subOrder.coupon_code" class="order-coupon-badge sm">
                              <span class="coupon-code-text">{{ subOrder.coupon_code }}</span>
                              <span class="coupon-disc-text">-{{ subOrder.coupon_discount }}%</span>
                            </div>
                            <span v-else class="muted">—</span>
                          </td>
                          <td class="order-price">${{ Number(subOrder.subtotal).toFixed(2) }}</td>
                          <td>
                            <select
                              class="status-select"
                              :class="`status-${subOrder.status}`"
                              :value="subOrder.status"
                              @change="changeStatus(subOrder, $event)"
                            >
                              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                            </select>
                          </td>
                          <td>
                            <button
                              class="admin-mini invoice-btn"
                              title="Ver Factura"
                              @click="cart.printInvoice(subOrder)"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Estado Vacío -->
      <div v-if="!filteredOrders.length" class="admin-empty">
        <p v-if="!orders.length">Aún no hay ventas registradas.</p>
        <div v-else class="empty-search">
          <p>No se encontraron pedidos en el rango o filtros seleccionados.</p>
          <button class="admin-btn admin-btn-ghost btn-sm" @click="clearFilters">Limpiar todos los filtros</button>
        </div>
      </div>
    </div>

    <!-- MODAL: REGISTRAR VENTA MANUAL (POS) -->
    <div v-if="manualSaleModal" class="admin-modal" @click.self="manualSaleModal = false">
      <div class="admin-modal-card modal-wide">
        <div class="admin-modal-head">
          <div>
            <h3 class="admin-modal-title">Registrar Venta</h3>
            <p class="modal-subtitle">Agrega una venta de mostrador o pedido directo al sistema.</p>
          </div>
          <button class="admin-mini" @click="manualSaleModal = false">
            <AppIcon name="close" :size="16" />
          </button>
        </div>

        <div class="admin-form">
          <!-- Datos del cliente y fecha -->
          <div class="admin-grid-2">
            <div class="admin-field">
              <label>Nombre del Cliente *</label>
              <input v-model="manualForm.customer_name" type="text" placeholder="Ej: María Gómez" required />
            </div>
            <div class="admin-field">
              <label>Teléfono (opcional)</label>
              <input v-model="manualForm.customer_phone" type="text" placeholder="Ej: 0412 1234567" />
            </div>
          </div>

          <div class="admin-grid-2">
            <div class="admin-field">
              <label>Fecha y Hora de la Venta</label>
              <input v-model="manualForm.created_at" type="datetime-local" />
            </div>
            <div class="admin-field">
              <label>Estado Inicial</label>
              <select v-model="manualForm.status" class="status-select-modal">
                <option v-for="s in statuses" :key="s" :value="s">{{ s.toUpperCase() }}</option>
              </select>
            </div>
          </div>

          <div class="admin-grid-2" style="margin-top: 4px;">
            <div class="admin-field">
              <label>Cupón de Descuento (Opcional)</label>
              <select v-model="manualForm.coupon_code" class="status-select-modal" @change="onManualCouponChange">
                <option value="">Sin cupón</option>
                <option v-for="c in allCoupons" :key="c.id" :value="c.code">
                  {{ c.code }} ({{ c.discount }}% OFF)
                </option>
              </select>
            </div>
            <div v-if="manualForm.coupon_code" class="admin-field">
              <label>Descuento aplicado (%)</label>
              <input v-model.number="manualForm.coupon_discount" type="number" min="0" max="100" />
            </div>
          </div>

          <hr class="form-divider" />

          <!-- Selección de Productos -->
          <div class="product-picker-section">
            <label class="section-label">Añadir Productos del Catálogo</label>
            <div class="picker-row">
              <div class="picker-search">
                <input
                  v-model="manualProductSearch"
                  type="text"
                  placeholder="Filtrar producto por nombre..."
                  class="search-input-modal"
                />
              </div>
              <select v-model="selectedProdId" class="product-select">
                <option value="" disabled>Selecciona un producto...</option>
                <option v-for="p in availableProducts" :key="p.id" :value="p.id">
                  {{ p.name }} — ${{ Number(p.price).toFixed(2) }} (Stock: {{ p.stock }})
                </option>
              </select>
              <button
                type="button"
                class="admin-btn admin-btn-secondary"
                :disabled="!selectedProdId"
                @click="addProductToSale"
              >
                + Añadir
              </button>
            </div>
          </div>

          <!-- Tabla de Productos Seleccionados -->
          <div class="sale-items-table-wrap">
            <table v-if="manualForm.items.length" class="sale-items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio Unit. ($)</th>
                  <th>Subtotal ($)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in manualForm.items" :key="it.id">
                  <td>
                    <div class="item-desc">
                      <img v-if="it.image" :src="resolveImage(it.image)" class="item-thumb" :alt="it.name" />
                      <strong>{{ it.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <div class="qty-control">
                      <button type="button" class="qty-btn" @click="it.qty = Math.max(1, it.qty - 1)">-</button>
                      <input v-model.number="it.qty" type="number" min="1" class="qty-input" />
                      <button type="button" class="qty-btn" @click="it.qty = it.qty + 1">+</button>
                    </div>
                  </td>
                  <td>
                    <input v-model.number="it.price" type="number" step="0.01" min="0" class="price-input" />
                  </td>
                  <td class="order-price">${{ (it.qty * it.price).toFixed(2) }}</td>
                  <td>
                    <button type="button" class="admin-mini danger" @click="removeManualItem(idx)">
                      <AppIcon name="trash" :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-else class="no-items-hint">No has agregado productos a la venta todavía.</p>
          </div>

          <!-- Resumen de Venta -->
          <div class="sale-summary-bar">
            <div class="summary-left">
              <span>Total Artículos: <strong>{{ manualForm.items.reduce((s, i) => s + (i.qty || 0), 0) }}</strong></span>
              <span v-if="manualCouponDiscountAmount > 0" class="manual-coupon-tag">
                Cupón {{ manualForm.coupon_code }}: -${{ manualCouponDiscountAmount.toFixed(2) }} (-{{ manualForm.coupon_discount }}%)
              </span>
            </div>
            <div class="summary-right">
              <span class="total-label">Total a Cobrar:</span>
              <span class="total-value">${{ manualSaleTotal.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="admin-form-actions">
            <button type="button" class="admin-btn admin-btn-ghost" @click="manualSaleModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="admin-btn new-sale-btn"
              :disabled="savingManualSale || !manualForm.items.length || !manualForm.customer_name.trim()"
              @click="saveManualSale"
            >
              {{ savingManualSale ? 'Guardando venta...' : 'Guardar y Registrar Venta' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  font-family: var(--font-body);
}

.admin-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 4px;
}

.admin-subtitle {
  color: var(--ink-400);
  font-size: 13px;
  margin-top: 2px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-btn {
  background: #ffffff;
  border: 1px solid #10b981;
  color: #059669;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #ecfdf5;
  color: #047857;
  border-color: #059669;
}

.new-sale-btn {
  background: var(--rose-600);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
}

.new-sale-btn:hover {
  background: var(--rose-700);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--ink-400);
}

.badge-diff {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--ink-500);
}

.badge-diff.positive {
  background: #ecfdf5;
  color: #059669;
}

.badge-diff.negative {
  background: #fef2f2;
  color: #dc2626;
}

.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink-900);
  line-height: 1.2;
}

.val-unit {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-400);
}

.metric-sub {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 6px;
}

/* Control Panel */
.control-panel {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.date-presets-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.presets-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-600);
  margin-right: 4px;
}

.preset-btn {
  border: 1px solid var(--line);
  background: #ffffff;
  color: var(--ink-600);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: var(--rose-50);
  color: var(--rose-600);
  border-color: var(--rose-200);
}

.preset-btn.active {
  background: var(--rose-600);
  color: #ffffff;
  border-color: var(--rose-600);
}

.custom-range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px 8px;
}

.date-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-400);
}

.date-picker {
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--ink-800);
  outline: none;
}

.view-mode-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.view-tabs {
  display: inline-flex;
  background: #f3ecee;
  padding: 3px;
  border-radius: 8px;
  gap: 3px;
}

.view-tab-btn {
  border: none;
  background: transparent;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
  cursor: pointer;
}

.view-tab-btn.active {
  background: #ffffff;
  color: var(--rose-600);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* Filter bar status */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tabs {
  display: inline-flex;
  background: #f3ecee;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
  overflow-x: auto;
  max-width: 100%;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  text-transform: capitalize;
}

.tab-btn:hover {
  color: var(--ink-900);
}

.tab-btn.active {
  background: #ffffff;
  color: var(--rose-600);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-count {
  font-size: 11px;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 6px;
  border-radius: 10px;
}

.tab-btn.active .tab-count {
  background: var(--rose-50);
  color: var(--rose-600);
}

/* Coupon filter button in tabs */
.tab-btn.coupon-tab {
  background: #ffffff;
  border: 1px dashed #f2b8c6;
  color: #a81c42;
  font-family: 'Montserrat', sans-serif;
}

.tab-btn.coupon-tab:hover {
  background: #fff0f3;
  color: #8b1334;
  border-color: #c92a54;
}

.tab-btn.coupon-tab.active {
  background: #111111;
  color: #ffffff;
  border-color: #111111;
}

.tab-btn.coupon-tab.active .tab-count {
  background: #c92a54;
  color: #ffffff;
}

/* Coupon dropdown select in filter controls */
.coupon-dropdown-box {
  display: inline-flex;
}

.coupon-filter-select {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  background: #ffffff;
  color: var(--ink-700);
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.coupon-filter-select:focus,
.coupon-filter-select.has-filter {
  border-color: #c92a54;
  background: #fff8f9;
  color: #c92a54;
}

/* Order Coupon Badge */
.order-coupon-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff0f3;
  border: 1px solid #fccfd8;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
}

.order-coupon-badge.sm {
  padding: 2px 6px;
  font-size: 11px;
}

.coupon-code-text {
  font-weight: 800;
  font-size: 11.5px;
  color: #111111;
  letter-spacing: 0.5px;
}

.coupon-disc-text {
  font-size: 10.5px;
  font-weight: 700;
  background: #c92a54;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 2px;
}

.manual-coupon-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #c92a54;
  background: #fff0f3;
  border: 1px solid #fccfd8;
  padding: 2px 8px;
  border-radius: 4px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--ink-400);
  pointer-events: none;
}

.search-input {
  padding: 8px 32px 8px 32px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 13px;
  background: #ffffff;
  color: var(--ink-800);
  width: 250px;
  outline: none;
}

.search-input:focus {
  border-color: var(--rose-400);
}

.clear-search {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--ink-400);
  cursor: pointer;
  padding: 2px;
}

/* Table styles */
.order-id-badge {
  font-family: monospace;
  font-weight: 700;
  color: var(--ink-800);
  background: var(--rose-50);
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 12px;
}

.client-cell {
  display: flex;
  flex-direction: column;
}

.client-phone {
  font-size: 11px;
  color: var(--ink-400);
}

.items-cell {
  position: relative;
}

.items-count {
  font-size: 12px;
  color: var(--ink-600);
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 6px;
}

.items-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.it-pill {
  font-size: 11px;
  background: #faf5f5;
  border: 1px solid #f2e2e4;
  color: var(--ink-600);
  padding: 1px 6px;
  border-radius: 4px;
}

.order-price {
  font-weight: 700;
  color: var(--ink-900);
}

.time-sub {
  display: block;
  font-size: 11px;
  color: var(--ink-400);
}

.status-select {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
}

.status-select.status-pendiente {
  background: #fefce8;
  color: #854d0e;
  border-color: #fef08a;
}

.status-select.status-pagado {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.status-select.status-enviado {
  background: #f5f3ff;
  color: #6d28d9;
  border-color: #ddd6fe;
}

.status-select.status-entregado {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.status-select.status-cancelado {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.invoice-btn {
  color: var(--rose-600);
  background: var(--rose-50);
  border-color: var(--rose-200);
}

.invoice-btn:hover {
  background: var(--rose-100);
}

/* Grouped View Styles */
.group-row {
  cursor: pointer;
  transition: background 0.15s;
}

.group-row:hover {
  background: var(--rose-50);
}

.group-row.is-expanded {
  background: #fdf2f4;
}

.pill-metric {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.expand-btn {
  border: none;
  background: transparent;
  color: var(--rose-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.subtable-row td {
  padding: 0 !important;
  background: #faf8f9;
}

.nested-orders {
  padding: 12px 16px;
  border-left: 3px solid var(--rose-400);
  margin: 6px 0;
}

.nested-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.nested-table th {
  padding: 8px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-400);
  border-bottom: 1px solid var(--line);
}

.nested-table td {
  padding: 8px 12px !important;
  border-bottom: 1px solid #f0eaec;
}

/* Modal Wide */
.modal-wide {
  max-width: 680px;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 2px;
}

.status-select-modal {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  background: #ffffff;
}

.form-divider {
  border: 0;
  height: 1px;
  background: var(--line);
  margin: 16px 0;
}

.product-picker-section {
  background: #faf8f9;
  border: 1px solid #f2e4e7;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-800);
  margin-bottom: 10px;
}

.picker-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.picker-search {
  flex: 1;
}

.search-input-modal {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  background: #ffffff;
}

.product-select {
  flex: 2;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: #ffffff;
}

.sale-items-table-wrap {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.sale-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sale-items-table th {
  background: #f8fafc;
  padding: 8px 12px;
  font-size: 11px;
  text-align: left;
  color: var(--ink-500);
  border-bottom: 1px solid var(--line);
}

.sale-items-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

.item-desc {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-thumb {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  border: none;
  background: #f1f5f9;
  width: 26px;
  height: 26px;
  font-weight: 700;
  cursor: pointer;
}

.qty-input {
  width: 40px;
  text-align: center;
  border: none;
  font-size: 13px;
  outline: none;
}

.price-input {
  width: 80px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 13px;
}

.no-items-hint {
  padding: 24px;
  text-align: center;
  color: var(--ink-400);
  font-size: 13px;
}

.sale-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--rose-50);
  border: 1px solid var(--rose-200);
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.summary-left {
  font-size: 13px;
  color: var(--ink-700);
}

.summary-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-800);
}

.total-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--rose-600);
}

.empty-search {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .toolbar-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  .toolbar-actions .admin-btn {
    width: 100%;
    justify-content: center;
  }
  .date-presets-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .presets-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .preset-btn {
    flex: 1 1 auto;
    text-align: center;
  }
  .custom-range-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tab-btn {
    flex: 1 1 auto;
    text-align: center;
  }
  .filter-controls,
  .search-box,
  .search-input {
    width: 100%;
    box-sizing: border-box;
  }
  .view-mode-selector {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 8px;
  }
  .view-tabs {
    display: flex;
    width: 100%;
  }
  .view-tab-btn {
    flex: 1;
    text-align: center;
  }
  .coupon-dropdown-box,
  .coupon-filter-select {
    width: 100%;
    box-sizing: border-box;
  }
  .sale-summary-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .total-value {
    font-size: 18px;
  }
  .client-cell strong {
    font-size: 12.5px;
  }
  .order-price {
    font-size: 13px;
  }
}
</style>
