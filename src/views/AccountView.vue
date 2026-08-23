<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { listMyOrders } from '@/lib/db'
import { formatPrice } from '@/utils/format'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const orders = ref([])
const saved = ref(false)

const form = ref({
  name: '',
  lastname: '',
  phone: '',
  saveCarts: true,
  notifications: true,
})

onMounted(async () => {
  await auth.fetchProfile()
  syncForm()
  if (auth.isAuthenticated) {
    await cart.loadSaved()
    const res = await listMyOrders(auth.user.id)
    orders.value = res.data || []
  }
})

function syncForm() {
  form.value = {
    name: auth.profile?.name || '',
    lastname: auth.profile?.lastname || '',
    phone: auth.profile?.phone || '',
    saveCarts: auth.profile?.save_carts ?? true,
    notifications: auth.profile?.notifications ?? true,
  }
}

async function save() {
  saved.value = false
  await auth.updateProfile(form.value)
  saved.value = true
}

async function deleteCart() {
  if (!confirm('¿Eliminar el carrito guardado?')) return
  await cart.clearSaved()
}

function statusLabel(status) {
  const map = { pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' }
  return map[status] || status
}

async function logout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <main class="account">
    <section class="account-hero">
      <div class="container">
        <span class="eyebrow">Mi cuenta</span>
        <h1 class="account-title">Hola, {{ auth.fullName || auth.user?.email }}</h1>
        <p class="account-sub">{{ auth.user?.email }}</p>
      </div>
    </section>

    <section class="container account-body">
      <div class="account-form">
        <h2 class="form-title">Mis datos</h2>
        <label class="field">
          <span>Nombre</span>
          <input v-model="form.name" type="text" />
        </label>
        <label class="field">
          <span>Apellido</span>
          <input v-model="form.lastname" type="text" />
        </label>
        <label class="field">
          <span>Teléfono</span>
          <input v-model="form.phone" type="tel" />
        </label>

        <h2 class="form-title">Preferencias</h2>
        <label class="check">
          <input v-model="form.saveCarts" type="checkbox" />
          <span>Guardar mi carrito para compras futuras</span>
        </label>
        <label class="check">
          <input v-model="form.notifications" type="checkbox" />
          <span>Recibir notificaciones de descuentos y cupones</span>
        </label>

        <p v-if="saved" class="form-success">Guardado correctamente.</p>

        <div class="actions">
          <button class="btn btn-primary" @click="save">Guardar cambios</button>
          <button class="btn btn-outline" @click="logout">
            <AppIcon name="close" :size="16" />
            Cerrar sesión
          </button>
        </div>
      </div>

      <div class="account-col">
        <div class="account-form">
          <h2 class="form-title">Mis carritos</h2>
          <div v-if="cart.items.length" class="cart-summary">
            <p class="cart-line">
              Tienes <strong>{{ cart.count }}</strong> producto(s) en tu carrito
              <span class="cart-total">{{ cart.formattedSubtotal }}</span>
            </p>
            <div class="mini-actions">
              <router-link to="/tienda" class="btn btn-ghost">Ver productos</router-link>
              <button class="btn btn-outline" @click="deleteCart">Eliminar carrito guardado</button>
            </div>
          </div>
          <p v-else class="empty-note">No tienes un carrito guardado.</p>
        </div>

        <div class="account-form">
          <h2 class="form-title">Mis compras</h2>
          <div v-if="orders.length" class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-head">
                <strong>#{{ String(order.id).padStart(4, '0') }}</strong>
                <span class="status" :class="'st-' + order.status">{{ statusLabel(order.status) }}</span>
              </div>
              <p class="order-date">{{ new Date(order.created_at).toLocaleDateString('es-VE') }}</p>
              <ul class="order-items">
                <li v-for="item in order.order_items" :key="item.id">
                  <span>{{ item.qty }}x</span> {{ item.name || 'Producto' }}
                </li>
              </ul>
              <p class="order-total">Total: {{ formatPrice(order.subtotal) }}</p>
            </div>
          </div>
          <p v-else class="empty-note">Aún no tienes compras registradas.</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.account {
  background: linear-gradient(120deg, #fff8f6, #fbe9ee);
  min-height: 70vh;
}

.account-hero {
  background: var(--rose-gradient);
  color: var(--white);
  text-align: center;
  padding: 54px 0;
}

.account-hero .eyebrow {
  color: rgba(255, 255, 255, 0.9);
}

.account-title {
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 52px);
  font-weight: 600;
}

.account-sub {
  opacity: 0.95;
  margin-top: 6px;
}

.account-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding-top: 50px;
  padding-bottom: 60px;
}

.account-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-form {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 30px;
}

.form-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--ink-900);
  margin-bottom: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
}

.field input:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--ink-700);
  margin-bottom: 12px;
  cursor: pointer;
}

.check input {
  width: 17px;
  height: 17px;
  accent-color: var(--rose-600);
}

.form-success {
  color: var(--rose-600);
  font-weight: 500;
  font-size: 14px;
  margin: 10px 0;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.cart-summary {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 18px;
  background: var(--rose-50);
}

.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: var(--ink-700);
  margin-bottom: 14px;
  gap: 10px;
}

.cart-total {
  font-weight: 700;
  color: var(--rose-600);
}

.mini-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.order-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px 18px;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.status {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.st-pendiente { background: #fff3e0; color: #b26a00; }
.st-pagado { background: #e3f6e9; color: #1f8a4c; }
.st-enviado { background: #e3edfb; color: #1f5fbf; }
.st-entregado { background: #f0e6fb; color: #6a3fb5; }
.st-cancelado { background: #fbe9e9; color: #b04b4b; }

.order-date {
  font-size: 12px;
  color: var(--ink-400);
  margin-bottom: 8px;
}

.order-items {
  list-style: none;
  margin-bottom: 8px;
}

.order-items li {
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 3px;
}

.order-items span {
  font-weight: 600;
  color: var(--ink-700);
}

.order-total {
  font-weight: 700;
  color: var(--ink-900);
}

.empty-note {
  color: var(--ink-400);
  font-size: 14px;
}

@media (max-width: 800px) {
  .account-body {
    grid-template-columns: 1fr;
  }
}
</style>
