<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/db'

const coupons = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const form = ref(empty())

function empty() {
  return { code: '', discount: 0, active: true }
}

async function load() {
  const res = await listCoupons()
  coupons.value = res.data || []
}

onMounted(load)

function create() {
  editing.value = null
  form.value = empty()
  modalOpen.value = true
}

function edit(coupon) {
  editing.value = coupon
  form.value = { code: coupon.code, discount: coupon.discount, active: coupon.active }
  modalOpen.value = true
}

async function save() {
  if (editing.value) await updateCoupon(editing.value.id, form.value)
  else await createCoupon(form.value)
  modalOpen.value = false
  await load()
}

async function remove(coupon) {
  if (!confirm('¿Eliminar este cupón?')) return
  await deleteCoupon(coupon.id)
  await load()
}

async function toggle(coupon) {
  await updateCoupon(coupon.id, { active: !coupon.active })
  await load()
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Cupones</p>
      <button class="admin-btn" @click="create">
        <AppIcon name="plus" :size="16" /> Nuevo cupón
      </button>
    </div>

    <div class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Código</th><th>Descuento</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="coupon in coupons" :key="coupon.id">
              <td><strong>{{ coupon.code }}</strong></td>
              <td>-{{ coupon.discount }}%</td>
              <td>
                <button class="status" :class="coupon.active ? 'st-pagado' : 'st-pendiente'" @click="toggle(coupon)" style="cursor:pointer">
                  {{ coupon.active ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
              <td>
                <div class="admin-actions">
                  <button class="admin-mini" @click="edit(coupon)"><AppIcon name="plus" :size="15" /></button>
                  <button class="admin-mini danger" @click="remove(coupon)"><AppIcon name="trash" :size="15" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!coupons.length" class="admin-empty">No hay cupones.</p>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nuevo' }} cupón</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>
        <div class="admin-form">
          <div class="admin-field">
            <label>Código</label>
            <input v-model="form.code" type="text" placeholder="BIENVENIDA" />
          </div>
          <div class="admin-field">
            <label>Descuento %</label>
            <input v-model.number="form.discount" type="number" />
          </div>
          <label class="admin-check">
            <input v-model="form.active" type="checkbox" /> Activo
          </label>
          <div class="admin-form-actions">
            <button class="admin-btn admin-btn-ghost" @click="modalOpen = false">Cancelar</button>
            <button class="admin-btn" @click="save">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.st-pagado {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}

.st-pendiente {
  background: #fff3e0;
  color: #b26a00;
  border: 1px solid #f0d9b0;
}
</style>
