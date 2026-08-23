<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/lib/db'

const categories = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const form = ref(empty())

function empty() {
  return { slug: '', name: '', discount: 0 }
}

async function load() {
  const res = await listCategories()
  categories.value = res.data || []
}

onMounted(load)

function create() {
  editing.value = null
  form.value = empty()
  modalOpen.value = true
}

function edit(cat) {
  editing.value = cat
  form.value = { slug: cat.slug, name: cat.name, discount: cat.discount || 0 }
  modalOpen.value = true
}

async function save() {
  if (editing.value) await updateCategory(editing.value.id, form.value)
  else await createCategory(form.value)
  modalOpen.value = false
  await load()
}

async function remove(cat) {
  if (!confirm('¿Eliminar esta categoría?')) return
  await deleteCategory(cat.id)
  await load()
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Categorías</p>
      <button class="admin-btn" @click="create">
        <AppIcon name="plus" :size="16" /> Nueva categoría
      </button>
    </div>

    <div class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Categoría</th><th>Slug</th><th>Descuento</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id">
              <td><strong>{{ cat.name }}</strong></td>
              <td class="muted">{{ cat.slug }}</td>
              <td>{{ cat.discount ? '-' + cat.discount + '%' : '—' }}</td>
              <td>
                <div class="admin-actions">
                  <button class="admin-mini" @click="edit(cat)"><AppIcon name="plus" :size="15" /></button>
                  <button class="admin-mini danger" @click="remove(cat)"><AppIcon name="trash" :size="15" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!categories.length" class="admin-empty">No hay categorías.</p>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nueva' }} categoría</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>
        <div class="admin-form">
          <div class="admin-field">
            <label>Nombre</label>
            <input v-model="form.name" type="text" />
          </div>
          <div class="admin-grid-2">
            <div class="admin-field">
              <label>Slug</label>
              <input v-model="form.slug" type="text" placeholder="aretes" />
            </div>
            <div class="admin-field">
              <label>Descuento %</label>
              <input v-model.number="form.discount" type="number" />
            </div>
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
