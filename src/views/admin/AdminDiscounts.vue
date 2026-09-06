<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import {
  listProducts,
  listCategories,
  updateProduct,
  updateCategory,
} from '@/lib/db'
import { resolveImage } from '@/utils/image'
import { formatPrice } from '@/utils/format'
import { useCatalogStore } from '@/store/catalog'

const catalog = useCatalogStore()

const products = ref([])
const categories = ref([])
const loading = ref(false)
const filterTab = ref('all') // 'all' | 'category' | 'product'
const searchQuery = ref('')

const modalOpen = ref(false)
const editing = ref(null)
const saving = ref(false)

const form = ref({
  target_type: 'product', // 'product' | 'category'
  target_id: '',
  percent: 10,
})

async function load() {
  loading.value = true
  const [prodRes, catRes] = await Promise.all([listProducts(), listCategories()])
  products.value = prodRes.data || []
  categories.value = catRes.data || []
  loading.value = false
}

onMounted(load)

// Lista unificada de todos los descuentos activos (productos y categorías con discount > 0)
const activeDiscounts = computed(() => {
  const list = []

  // 1. Categorías con descuento
  ;(categories.value || []).forEach((cat) => {
    if (!cat) return
    const discount = Number(cat.discount) || 0
    if (discount > 0) {
      const prodCount = (products.value || []).filter(
        (p) => p && p.category_id === cat.id,
      ).length
      list.push({
        id: `cat-${cat.id}`,
        rawId: cat.id,
        type: 'category',
        typeLabel: 'Categoría',
        name: cat.name || 'Categoría',
        slug: cat.slug || '',
        image: cat.image || '',
        discount,
        info: `Aplica a ${prodCount} producto(s) en esta categoría`,
        count: prodCount,
      })
    }
  })

  // 2. Productos con descuento
  ;(products.value || []).forEach((prod) => {
    if (!prod) return
    const discount = Number(prod.discount) || 0
    if (discount > 0) {
      const origPrice = Number(prod.price) || 0
      const finalPrice = Number((origPrice * (1 - discount / 100)).toFixed(2))
      list.push({
        id: `prod-${prod.id}`,
        rawId: prod.id,
        type: 'product',
        typeLabel: 'Producto',
        name: prod.name || 'Producto',
        categoryName: prod.categories?.name || 'Sin categoría',
        image: prod.image || '',
        discount,
        originalPrice: origPrice,
        finalPrice,
        info: `Precio regular: ${formatPrice(origPrice)} → ${formatPrice(finalPrice)}`,
      })
    }
  })

  return list
})

const categoryCount = computed(
  () => activeDiscounts.value.filter((d) => d.type === 'category').length,
)
const productCount = computed(
  () => activeDiscounts.value.filter((d) => d.type === 'product').length,
)

const filteredDiscounts = computed(() => {
  let list = activeDiscounts.value

  if (filterTab.value === 'category') {
    list = list.filter((d) => d.type === 'category')
  } else if (filterTab.value === 'product') {
    list = list.filter((d) => d.type === 'product')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.categoryName && d.categoryName.toLowerCase().includes(q)) ||
        (d.slug && d.slug.toLowerCase().includes(q)),
    )
  }

  return list
})

function openCreate() {
  editing.value = null
  form.value = {
    target_type: 'product',
    target_id: products.value[0]?.id || '',
    percent: 10,
  }
  modalOpen.value = true
}

function openEdit(item) {
  editing.value = item
  form.value = {
    target_type: item.type,
    target_id: item.rawId,
    percent: item.discount,
  }
  modalOpen.value = true
}

// Vista previa para el modal
const selectedPreview = computed(() => {
  if (!form.value.target_id) return null
  if (form.value.target_type === 'product') {
    const p = products.value.find((x) => x.id === Number(form.value.target_id))
    if (!p) return null
    const orig = Number(p.price) || 0
    const pct = Math.max(0, Math.min(100, Number(form.value.percent) || 0))
    const final = Number((orig * (1 - pct / 100)).toFixed(2))
    return {
      name: p.name,
      image: p.image,
      orig,
      pct,
      final,
      savings: Number((orig - final).toFixed(2)),
    }
  } else {
    const c = categories.value.find((x) => x.id === Number(form.value.target_id))
    if (!c) return null
    const count = products.value.filter((p) => p.category_id === c.id).length
    return {
      name: c.name,
      image: c.image,
      count,
      pct: Math.max(0, Math.min(100, Number(form.value.percent) || 0)),
    }
  }
})

async function save() {
  if (!form.value.target_id) {
    alert('Selecciona un producto o categoría')
    return
  }
  const pct = Math.max(0, Math.min(100, Number(form.value.percent) || 0))
  saving.value = true

  if (form.value.target_type === 'category') {
    await updateCategory(Number(form.value.target_id), { discount: pct })
  } else {
    await updateProduct(Number(form.value.target_id), { discount: pct })
  }

  saving.value = false
  modalOpen.value = false
  await load()
  await catalog.fetch(true)
}

async function removeDiscount(item) {
  const msg =
    item.type === 'category'
      ? `¿Eliminar el descuento del ${item.discount}% de la categoría "${item.name}"?`
      : `¿Eliminar el descuento del ${item.discount}% del producto "${item.name}"?`

  if (!confirm(msg)) return

  if (item.type === 'category') {
    await updateCategory(item.rawId, { discount: 0 })
  } else {
    await updateProduct(item.rawId, { discount: 0 })
  }

  await load()
  await catalog.fetch(true)
}
</script>

<template>
  <div class="admin-discounts-view">
    <div class="admin-toolbar">
      <div>
        <p class="admin-title">Descuentos y Promociones</p>
        <p class="admin-subtitle">
          Administra todos los descuentos activos en productos y categorías en un solo lugar.
        </p>
      </div>
      <button class="admin-btn" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Nuevo descuento
      </button>
    </div>

    <!-- Tarjetas de métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon total">
          <AppIcon name="sparkles" :size="20" />
        </div>
        <div>
          <span class="metric-num">{{ activeDiscounts.length }}</span>
          <span class="metric-label">Descuentos activos</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon cat">
          <AppIcon name="bag" :size="20" />
        </div>
        <div>
          <span class="metric-num">{{ categoryCount }}</span>
          <span class="metric-label">En Categorías</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon prod">
          <AppIcon name="heart" :size="20" />
        </div>
        <div>
          <span class="metric-num">{{ productCount }}</span>
          <span class="metric-label">En Productos</span>
        </div>
      </div>
    </div>

    <!-- Barra de filtros y pestañas -->
    <div class="filter-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'all' }"
          @click="filterTab = 'all'"
        >
          Todos los activos ({{ activeDiscounts.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'category' }"
          @click="filterTab = 'category'"
        >
          Categorías ({{ categoryCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: filterTab === 'product' }"
          @click="filterTab = 'product'"
        >
          Productos ({{ productCount }})
        </button>
      </div>

      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar descuento..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Tabla principal -->
    <div class="admin-card">
      <div v-if="filteredDiscounts.length" class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Tipo</th>
              <th>Descuento</th>
              <th>Precio / Alcance</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredDiscounts" :key="item.id">
              <td>
                <div class="item-cell">
                  <img
                    v-if="item.image"
                    :src="resolveImage(item.image)"
                    :alt="item.name"
                    class="item-thumb"
                  />
                  <div v-else class="item-thumb-placeholder">
                    {{ item.name.slice(0, 1) }}
                  </div>
                  <div>
                    <strong class="item-name">{{ item.name }}</strong>
                    <div class="muted sub-info">
                      {{ item.type === 'product' ? 'Categoría: ' + (item.categoryName || '') : 'Slug: /' + (item.slug || '') }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="type-badge" :class="item.type">
                  {{ item.typeLabel }}
                </span>
              </td>
              <td>
                <span class="discount-tag">-{{ item.discount }}% OFF</span>
              </td>
              <td>
                <div v-if="item.type === 'product'" class="price-flow">
                  <span class="flow-old">{{ formatPrice(item.originalPrice) }}</span>
                  <span class="flow-arrow">→</span>
                  <strong class="flow-new">{{ formatPrice(item.finalPrice) }}</strong>
                </div>
                <div v-else class="cat-scope">
                  <span class="scope-icon">●</span>
                  <span>Aplica a {{ item.count }} producto(s)</span>
                </div>
              </td>
              <td>
                <div class="admin-actions right">
                  <button
                    class="admin-mini"
                    title="Editar descuento"
                    aria-label="Editar"
                    @click="openEdit(item)"
                  >
                    <AppIcon name="edit" :size="15" />
                  </button>
                  <button
                    class="admin-mini danger"
                    title="Quitar descuento"
                    aria-label="Eliminar"
                    @click="removeDiscount(item)"
                  >
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <p v-if="searchQuery">No se encontraron descuentos que coincidan con "{{ searchQuery }}".</p>
        <template v-else>
          <div class="empty-icon">
            <AppIcon name="sparkles" :size="36" />
          </div>
          <p class="empty-title">No hay descuentos activos</p>
          <p class="empty-desc">
            Crea promociones para tus productos o categorías para atraer más clientes.
          </p>
          <button class="admin-btn" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Crear primer descuento
          </button>
        </template>
      </div>
    </div>

    <!-- Modal Nuevo / Editar Descuento -->
    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">
            {{ editing ? 'Editar' : 'Nuevo' }} Descuento
          </h3>
          <button class="admin-mini" @click="modalOpen = false">
            <AppIcon name="close" :size="16" />
          </button>
        </div>

        <div class="admin-form">
          <!-- Selector de tipo si es nuevo -->
          <div class="admin-field">
            <label>Aplica a</label>
            <div class="type-toggle">
              <label class="toggle-option" :class="{ active: form.target_type === 'product' }">
                <input
                  v-model="form.target_type"
                  type="radio"
                  value="product"
                  :disabled="Boolean(editing)"
                  @change="form.target_id = products[0]?.id || ''"
                />
                <span>Producto individual</span>
              </label>
              <label class="toggle-option" :class="{ active: form.target_type === 'category' }">
                <input
                  v-model="form.target_type"
                  type="radio"
                  value="category"
                  :disabled="Boolean(editing)"
                  @change="form.target_id = categories[0]?.id || ''"
                />
                <span>Toda una Categoría</span>
              </label>
            </div>
          </div>

          <!-- Selector de elemento -->
          <div class="admin-field">
            <label>{{ form.target_type === 'product' ? 'Seleccionar Producto' : 'Seleccionar Categoría' }}</label>
            <select v-model="form.target_id" :disabled="Boolean(editing)">
              <template v-if="form.target_type === 'product'">
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }} ({{ formatPrice(p.price) }})
                </option>
              </template>
              <template v-else>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </template>
            </select>
          </div>

          <!-- Input de Porcentaje -->
          <div class="admin-field">
            <label>Porcentaje de descuento (%)</label>
            <div class="percent-input-wrap">
              <input
                v-model.number="form.percent"
                type="number"
                min="1"
                max="100"
                placeholder="Ej. 15"
              />
              <span class="pct-symbol">%</span>
            </div>
            <div class="quick-percentages">
              <button
                v-for="val in [5, 10, 15, 20, 25, 30, 50]"
                :key="val"
                type="button"
                class="quick-pct-btn"
                :class="{ active: form.percent === val }"
                @click="form.percent = val"
              >
                {{ val }}%
              </button>
            </div>
          </div>

          <!-- Tarjeta de vista previa interactiva -->
          <div v-if="selectedPreview" class="preview-box">
            <strong class="preview-title">Resumen de la promoción</strong>
            <div v-if="form.target_type === 'product'" class="preview-calc">
              <div class="calc-row">
                <span>Producto:</span>
                <strong>{{ selectedPreview.name }}</strong>
              </div>
              <div class="calc-row">
                <span>Precio base:</span>
                <span>{{ formatPrice(selectedPreview.orig) }}</span>
              </div>
              <div class="calc-row promo">
                <span>Descuento aplicado:</span>
                <span>-{{ selectedPreview.pct }}% (-{{ formatPrice(selectedPreview.savings) }})</span>
              </div>
              <div class="calc-row total">
                <span>Precio final en tienda:</span>
                <strong>{{ formatPrice(selectedPreview.final) }}</strong>
              </div>
            </div>
            <div v-else class="preview-calc">
              <div class="calc-row">
                <span>Categoría:</span>
                <strong>{{ selectedPreview.name }}</strong>
              </div>
              <div class="calc-row promo">
                <span>Descuento de categoría:</span>
                <strong>-{{ selectedPreview.pct }}%</strong>
              </div>
              <p class="cat-hint-note">
                ✨ Todos los {{ selectedPreview.count }} productos de esta categoría recibirán automáticamente este descuento en la tienda y en la factura.
              </p>
            </div>
          </div>

          <div class="admin-form-actions">
            <button class="admin-btn admin-btn-ghost" @click="modalOpen = false">
              Cancelar
            </button>
            <button class="admin-btn" :disabled="saving" @click="save">
              {{ saving ? 'Guardando...' : 'Guardar Descuento' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-discounts-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-subtitle {
  font-size: 13.5px;
  color: var(--ink-400);
  margin-top: 2px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon.total {
  background: #fff0f3;
  color: #c92a54;
}

.metric-icon.cat {
  background: #fdf2f8;
  color: #a21caf;
}

.metric-icon.prod {
  background: #eff6ff;
  color: #2563eb;
}

.metric-num {
  font-family: var(--font-body);
  font-size: 26px;
  font-weight: 700;
  color: var(--ink-900);
  display: block;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.metric-label {
  font-size: 12.5px;
  color: var(--ink-400);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tabs {
  display: flex;
  gap: 6px;
  background: #f3ecee;
  padding: 4px;
  border-radius: 10px;
}

.tab-btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-600);
  background: transparent;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--white);
  color: var(--rose-600);
  box-shadow: var(--shadow-sm);
}

.search-input {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  width: 240px;
  background: var(--white);
  outline: none;
}

.search-input:focus {
  border-color: var(--rose-300);
}

.item-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: var(--rose-50);
}

.item-thumb-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #fce8ed;
  color: #c92a54;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.item-name {
  color: var(--ink-900);
  font-size: 14px;
}

.sub-info {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 2px;
}

.type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.type-badge.category {
  background: #fdf2f8;
  color: #a21caf;
  border: 1px solid #fbcfe8;
}

.type-badge.product {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.discount-tag {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e84a6f 0%, #c92a54 100%);
  color: var(--white);
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 2px 6px rgba(201, 42, 84, 0.25);
}

.price-flow {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13.5px;
}

.flow-old {
  color: var(--ink-400);
  text-decoration: line-through;
  font-size: 12.5px;
}

.flow-arrow {
  color: var(--ink-300);
  font-size: 11px;
}

.flow-new {
  color: var(--ink-900);
}

.cat-scope {
  font-size: 13px;
  color: var(--ink-600);
  display: flex;
  align-items: center;
  gap: 6px;
}

.scope-icon {
  color: #a21caf;
  font-size: 9px;
}

.text-right {
  text-align: right;
}

.admin-actions.right {
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: var(--rose-400);
  margin-bottom: 12px;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink-900);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13.5px;
  color: var(--ink-400);
  margin-bottom: 20px;
}

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ink-700);
  background: var(--rose-50);
}

.toggle-option.active {
  border-color: var(--rose-400);
  background: var(--white);
  color: var(--rose-600);
  font-weight: 600;
}

.percent-input-wrap {
  position: relative;
}

.percent-input-wrap input {
  padding-right: 32px;
}

.pct-symbol {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-400);
  font-weight: 700;
}

.quick-percentages {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.quick-pct-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.quick-pct-btn.active,
.quick-pct-btn:hover {
  background: #fff0f3;
  color: #c92a54;
  border-color: #fccfd8;
}

.preview-box {
  background: #fff8f9;
  border: 1px solid #fce8ed;
  border-radius: 12px;
  padding: 14px 16px;
}

.preview-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #c92a54;
  display: block;
  margin-bottom: 10px;
}

.preview-calc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  color: var(--ink-600);
}

.calc-row.promo {
  color: #c92a54;
  font-weight: 600;
}

.calc-row.total {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #f5cbd5;
  font-size: 14.5px;
  color: var(--ink-900);
}

.cat-hint-note {
  font-size: 12px;
  color: #831843;
  line-height: 1.4;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
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
  .search-input {
    width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 500px) {
  .type-toggle {
    grid-template-columns: 1fr;
  }
}
</style>
