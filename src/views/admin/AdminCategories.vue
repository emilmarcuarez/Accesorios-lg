<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
} from '@/lib/db'
import { resolveImage } from '@/utils/image'
import { useCatalogStore } from '@/store/catalog'

const catalog = useCatalogStore()
const categories = ref([])
const modalOpen = ref(false)
const editing = ref(null)
const uploading = ref(false)
const form = ref(empty())

const searchQuery = ref('')
const filterTab = ref('all')

const withDiscountCount = computed(() => categories.value.filter(c => Number(c.discount) > 0).length)
const withoutDiscountCount = computed(() => categories.value.filter(c => !c.discount || Number(c.discount) === 0).length)

const filteredCategories = computed(() => {
  return categories.value.filter(c => {
    if (filterTab.value === 'with_discount' && !(Number(c.discount) > 0)) return false
    if (filterTab.value === 'without_discount' && Number(c.discount) > 0) return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchesName = (c.name || '').toLowerCase().includes(q)
      const matchesSlug = (c.slug || '').toLowerCase().includes(q)
      if (!matchesName && !matchesSlug) return false
    }
    return true
  })
})

function clearFilters() {
  searchQuery.value = ''
  filterTab.value = 'all'
}

function empty() {
  return { slug: '', name: '', discount: 0, image: '' }
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
  form.value = { slug: cat.slug, name: cat.name, discount: cat.discount || 0, image: cat.image || '' }
  modalOpen.value = true
}

async function save() {
  if (editing.value) await updateCategory(editing.value.id, form.value)
  else await createCategory(form.value)
  await catalog.fetch(true)
  modalOpen.value = false
  await load()
}

async function remove(cat) {
  if (!confirm('¿Eliminar esta categoría?')) return
  await deleteCategory(cat.id)
  await catalog.fetch(true)
  await load()
}

function removeImage() {
  form.value.image = ''
}

async function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  const res = await uploadImage(file)
  if (res.error) {
    uploading.value = false
    alert(res.error)
    return
  }
  let ok = false
  for (let i = 0; i < 8; i++) {
    const check = await fetch(`/api/img?src=${encodeURIComponent(res.url)}`).catch(() => ({ ok: false }))
    if (check.ok) {
      ok = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 700))
  }
  uploading.value = false
  if (!ok) {
    alert('La imagen aún no está lista. Intenta de nuevo en unos segundos.')
    return
  }
  form.value.image = res.url
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <div>
        <p class="admin-title">Categorías</p>
        <p class="admin-subtitle">Organiza tus productos y asigna descuentos globales por categoría.</p>
      </div>
      <button class="admin-btn" @click="create">
        <AppIcon name="plus" :size="16" /> Nueva categoría
      </button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filter-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'all' }"
          @click="filterTab = 'all'"
        >
          Todas <span class="tab-count">{{ categories.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'with_discount' }"
          @click="filterTab = 'with_discount'"
        >
          Con descuento <span class="tab-count">{{ withDiscountCount }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'without_discount' }"
          @click="filterTab = 'without_discount'"
        >
          Sin descuento <span class="tab-count">{{ withoutDiscountCount }}</span>
        </button>
      </div>

      <div class="filter-controls">
        <div class="search-box">
          <AppIcon name="search" :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar categoría o slug..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
            <AppIcon name="close" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Categoría</th><th>Slug</th><th>Descuento</th><th>Imagen</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredCategories" :key="cat.id">
              <td><strong>{{ cat.name }}</strong></td>
              <td class="muted">{{ cat.slug }}</td>
              <td>
                <span v-if="cat.discount" class="cat-discount-badge">-{{ cat.discount }}%</span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <img v-if="cat.image" :src="resolveImage(cat.image)" class="thumb" :alt="cat.name" />
                <span v-else class="muted text-holder">—</span>
              </td>
              <td>
                <div class="admin-actions">
                  <button class="admin-mini" aria-label="Editar" @click="edit(cat)">
                    <AppIcon name="edit" :size="15" />
                  </button>
                  <button class="admin-mini danger" aria-label="Eliminar" @click="remove(cat)">
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!filteredCategories.length" class="admin-empty">
        <p v-if="!categories.length">No hay categorías registradas.</p>
        <div v-else class="empty-search">
          <p>No se encontraron categorías que coincidan con los filtros.</p>
          <button class="admin-btn admin-btn-ghost btn-sm" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nueva' }} categoría</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>
        <div class="admin-form">
          <div class="admin-field">
            <label>Imagen</label>
            <div class="image-upload">
              <img v-if="form.image" :src="resolveImage(form.image)" class="upload-preview" alt="Imagen" />
              <label class="upload-btn">
                <input type="file" accept="image/*" hidden @change="onFile" />
                {{ uploading ? 'Subiendo...' : 'Subir imagen' }}
              </label>
              <button v-if="form.image" class="admin-mini danger" aria-label="Quitar" @click="removeImage">
                <AppIcon name="trash" :size="15" />
              </button>
            </div>
            <small class="upload-hint">Recomendado: 1200×1200 px (cuadrada)</small>
          </div>

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
              <input v-model.number="form.discount" type="number" min="0" max="100" />
              <small class="upload-hint">Aplica a todos los productos de esta categoría.</small>
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

.text-holder {
  display: inline-block;
  padding: 4px 8px;
}

.thumb {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border-radius: 10px;
  background: var(--rose-50);
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-preview {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  background: var(--rose-50);
  border: 1px solid var(--line);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px dashed var(--rose-300);
  border-radius: 10px;
  color: var(--rose-600);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.upload-btn:hover {
  background: var(--rose-50);
}

.upload-hint {
  color: var(--ink-400);
  font-size: 12px;
  margin-top: 6px;
}

.cat-discount-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  background: #fdf2f8;
  color: #a21caf;
  font-weight: 700;
  font-size: 11px;
  border: 1px solid #fbcfe8;
}

.admin-subtitle {
  color: var(--ink-400);
  font-size: 13px;
  margin-top: 4px;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.tabs {
  display: inline-flex;
  background: #f3ecee;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-500);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
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

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
  width: 240px;
  outline: none;
  transition: border-color 0.2s;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.clear-search:hover {
  color: var(--ink-700);
}

.empty-search {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
}

@media (max-width: 768px) {
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
}

@media (max-width: 480px) {
  .upload-btn {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .thumb {
    width: 38px;
    height: 38px;
  }
}
</style>
