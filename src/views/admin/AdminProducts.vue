<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { listProducts, listCategories, deleteProduct } from '@/lib/db'
import { resolveImage } from '@/utils/image'
import { formatPrice } from '@/utils/format'

const router = useRouter()
const products = ref([])
const categories = ref([])

const searchQuery = ref('')
const categoryFilter = ref('all')
const statusTab = ref('all') // 'all' | 'in_stock' | 'low_stock' | 'discount' | 'featured'

async function load() {
  const [p, c] = await Promise.all([listProducts(), listCategories()])
  products.value = p.data || []
  categories.value = c.data || []
}

onMounted(load)

const inStockCount = computed(
  () => (products.value || []).filter((p) => (p.stock ?? 0) > 0).length,
)
const lowStockCount = computed(
  () => (products.value || []).filter((p) => (p.stock ?? 0) <= 5).length,
)
const discountCount = computed(
  () => (products.value || []).filter((p) => (Number(p.discount) || 0) > 0).length,
)
const featuredCount = computed(
  () => (products.value || []).filter((p) => p.featured).length,
)

const filteredProducts = computed(() => {
  let list = products.value || []

  // Filtro por pestaña
  if (statusTab.value === 'in_stock') {
    list = list.filter((p) => (p.stock ?? 0) > 0)
  } else if (statusTab.value === 'low_stock') {
    list = list.filter((p) => (p.stock ?? 0) <= 5)
  } else if (statusTab.value === 'discount') {
    list = list.filter((p) => (Number(p.discount) || 0) > 0)
  } else if (statusTab.value === 'featured') {
    list = list.filter((p) => p.featured)
  }

  // Filtro por categoría
  if (categoryFilter.value !== 'all') {
    list = list.filter((p) => p.category_id === Number(categoryFilter.value))
  }

  // Buscador por nombre o ID
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        String(p.id).includes(q) ||
        (p.categories?.name && p.categories.name.toLowerCase().includes(q)),
    )
  }

  return list
})

async function remove(product) {
  if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return
  await deleteProduct(product.id)
  await load()
}
</script>

<template>
  <div class="admin-page-wrap">
    <div class="admin-toolbar">
      <div>
        <p class="admin-title">Productos</p>
        <span class="muted">{{ products.length }} producto(s) en total</span>
      </div>
      <router-link to="/admin/productos/nuevo" class="admin-btn">
        <AppIcon name="plus" :size="16" />
        Nuevo producto
      </router-link>
    </div>

    <!-- Barra de Filtros -->
    <div class="filter-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: statusTab === 'all' }"
          @click="statusTab = 'all'"
        >
          Todos ({{ products.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusTab === 'in_stock' }"
          @click="statusTab = 'in_stock'"
        >
          En stock ({{ inStockCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusTab === 'low_stock' }"
          @click="statusTab = 'low_stock'"
        >
          Bajo stock ({{ lowStockCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusTab === 'discount' }"
          @click="statusTab = 'discount'"
        >
          En oferta ({{ discountCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusTab === 'featured' }"
          @click="statusTab = 'featured'"
        >
          Destacados ({{ featuredCount }})
        </button>
      </div>

      <div class="filter-tools">
        <select v-model="categoryFilter" class="filter-select">
          <option value="all">Todas las categorías</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre o ID..."
          class="search-input"
        />
      </div>
    </div>

    <div class="admin-card">
      <div v-if="filteredProducts.length" class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Etiquetas</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="prod-cell">
                  <img :src="resolveImage(product.image)" class="thumb" :alt="product.name" />
                  <div>
                    <strong>{{ product.name }}</strong>
                    <div class="muted" style="font-size: 12px">ID #{{ product.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ product.categories?.name || 'Sin categoría' }}</td>
              <td>
                <div class="price-cell">
                  <strong v-if="product.discount > 0" class="price-discounted">
                    {{ formatPrice(product.price * (1 - product.discount / 100)) }}
                  </strong>
                  <span :class="{ 'price-crossed': product.discount > 0 }">
                    {{ formatPrice(product.price) }}
                  </span>
                </div>
              </td>
              <td>
                <span
                  class="stock-pill"
                  :class="{
                    'out-of-stock': (product.stock ?? 0) <= 0,
                    'low-stock': (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5,
                  }"
                >
                  {{ (product.stock ?? 0) <= 0 ? 'Agotado' : `${product.stock} uds` }}
                </span>
              </td>
              <td>
                <div class="tags-group">
                  <span v-if="product.featured" class="status st-pagado">Destacado</span>
                  <span v-if="product.is_new" class="status st-enviado">Nuevo</span>
                  <span v-if="product.discount" class="status st-pendiente">-{{ product.discount }}%</span>
                </div>
              </td>
              <td>
                <div class="admin-actions right">
                  <button
                    class="admin-mini"
                    aria-label="Editar"
                    title="Editar producto"
                    @click="router.push(`/admin/productos/${product.id}/editar`)"
                  >
                    <AppIcon name="edit" :size="15" />
                  </button>
                  <button
                    class="admin-mini danger"
                    aria-label="Eliminar"
                    title="Eliminar producto"
                    @click="remove(product)"
                  >
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="searchQuery || categoryFilter !== 'all' || statusTab !== 'all'" class="admin-empty">
        No se encontraron productos que coincidan con los filtros actuales.
      </p>
      <p v-else class="admin-empty">No hay productos. Crea el primero.</p>
    </div>
  </div>
</template>

<style scoped>
.admin-page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-600);
  background: transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-btn.active {
  background: var(--white);
  color: var(--rose-600);
  box-shadow: var(--shadow-sm);
}

.filter-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--white);
  color: var(--ink-700);
  outline: none;
}

.filter-select:focus {
  border-color: var(--rose-300);
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

.prod-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: var(--rose-50);
}

.price-cell {
  display: flex;
  flex-direction: column;
}

.price-discounted {
  color: var(--rose-600);
  font-size: 14px;
}

.price-crossed {
  text-decoration: line-through;
  font-size: 12px;
  color: var(--ink-400);
}

.stock-pill {
  display: inline-block;
  font-size: 12.5px;
  color: var(--ink-700);
}

.stock-pill.low-stock {
  color: #d97706;
  font-weight: 600;
}

.stock-pill.out-of-stock {
  color: #b91c1c;
  background: #fee2e2;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11.5px;
}

.tags-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.muted {
  color: var(--ink-400);
}

.text-right {
  text-align: right;
}

.admin-actions.right {
  justify-content: flex-end;
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
  .filter-tools {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .filter-select,
  .search-input {
    width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 600px) {
  .prod-cell {
    gap: 8px;
  }
  .prod-cell strong {
    font-size: 13px;
  }
  .thumb {
    width: 38px;
    height: 38px;
  }
  .status {
    padding: 2px 8px;
    font-size: 11px;
  }
}
</style>
