<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '@/store/catalog'
import { resolveImage } from '@/utils/image'
import ProductCard from '@/components/ProductCard.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

// Estados reactivos de filtros y búsqueda
const searchQuery = ref('')
const selectedCategory = ref('all')
const quickFilter = ref('all') // 'all' | 'offers' | 'new' | 'stock' | 'featured'
const sortBy = ref('featured') // 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'discount' | 'name-asc'
const priceRange = ref('all') // 'all' | 'under-15' | '15-30' | 'above-30'
const groupByCategory = ref(false)

// Carrusel de subcategorías circular
const circlesTrackRef = ref(null)
const canScrollLeftCircles = ref(false)
const canScrollRightCircles = ref(false)

function updateCirclesScrollState() {
  const el = circlesTrackRef.value
  if (!el) return
  canScrollLeftCircles.value = el.scrollLeft > 10
  canScrollRightCircles.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollCircles(direction) {
  const el = circlesTrackRef.value
  if (!el) return
  const scrollAmount = Math.max(el.clientWidth * 0.6, 260)
  el.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}

// Estado del Drawer "Filter & Sort" de Pandora
const drawerOpen = ref(false)
const openAccordions = ref({
  sort: true,
  category: true,
  price: false,
  status: false,
})

function toggleAccordion(name) {
  openAccordions.value[name] = !openAccordions.value[name]
}

function openDrawer() {
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

// Bloqueo de scroll cuando el drawer está abierto
watch(drawerOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

// Opciones de ordenamiento
const sortOptions = [
  { value: 'featured', label: 'Recomendados para ti' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'name-asc', label: 'Nombre (A - Z)' },
]

const currentSortLabel = computed(() => {
  const found = sortOptions.find((o) => o.value === sortBy.value)
  return found ? found.label : 'Recomendados'
})

// Sincronizar con parámetros de ruta al montar / cambiar URL
watch(
  () => route.params.category,
  (newCat) => {
    selectedCategory.value = newCat || 'all'
  },
  { immediate: true },
)

watch(
  () => route.query.q,
  (q) => {
    if (q) searchQuery.value = q.toString()
  },
  { immediate: true },
)

watch(
  () => route.query.new,
  (isNew) => {
    if (isNew === '1') quickFilter.value = 'new'
  },
  { immediate: true },
)

// Categorías con conteo real de productos
const categoryFilters = computed(() => {
  const allProds = catalog.products || []
  return (catalog.categories || []).map((cat) => {
    const count = allProds.filter(
      (p) => p.categoryId === cat.id || p.category === cat.slug,
    ).length
    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      image: cat.image,
      count,
    }
  })
})

const totalCount = computed(() => (catalog.products || []).length)

// Círculos de subcategorías estilo carrusel de Pandora
const circleItems = computed(() => {
  const allProds = catalog.products || []
  const offersCount = allProds.filter((p) => Number(p.discount) > 0).length
  const newCount = allProds.filter((p) => Boolean(p.isNew)).length

  const items = [
    {
      id: 'all',
      name: 'Todos',
      type: 'category',
      slug: 'all',
      count: allProds.length,
      active: selectedCategory.value === 'all' && quickFilter.value === 'all',
      badge: 'ALL',
    },
  ]

  if (offersCount > 0) {
    items.push({
      id: 'offers',
      name: 'Ofertas',
      type: 'quick',
      quickVal: 'offers',
      count: offersCount,
      active: quickFilter.value === 'offers',
      badge: 'SALE',
    })
  }

  if (newCount > 0) {
    items.push({
      id: 'new',
      name: 'Novedades',
      type: 'quick',
      quickVal: 'new',
      count: newCount,
      active: quickFilter.value === 'new',
      badge: 'NEW',
    })
  }

  const catItems = (catalog.categories || [])
    .map((cat) => {
      const prodsWithStock = allProds.filter(
        (p) =>
          (p.categoryId === cat.id || p.category === cat.slug) &&
          (Number(p.stock) || 0) > 0,
      )
      const count = allProds.filter(
        (p) => p.categoryId === cat.id || p.category === cat.slug,
      ).length
      return {
        id: cat.id,
        name: cat.name,
        type: 'category',
        slug: cat.slug,
        count,
        hasStock: prodsWithStock.length > 0,
        totalStock: prodsWithStock.reduce((acc, p) => acc + (Number(p.stock) || 0), 0),
        image: cat.image,
        active: selectedCategory.value === cat.slug || selectedCategory.value === cat.id,
      }
    })
    .sort((a, b) => {
      if (a.hasStock && !b.hasStock) return -1
      if (!a.hasStock && b.hasStock) return 1
      if (a.hasStock && b.hasStock) return b.totalStock - a.totalStock
      return 0
    })

  items.push(...catItems)

  return items
})

function handleCircleClick(item) {
  if (item.type === 'quick') {
    selectedCategory.value = 'all'
    quickFilter.value = quickFilter.value === item.quickVal ? 'all' : item.quickVal
    router.push('/tienda')
  } else {
    quickFilter.value = 'all'
    selectCategory(item.slug)
  }
}

// Filtrado dinámico integral
const filteredProducts = computed(() => {
  let list = [...(catalog.products || [])]

  // 1. Filtro por categoría
  if (selectedCategory.value && selectedCategory.value !== 'all') {
    list = list.filter(
      (p) =>
        p.category === selectedCategory.value ||
        p.categoryId === selectedCategory.value,
    )
  }

  // 2. Filtro por buscador
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    )
  }

  // 3. Filtros rápidos
  if (quickFilter.value === 'offers') {
    list = list.filter((p) => Number(p.discount) > 0)
  } else if (quickFilter.value === 'new') {
    list = list.filter((p) => Boolean(p.isNew))
  } else if (quickFilter.value === 'stock') {
    list = list.filter((p) => (Number(p.stock) || 0) > 0)
  } else if (quickFilter.value === 'featured') {
    list = list.filter((p) => Boolean(p.featured))
  }

  // 4. Rango de precio
  if (priceRange.value === 'under-15') {
    list = list.filter((p) => Number(p.price) < 15)
  } else if (priceRange.value === '15-30') {
    list = list.filter((p) => Number(p.price) >= 15 && Number(p.price) <= 30)
  } else if (priceRange.value === 'above-30') {
    list = list.filter((p) => Number(p.price) > 30)
  }

  // 5. Ordenamiento dinámico
  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  } else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
  } else if (sortBy.value === 'newest') {
    list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
  } else if (sortBy.value === 'discount') {
    list.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0))
  } else if (sortBy.value === 'name-asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else if (sortBy.value === 'featured') {
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  }

  return list
})

// Agrupación por categoría
const groupedCategories = computed(() => {
  if (!groupByCategory.value) return []

  const groups = []
  const prods = filteredProducts.value

  for (const cat of catalog.categories || []) {
    const catProds = prods.filter(
      (p) => p.categoryId === cat.id || p.category === cat.slug,
    )
    if (catProds.length > 0) {
      groups.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: catProds.length,
        products: catProds,
      })
    }
  }

  const uncategorized = prods.filter(
    (p) =>
      !catalog.categories.some(
        (c) => c.id === p.categoryId || c.slug === p.category,
      ),
  )
  if (uncategorized.length > 0) {
    groups.push({
      id: 'otros',
      name: 'Otros Accesorios',
      slug: 'otros',
      count: uncategorized.length,
      products: uncategorized,
    })
  }

  return groups
})

// Conteo de filtros activos
const activeFiltersCount = computed(() => {
  let count = 0
  if (searchQuery.value.trim() !== '') count++
  if (selectedCategory.value !== 'all') count++
  if (quickFilter.value !== 'all') count++
  if (sortBy.value !== 'featured') count++
  if (priceRange.value !== 'all') count++
  return count
})

const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

const quickFilterLabel = computed(() => {
  const map = {
    offers: 'En oferta',
    new: 'Novedades',
    stock: 'En stock',
    featured: 'Destacados',
  }
  return map[quickFilter.value] || ''
})

const priceRangeLabel = computed(() => {
  const map = {
    'under-15': 'Menos de $15',
    '15-30': '$15 a $30',
    'above-30': 'Más de $30',
  }
  return map[priceRange.value] || ''
})

function selectCategory(slug) {
  selectedCategory.value = slug
  if (slug === 'all') {
    router.push('/tienda')
  } else {
    router.push(`/tienda/${slug}`)
  }
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  quickFilter.value = 'all'
  sortBy.value = 'featured'
  priceRange.value = 'all'
  router.push('/tienda')
}

const activeCategoryName = computed(() => {
  if (selectedCategory.value === 'all') return 'Joyas y Accesorios'
  const found = (catalog.categories || []).find(
    (c) => c.slug === selectedCategory.value || c.id === selectedCategory.value,
  )
  return found ? found.name : selectedCategory.value
})

watch(circleItems, () => {
  nextTick(updateCirclesScrollState)
})

onMounted(async () => {
  await catalog.fetch()
  nextTick(() => {
    updateCirclesScrollState()
  })
  window.addEventListener('resize', updateCirclesScrollState)
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  window.removeEventListener('resize', updateCirclesScrollState)
})
</script>

<template>
  <main class="shop pandora-theme">
    <!-- PANDORA HEADER SECTION -->
    <header class="pandora-hero" data-aos="fade-down">
      <div class="container-fluid pandora-hero-inner">
        <!-- Izquierda: Título y Descripción Editorial -->
        <div class="pandora-title-block">
          <nav class="pandora-breadcrumbs" aria-label="Ruta de navegación">
            <router-link to="/">Inicio</router-link>
            <span class="crumb-sep">/</span>
            <router-link to="/tienda">Tienda</router-link>
            <span v-if="selectedCategory !== 'all'" class="crumb-sep">/</span>
            <span v-if="selectedCategory !== 'all'" class="crumb-current">{{ activeCategoryName }}</span>
          </nav>

          <h1 class="pandora-headline">{{ activeCategoryName }}</h1>
          <p class="pandora-subtext">
            Piezas delicadas creadas para realzar tu esencia. Diseñadas con atención al detalle y acabados finos para combinar en cualquier ocasión.
          </p>
        </div>

        <!-- Derecha: Carrusel Circular de Subcategorías (Estilo Pandora con navegación) -->
        <div class="pandora-circles-carousel">
          <!-- Botón Desplazar Izquierda -->
          <button
            v-show="canScrollLeftCircles"
            class="circles-nav-btn prev"
            type="button"
            aria-label="Ver opciones anteriores"
            @click="scrollCircles('left')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div
            ref="circlesTrackRef"
            class="circles-track"
            @scroll.passive="updateCirclesScrollState"
          >
            <button
              v-for="circle in circleItems"
              :key="circle.id"
              type="button"
              class="circle-item"
              :class="{ active: circle.active }"
              @click="handleCircleClick(circle)"
            >
              <div class="circle-disk">
                <img
                  v-if="circle.image"
                  :src="resolveImage(circle.image)"
                  :alt="circle.name"
                  class="circle-img"
                  loading="lazy"
                />
                <div v-else-if="circle.badge" class="circle-badge-text">
                  {{ circle.badge }}
                </div>
                <div v-else class="circle-icon-fallback">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <circle cx="12" cy="12" r="8"></circle>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>
                  </svg>
                </div>
              </div>
              <span class="circle-label">{{ circle.name }}</span>
            </button>
          </div>

          <!-- Botón Desplazar Derecha -->
          <button
            v-show="canScrollRightCircles"
            class="circles-nav-btn next"
            type="button"
            aria-label="Ver más opciones"
            @click="scrollCircles('right')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- PANDORA FILTER & SORT BAR (1:1 PANDORA.NET) -->
    <section class="pandora-bar-wrapper">
      <div class="container-fluid pandora-bar-inner">
        <!-- Botón Principal "FILTER & SORT" -->
        <div class="bar-left">
          <button
            type="button"
            class="btn-pandora-filter"
            @click="openDrawer"
          >
            <!-- Sliders Icon exacto de Pandora -->
            <svg class="pandora-sliders-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <span class="btn-text">Filter & Sort</span>
            <span v-if="activeFiltersCount > 0" class="active-badge">{{ activeFiltersCount }}</span>
          </button>

          <span class="bar-divider"></span>

          <!-- Quick Filters de Acceso Rápido -->
          <div class="pandora-quick-filters">
            <button
              type="button"
              class="quick-filter-link"
              :class="{ active: quickFilter === 'new' }"
              @click="quickFilter = quickFilter === 'new' ? 'all' : 'new'"
            >
              Novedades
            </button>
            <button
              type="button"
              class="quick-filter-link"
              :class="{ active: quickFilter === 'offers' }"
              @click="quickFilter = quickFilter === 'offers' ? 'all' : 'offers'"
            >
              En Oferta
            </button>
            <button
              type="button"
              class="quick-filter-link"
              :class="{ active: quickFilter === 'stock' }"
              @click="quickFilter = quickFilter === 'stock' ? 'all' : 'stock'"
            >
              En Stock
            </button>
            <button
              type="button"
              class="quick-filter-link"
              :class="{ active: quickFilter === 'featured' }"
              @click="quickFilter = quickFilter === 'featured' ? 'all' : 'featured'"
            >
              Destacados
            </button>
            <button
              type="button"
              class="quick-filter-link"
              :class="{ active: groupByCategory }"
              @click="groupByCategory = !groupByCategory"
            >
              Agrupar
            </button>
          </div>
        </div>

        <!-- Barra Derecha: Buscador Minimalista y Conteo -->
        <div class="bar-right">
          <div class="bar-search-box">
            <svg class="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar joyas..."
              class="bar-search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-ico-btn"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>

          <span class="prods-counter">
            {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'Pieza' : 'Piezas' }}
          </span>
        </div>
      </div>

      <!-- Fila de Filtros Activos (Chips removibles con fondo blanco continuo) -->
      <div v-if="hasActiveFilters" class="applied-chips-wrapper">
        <div class="container-fluid applied-chips-inner">
          <span class="chips-label">Filtros aplicados:</span>
          <div class="chips-list">
            <button
              v-if="selectedCategory !== 'all'"
              type="button"
              class="chip-tag"
              @click="selectCategory('all')"
            >
              <span>{{ activeCategoryName }}</span>
              <span class="chip-remove">✕</span>
            </button>

            <button
              v-if="searchQuery"
              type="button"
              class="chip-tag"
              @click="searchQuery = ''"
            >
              <span>"{{ searchQuery }}"</span>
              <span class="chip-remove">✕</span>
            </button>

            <button
              v-if="quickFilter !== 'all'"
              type="button"
              class="chip-tag"
              @click="quickFilter = 'all'"
            >
              <span>{{ quickFilterLabel }}</span>
              <span class="chip-remove">✕</span>
            </button>

            <button
              v-if="priceRange !== 'all'"
              type="button"
              class="chip-tag"
              @click="priceRange = 'all'"
            >
              <span>{{ priceRangeLabel }}</span>
              <span class="chip-remove">✕</span>
            </button>

            <button
              v-if="sortBy !== 'featured'"
              type="button"
              class="chip-tag"
              @click="sortBy = 'featured'"
            >
              <span>{{ currentSortLabel }}</span>
              <span class="chip-remove">✕</span>
            </button>

            <button
              type="button"
              class="clear-all-chips-btn"
              @click="clearAllFilters"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- PANDORA SLIDE-OUT DRAWER ("FILTER & SORT") -->
    <Teleport to="body">
      <!-- Backdrop translúcido -->
      <Transition name="fade">
        <div
          v-if="drawerOpen"
          class="pandora-drawer-backdrop"
          @click="closeDrawer"
        ></div>
      </Transition>

      <!-- Panel deslizante desde la derecha -->
      <Transition name="slide-right">
        <aside
          v-if="drawerOpen"
          class="pandora-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Filter & Sort"
        >
          <!-- Drawer Header -->
          <div class="drawer-header">
            <h2 class="drawer-title">Filter & Sort</h2>
            <button
              type="button"
              class="drawer-close-btn"
              aria-label="Cerrar panel"
              @click="closeDrawer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Drawer Body (Scrollable) -->
          <div class="drawer-body">
            <!-- 1. Acordeón SORT -->
            <div class="drawer-accordion">
              <button
                type="button"
                class="accordion-header"
                @click="toggleAccordion('sort')"
              >
                <div>
                  <span class="accordion-name">SORT</span>
                  <span class="accordion-sub">{{ currentSortLabel.toUpperCase() }}</span>
                </div>
                <span class="accordion-plus">{{ openAccordions.sort ? '−' : '+' }}</span>
              </button>

              <div v-show="openAccordions.sort" class="accordion-content">
                <label
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="radio-row"
                >
                  <input
                    type="radio"
                    name="pandoraSort"
                    :value="opt.value"
                    :checked="sortBy === opt.value"
                    @change="sortBy = opt.value"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">{{ opt.label }}</span>
                </label>
              </div>
            </div>

            <!-- 2. Applied Filters Status -->
            <div class="drawer-applied-section">
              <div class="drawer-applied-title">Applied Filters</div>
              <div v-if="!hasActiveFilters" class="no-filters-msg">
                NO FILTERS SELECTED
              </div>
              <div v-else class="drawer-chips-list">
                <span
                  v-if="selectedCategory !== 'all'"
                  class="drawer-chip"
                  @click="selectCategory('all')"
                >
                  {{ activeCategoryName }} ✕
                </span>
                <span
                  v-if="quickFilter !== 'all'"
                  class="drawer-chip"
                  @click="quickFilter = 'all'"
                >
                  {{ quickFilterLabel }} ✕
                </span>
                <span
                  v-if="priceRange !== 'all'"
                  class="drawer-chip"
                  @click="priceRange = 'all'"
                >
                  {{ priceRangeLabel }} ✕
                </span>
                <span
                  v-if="searchQuery"
                  class="drawer-chip"
                  @click="searchQuery = ''"
                >
                  "{{ searchQuery }}" ✕
                </span>
              </div>
            </div>

            <!-- 3. Acordeón CATEGORY -->
            <div class="drawer-accordion">
              <button
                type="button"
                class="accordion-header"
                @click="toggleAccordion('category')"
              >
                <div>
                  <span class="accordion-name">CATEGORÍA</span>
                  <span v-if="selectedCategory !== 'all'" class="accordion-sub">{{ activeCategoryName.toUpperCase() }}</span>
                </div>
                <span class="accordion-plus">{{ openAccordions.category ? '−' : '+' }}</span>
              </button>

              <div v-show="openAccordions.category" class="accordion-content">
                <label class="radio-row">
                  <input
                    type="radio"
                    name="catFilter"
                    value="all"
                    :checked="selectedCategory === 'all'"
                    @change="selectCategory('all')"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Todas las piezas ({{ totalCount }})</span>
                </label>

                <label
                  v-for="cat in categoryFilters"
                  :key="cat.slug"
                  class="radio-row"
                >
                  <input
                    type="radio"
                    name="catFilter"
                    :value="cat.slug"
                    :checked="selectedCategory === cat.slug || selectedCategory === cat.id"
                    @change="selectCategory(cat.slug)"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">{{ cat.name }} ({{ cat.count }})</span>
                </label>
              </div>
            </div>

            <!-- 4. Acordeón PRICE -->
            <div class="drawer-accordion">
              <button
                type="button"
                class="accordion-header"
                @click="toggleAccordion('price')"
              >
                <div>
                  <span class="accordion-name">PRECIO</span>
                  <span v-if="priceRange !== 'all'" class="accordion-sub">{{ priceRangeLabel.toUpperCase() }}</span>
                </div>
                <span class="accordion-plus">{{ openAccordions.price ? '−' : '+' }}</span>
              </button>

              <div v-show="openAccordions.price" class="accordion-content">
                <label class="radio-row">
                  <input
                    type="radio"
                    name="priceFilter"
                    value="all"
                    :checked="priceRange === 'all'"
                    @change="priceRange = 'all'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Todos los precios</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="priceFilter"
                    value="under-15"
                    :checked="priceRange === 'under-15'"
                    @change="priceRange = 'under-15'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Menos de $15</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="priceFilter"
                    value="15-30"
                    :checked="priceRange === '15-30'"
                    @change="priceRange = '15-30'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">$15 a $30</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="priceFilter"
                    value="above-30"
                    :checked="priceRange === 'above-30'"
                    @change="priceRange = 'above-30'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Más de $30</span>
                </label>
              </div>
            </div>

            <!-- 5. Acordeón DISPONIBILIDAD & ESTADO -->
            <div class="drawer-accordion">
              <button
                type="button"
                class="accordion-header"
                @click="toggleAccordion('status')"
              >
                <div>
                  <span class="accordion-name">DISPONIBILIDAD & ESTADO</span>
                  <span v-if="quickFilter !== 'all'" class="accordion-sub">{{ quickFilterLabel.toUpperCase() }}</span>
                </div>
                <span class="accordion-plus">{{ openAccordions.status ? '−' : '+' }}</span>
              </button>

              <div v-show="openAccordions.status" class="accordion-content">
                <label class="radio-row">
                  <input
                    type="radio"
                    name="quickFilterDrawer"
                    value="all"
                    :checked="quickFilter === 'all'"
                    @change="quickFilter = 'all'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Todos</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="quickFilterDrawer"
                    value="stock"
                    :checked="quickFilter === 'stock'"
                    @change="quickFilter = 'stock'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">En Stock</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="quickFilterDrawer"
                    value="offers"
                    :checked="quickFilter === 'offers'"
                    @change="quickFilter = 'offers'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">En Oferta / Descuento</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="quickFilterDrawer"
                    value="new"
                    :checked="quickFilter === 'new'"
                    @change="quickFilter = 'new'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Novedades</span>
                </label>
                <label class="radio-row">
                  <input
                    type="radio"
                    name="quickFilterDrawer"
                    value="featured"
                    :checked="quickFilter === 'featured'"
                    @change="quickFilter = 'featured'"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Destacados</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Drawer Sticky Footer con los dos botones de Pandora -->
          <div class="drawer-footer">
            <button
              type="button"
              class="btn-drawer-clear"
              @click="clearAllFilters"
            >
              Clear All
            </button>
            <button
              type="button"
              class="btn-drawer-view"
              @click="closeDrawer"
            >
              View [{{ filteredProducts.length }}]
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>

    <!-- PRODUCT CATALOG SECTION (FONDO 100% BLANCO) -->
    <section class="container-fluid catalog-section">
      <!-- MODO 1: Agrupado por Categoría -->
      <div v-if="groupByCategory && groupedCategories.length" class="grouped-flow">
        <section
          v-for="(group, gIdx) in groupedCategories"
          :key="group.id"
          class="cat-group-section"
          data-aos="fade-up"
          :data-aos-delay="gIdx * 60"
        >
          <div class="cat-group-head">
            <div class="group-title-box">
              <h2 class="group-name">{{ group.name }}</h2>
              <span class="group-badge">{{ group.count }} {{ group.count === 1 ? 'pieza' : 'piezas' }}</span>
            </div>
            <button
              v-if="selectedCategory !== group.slug"
              type="button"
              class="group-isolate-btn"
              @click="selectCategory(group.slug)"
            >
              <span>Ver solo esta categoría</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div class="pandora-product-grid">
            <ProductCard
              v-for="product in group.products"
              :key="product.id"
              :product="product"
            />
          </div>
        </section>
      </div>

      <!-- MODO 2: Cuadrícula General Normal -->
      <div
        v-else-if="filteredProducts.length"
        class="pandora-product-grid"
      >
        <ProductCard
          v-for="(product, idx) in filteredProducts"
          :key="product.id"
          :product="product"
          data-aos="fade-up"
          :data-aos-delay="Math.min(idx * 40, 300)"
        />
      </div>

      <!-- Estado Vacío Elegante -->
      <div v-else class="pandora-empty" data-aos="fade-up">
        <div class="empty-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <h3 class="empty-heading">No se encontraron piezas</h3>
        <p class="empty-subheading">
          Prueba con otros términos de búsqueda o restablece los filtros para descubrir toda la colección.
        </p>
        <button
          type="button"
          class="btn-empty-reset"
          @click="clearAllFilters"
        >
          Ver Todas las Joyas
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* 100% FONDO BLANCO PURO SEGÚN LO SOLICITADO */
.shop.pandora-theme {
  background: #ffffff !important;
  color: #222222;
  min-height: 85vh;
  padding-bottom: 90px;
}

/* ==========================================================================
   PANDORA HERO SECTION
   ========================================================================== */
.pandora-hero {
  background: #ffffff;
  padding: 40px 0 28px;
}

.pandora-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(40px, 5vw, 100px);
  width: 100%;
}

.pandora-title-block {
  flex: 0 0 clamp(300px, 24vw, 440px);
}

.pandora-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #767676;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.pandora-breadcrumbs a {
  color: #767676;
  transition: color 0.2s;
}

.pandora-breadcrumbs a:hover {
  color: #000000;
}

.crumb-sep {
  color: #cccccc;
}

.crumb-current {
  color: #000000;
  font-weight: 600;
}

.pandora-headline {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #111111;
  text-transform: uppercase;
  margin: 0 0 10px;
  line-height: 1.1;
  font-family: var(--font-body);
}

.pandora-subtext {
  font-size: 13.5px;
  color: #666666;
  line-height: 1.55;
  margin: 0;
  max-width: 420px;
}

/* Carrusel de Círculos Estilo Pandora */
.pandora-circles-carousel {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
}

.circles-nav-btn {
  position: absolute;
  top: 32px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #dcdcdc;
  color: #111111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.circles-nav-btn:hover {
  background: #111111;
  color: #ffffff;
  border-color: #111111;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}

.circles-nav-btn.prev {
  left: 0px;
}

.circles-nav-btn.next {
  right: 0px;
}

.circles-track {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: clamp(24px, 2.5vw, 44px);
  overflow-x: auto;
  padding: 12px 6px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.circles-track::-webkit-scrollbar {
  display: none;
}

.circle-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  cursor: pointer;
  width: 96px;
  text-align: center;
  transition: transform 0.2s ease;
}

.circle-item:hover {
  transform: translateY(-3px);
}

.circle-disk {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: #fbfbfb;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.circle-item:hover .circle-disk,
.circle-item.active .circle-disk {
  border-color: #111111;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.circle-item.active .circle-disk {
  border-width: 2px;
}

.circle-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.circle-badge-text {
  font-size: 12px;
  font-weight: 700;
  color: #111111;
  letter-spacing: 0.05em;
}

.circle-icon-fallback {
  color: #777777;
}

.circle-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  color: #333333;
  letter-spacing: 0.04em;
  line-height: 1.3;
  transition: color 0.2s;
}

.circle-item.active .circle-label {
  color: #000000;
  font-weight: 700;
}

/* ==========================================================================
   PANDORA FILTER & SORT BAR
   ========================================================================== */
.pandora-bar-wrapper {
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 30;
}

.pandora-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 14px;
  padding-bottom: 14px;
  width: 100%;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* Botón Filter & Sort con icono Sliders */
.btn-pandora-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #111111;
  padding: 6px 4px;
  transition: opacity 0.2s;
}

.btn-pandora-filter:hover {
  opacity: 0.7;
}

.pandora-sliders-icon {
  color: #111111;
}

.btn-pandora-filter .btn-text {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #111111;
}

.active-badge {
  background: #111111;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 12px;
}

.bar-divider {
  width: 1px;
  height: 20px;
  background: #e2e2e2;
}

/* Enlaces Rápidos de Filtro */
.pandora-quick-filters {
  display: flex;
  align-items: center;
  gap: 18px;
}

.quick-filter-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555555;
  padding: 6px 0;
  position: relative;
  transition: color 0.2s;
}

.quick-filter-link:hover {
  color: #000000;
}

.quick-filter-link.active {
  color: #000000;
  font-weight: 700;
}

.quick-filter-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #000000;
}

/* Barra Derecha: Buscador y Contador */
.bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-ico {
  position: absolute;
  left: 10px;
  color: #888888;
  pointer-events: none;
}

.bar-search-input {
  border: 1px solid #dedede;
  border-radius: 4px;
  padding: 6px 26px 6px 30px;
  font-size: 12px;
  width: 160px;
  outline: none;
  background: #ffffff;
  color: #111111;
  transition: all 0.2s ease;
}

.bar-search-input:focus {
  border-color: #111111;
  width: 210px;
}

.clear-ico-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  font-size: 10px;
  color: #999999;
  cursor: pointer;
}

.prods-counter {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #777777;
  white-space: nowrap;
}

/* Fila de Chips Activos (Fondo 100% blanco continuo) */
.applied-chips-wrapper {
  width: 100%;
  background: #ffffff;
  border-top: 1px solid #eeeeee;
}

.applied-chips-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 10px;
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.chips-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888888;
}

.chips-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #111111;
  padding: 4px 10px;
  border-radius: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: #111111;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-tag:hover {
  background: #111111;
  color: #ffffff;
}

.chip-tag:hover .chip-remove {
  color: #ffffff;
}

.chip-remove {
  font-size: 10px;
  color: #666666;
  font-weight: 700;
  transition: color 0.15s;
}

.clear-all-chips-btn {
  background: none;
  border: none;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #111111;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 6px;
  transition: opacity 0.2s;
}

.clear-all-chips-btn:hover {
  opacity: 0.6;
}

.clear-all-chips-btn:hover {
  color: #000000;
}

/* ==========================================================================
   PANDORA SLIDE-OUT DRAWER
   ========================================================================== */
.pandora-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 998;
}

.pandora-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  max-width: 90vw;
  background: #ffffff;
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.18);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 18px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-title {
  font-size: 20px;
  font-weight: 500;
  color: #111111;
  margin: 0;
  letter-spacing: 0.02em;
}

.drawer-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #222222;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.drawer-close-btn:hover {
  opacity: 0.6;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 28px;
}

/* Acordeón */
.drawer-accordion {
  border-bottom: 1px solid #e8e8e8;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.accordion-name {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #111111;
}

.accordion-sub {
  display: block;
  font-size: 11px;
  color: #888888;
  margin-top: 3px;
  letter-spacing: 0.04em;
}

.accordion-plus {
  font-size: 20px;
  font-weight: 300;
  color: #111111;
  line-height: 1;
}

.accordion-content {
  padding: 4px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Radio Row */
.radio-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.radio-row input[type='radio'] {
  display: none;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #999999;
  position: relative;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.radio-row input[type='radio']:checked + .radio-custom {
  border-color: #111111;
}

.radio-row input[type='radio']:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #111111;
}

.radio-label {
  font-size: 13.5px;
  color: #333333;
}

/* Applied Filters Box en Drawer */
.drawer-applied-section {
  padding: 18px 0;
  border-bottom: 1px solid #e8e8e8;
}

.drawer-applied-title {
  font-size: 13px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
}

.no-filters-msg {
  font-size: 11px;
  color: #999999;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.drawer-chips-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.drawer-chip {
  background: #f4f4f4;
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 12px;
  color: #222222;
  cursor: pointer;
}

.drawer-chip:hover {
  background: #e9e9e9;
}

/* Sticky Drawer Footer con dos botones de Pandora */
.drawer-footer {
  padding: 18px 28px;
  border-top: 1px solid #e8e8e8;
  background: #ffffff;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.btn-drawer-clear {
  padding: 14px;
  background: #ffffff;
  border: 1px solid #222222;
  color: #111111;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btn-drawer-clear:hover {
  background: #f7f7f7;
}

.btn-drawer-view {
  padding: 14px;
  background: #111111;
  border: 1px solid #111111;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btn-drawer-view:hover {
  background: #333333;
  border-color: #333333;
}

/* Transiciones del Drawer */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* ==========================================================================
   CATALOG GRID & LAYOUT
   ========================================================================== */
.catalog-section {
  padding-top: 36px;
  background: #ffffff;
  width: 100%;
}

.pandora-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px 24px;
  width: 100%;
}

/* Flujo Agrupado */
.grouped-flow {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.cat-group-section {
  border-top: 1px solid #eaeaea;
  padding-top: 28px;
}

.cat-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  gap: 14px;
  flex-wrap: wrap;
}

.group-title-box {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.group-name {
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.group-badge {
  font-size: 12px;
  color: #777777;
}

.group-isolate-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #111111;
  background: none;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: opacity 0.2s;
}

.group-isolate-btn:hover {
  opacity: 0.6;
}

/* Estado Vacío */
.pandora-empty {
  text-align: center;
  padding: 80px 20px;
  max-width: 480px;
  margin: 30px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f7f7f7;
  border: 1px solid #e5e5e5;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-heading {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin: 0;
}

.empty-subheading {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  margin: 0 0 10px;
}

.btn-empty-reset {
  padding: 12px 28px;
  background: #111111;
  color: #ffffff;
  border: 1px solid #111111;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-empty-reset:hover {
  background: #333333;
}

/* ==========================================================================
   RESPONSIVE DESIGN
   ========================================================================== */
@media (max-width: 960px) {
  .pandora-hero-inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .pandora-title-block {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .pandora-circles-carousel {
    width: 100%;
  }
  .pandora-bar-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .bar-left {
    width: 100%;
    justify-content: space-between;
  }
  .bar-right {
    width: 100%;
    justify-content: space-between;
  }
  .bar-search-input {
    width: 100%;
  }
  .bar-search-box {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .pandora-product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 12px;
  }
  .pandora-quick-filters {
    display: none; /* En móvil se accede vía Filter & Sort */
  }
  .bar-divider {
    display: none;
  }
  .pandora-drawer {
    width: 100vw;
    max-width: 100vw;
  }
}

@media (max-width: 440px) {
  .circle-item {
    width: 76px;
  }
  .circle-disk {
    width: 66px;
    height: 66px;
  }
}
</style>
