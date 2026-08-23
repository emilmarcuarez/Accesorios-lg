<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { listProducts, listCategories, createProduct, updateProduct, deleteProduct } from '@/lib/db'

const products = ref([])
const categories = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const form = ref(emptyForm())

function emptyForm() {
  return {
    name: '',
    category_id: '',
    price: 0,
    old_price: 0,
    discount: 0,
    stock: 0,
    image: '',
    featured: false,
    is_new: false,
  }
}

async function load() {
  const [p, c] = await Promise.all([listProducts(), listCategories()])
  products.value = p.data || []
  categories.value = c.data || []
}

onMounted(load)

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(product) {
  editing.value = product
  form.value = {
    name: product.name,
    category_id: product.category_id,
    price: product.price,
    old_price: product.old_price || 0,
    discount: product.discount || 0,
    stock: product.stock ?? 0,
    image: product.image || '',
    featured: product.featured,
    is_new: product.is_new,
  }
  modalOpen.value = true
}

async function save() {
  const payload = {
    ...form.value,
    category_id: form.value.category_id || null,
  }
  if (editing.value) await updateProduct(editing.value.id, payload)
  else await createProduct(payload)
  modalOpen.value = false
  await load()
}

async function remove(product) {
  if (!confirm('¿Eliminar este producto?')) return
  await deleteProduct(product.id)
  await load()
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Productos</p>
      <button class="admin-btn" @click="openCreate">
        <AppIcon name="plus" :size="16" />
        Nuevo producto
      </button>
    </div>

    <div class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Etiquetas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>
                <div style="display: flex; align-items: center; gap: 12px">
                  <img :src="product.image" class="thumb" :alt="product.name" />
                  <div>
                    <strong>{{ product.name }}</strong>
                    <div class="muted" style="font-size: 12px">ID #{{ product.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ product.categories?.name || 'Sin categoría' }}</td>
              <td>${{ product.price }}</td>
              <td>
                <span :class="{ 'muted': (product.stock ?? 0) <= 0 }">
                  {{ product.stock ?? 0 }} uds
                </span>
              </td>
              <td>
                <span v-if="product.featured" class="status st-pagado">Destacado</span>
                <span v-if="product.is_new" class="status st-enviado">Nuevo</span>
                <span v-if="product.discount" class="status st-pendiente">-{{ product.discount }}%</span>
              </td>
              <td>
                <div class="admin-actions">
                  <button class="admin-mini" aria-label="Editar" @click="openEdit(product)">
                    <AppIcon name="plus" :size="15" />
                  </button>
                  <button class="admin-mini danger" aria-label="Eliminar" @click="remove(product)">
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!products.length" class="admin-empty">No hay productos. Crea el primero.</p>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nuevo' }} producto</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>

        <div class="admin-form">
          <div class="admin-field">
            <label>Nombre</label>
            <input v-model="form.name" type="text" />
          </div>
          <div class="admin-grid-2">
            <div class="admin-field">
              <label>Categoría</label>
              <select v-model="form.category_id">
                <option value="">Sin categoría</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="admin-field">
              <label>Imagen (URL)</label>
              <input v-model="form.image" type="text" placeholder="/img/..." />
            </div>
          </div>
          <div class="admin-grid-3">
            <div class="admin-field">
              <label>Precio (USD)</label>
              <input v-model.number="form.price" type="number" step="0.01" />
            </div>
            <div class="admin-field">
              <label>Precio antiguo</label>
              <input v-model.number="form.old_price" type="number" step="0.01" />
            </div>
            <div class="admin-field">
              <label>Descuento %</label>
              <input v-model.number="form.discount" type="number" />
            </div>
          </div>
          <div class="admin-field">
            <label>Stock</label>
            <input v-model.number="form.stock" type="number" />
          </div>
          <div style="display: flex; gap: 18px">
            <label class="admin-check">
              <input v-model="form.featured" type="checkbox" /> Destacado
            </label>
            <label class="admin-check">
              <input v-model="form.is_new" type="checkbox" /> Nuevo
            </label>
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
