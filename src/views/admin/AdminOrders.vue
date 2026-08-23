<script setup>
import { ref, onMounted } from 'vue'
import { listOrders, updateOrderStatus } from '@/lib/db'

const orders = ref([])
const loaded = ref(false)

const statuses = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']

async function load() {
  const res = await listOrders()
  orders.value = res.data || []
  loaded.value = true
}

onMounted(load)

async function changeStatus(order, event) {
  await updateOrderStatus(order.id, event.target.value)
  await load()
}

const totalSales = () => orders.value.reduce((sum, o) => sum + (o.subtotal || 0), 0)
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Pedidos / Ventas</p>
      <div class="admin-summary">
        <span class="muted">{{ orders.length }} pedidos</span>
        <span class="admin-total">Ventas: ${{ totalSales() }}</span>
      </div>
    </div>

    <div v-if="loaded" class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td><strong>#{{ String(order.id).padStart(4, '0') }}</strong></td>
              <td>
                {{ order.profiles?.name || order.customer_name || 'Anónimo' }}
                {{ order.profiles?.lastname || '' }}
              </td>
              <td>
                <span v-if="order.order_items?.length">
                  {{ order.order_items.reduce((s, i) => s + i.qty, 0) }} uds
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td>${{ order.subtotal }}</td>
              <td class="muted">{{ new Date(order.created_at).toLocaleDateString() }}</td>
              <td>
                <select class="status-select" :value="order.status" @change="changeStatus(order, $event)">
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!orders.length" class="admin-empty">Aún no hay ventas registradas.</p>
    </div>
  </div>
</template>

<style scoped>
.admin-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-total {
  font-weight: 700;
  color: var(--rose-600);
  font-size: 16px;
}

.muted {
  color: var(--ink-400);
}

.status-select {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--ink-700);
  background: var(--white);
}
</style>
