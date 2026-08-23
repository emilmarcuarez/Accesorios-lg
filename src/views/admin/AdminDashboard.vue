<script setup>
import { ref, onMounted, computed } from 'vue'
import { listProducts, listOrders, listCoupons } from '@/lib/db'

const products = ref([])
const orders = ref([])
const coupons = ref([])
const loaded = ref(false)

const stats = computed(() => [
  { label: 'Productos', value: products.value.length, icon: 'bag' },
  { label: 'Pedidos', value: orders.value.length, icon: 'search' },
  { label: 'Cupones activos', value: coupons.value.filter((c) => c.active).length, icon: 'gift' },
  {
    label: 'Bajo stock',
    value: products.value.filter((p) => (p.stock ?? 0) <= 5).length,
    icon: 'truck',
  },
])

onMounted(async () => {
  const [p, o, c] = await Promise.all([listProducts(), listOrders(), listCoupons()])
  products.value = p.data || []
  orders.value = o.data || []
  coupons.value = c.data || []
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="dash">
    <div class="dash-stats">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
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
            <tr>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders.slice(0, 6)" :key="order.id">
              <td>
                {{ order.profiles?.name || order.customer_name || 'Anónimo' }}
                {{ order.profiles?.lastname || '' }}
              </td>
              <td>${{ order.subtotal }}</td>
              <td><span class="status" :class="'st-' + order.status">{{ order.status }}</span></td>
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
  margin-bottom: 26px;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  color: var(--rose-600);
}

.stat-label {
  color: var(--ink-500);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  margin-bottom: 16px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--ink-900);
}

.panel-link {
  font-size: 13px;
  color: var(--rose-600);
  font-weight: 600;
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
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid #f7e9ec;
  font-size: 14px;
  color: var(--ink-700);
}

.status {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.st-pendiente {
  background: #fff3e0;
  color: #b26a00;
}

.st-pagado {
  background: #e3f6e9;
  color: #1f8a4c;
}

.st-enviado {
  background: #e3edfb;
  color: #1f5fbf;
}

.st-entregado {
  background: #f0e6fb;
  color: #6a3fb5;
}

.empty {
  color: var(--ink-400);
  text-align: center;
  padding: 30px;
}

@media (max-width: 700px) {
  .dash-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
