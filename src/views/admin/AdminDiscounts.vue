<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { getPromotions, upsertPromotion, deletePromotion, listProducts, listCategories } from '@/lib/db'

const promotions = ref([])
const products = ref([])
const categories = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const form = ref(empty())

function empty() {
  return { name: '', percent: 0, target_type: 'product', target_id: '' }
}

async function load() {
  const [p, prod, cat] = await Promise.all([getPromotions(), listProducts(), listCategories()])
  promotions.value = p.data || []
  products.value = prod.data || []
  categories.value = cat.data || []
}

onMounted(load)

function targetLabel(promo) {
  if (promo.target_type === 'product') {
    return products.value.find((p) => p.id === promo.target_id)?.name || 'Producto'
  }
  return categories.value.find((c) => c.id === promo.target_id)?.name || 'Categoría'
}

function create() {
  editing.value = null
  form.value = empty()
  modalOpen.value = true
}

function edit(promo) {
  editing.value = promo
  form.value = {
    name: promo.name,
    percent: promo.percent,
    target_type: promo.target_type,
    target_id: promo.target_id,
  }
  modalOpen.value = true
}

async function save() {
  const payload = { ...form.value, target_id: form.value.target_id ? Number(form.value.target_id) : null }
  await upsertPromotion(editing.value ? { ...payload, id: editing.value.id } : payload)
  modalOpen.value = false
  await load()
}

async function remove(promo) {
  if (!confirm('¿Eliminar este descuento?')) return
  await deletePromotion(promo.id)
  await load()
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Descuentos</p>
      <button class="admin-btn" @click="create">
        <AppIcon name="plus" :size="16" /> Nuevo descuento
      </button>
    </div>

    <div class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Aplica a</th><th>%</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="promo in promotions" :key="promo.id">
              <td><strong>{{ promo.name }}</strong></td>
              <td class="muted">{{ targetLabel(promo) }}</td>
              <td class="muted">-{{ promo.percent }}%</td>
              <td>
                <div class="admin-actions">
                  <button class="admin-mini" @click="edit(promo)"><AppIcon name="plus" :size="15" /></button>
                  <button class="admin-mini danger" @click="remove(promo)"><AppIcon name="trash" :size="15" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!promotions.length" class="admin-empty">No hay descuentos.</p>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nuevo' }} descuento</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>
        <div class="admin-form">
          <div class="admin-field">
            <label>Nombre</label>
            <input v-model="form.name" type="text" placeholder="Rebaja de verano" />
          </div>
          <div class="admin-grid-2">
            <div class="admin-field">
              <label>Aplica a</label>
              <select v-model="form.target_type">
                <option value="product">Producto</option>
                <option value="category">Categoría</option>
              </select>
            </div>
            <div class="admin-field">
              <label>{{ form.target_type === 'product' ? 'Producto' : 'Categoría' }}</label>
              <select v-model="form.target_id">
                <option value="">Seleccionar</option>
                <option v-if="form.target_type === 'product'" v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                <option v-else v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="admin-field">
            <label>Descuento %</label>
            <input v-model.number="form.percent" type="number" />
          </div>
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
.muted {
  color: var(--ink-400);
}
</style>
