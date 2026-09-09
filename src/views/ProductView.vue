<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogStore } from '@/store/catalog'
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import { useCurrencyStore } from '@/store/currency'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const route = useRoute()
const cart = useCartStore()
const catalog = useCatalogStore()
const currency = useCurrencyStore()
const qty = ref(1)

// Multi-Image Gallery State
const activeImageIndex = ref(0)
const isGalleryPaused = ref(false)
const thumbStrip = ref(null)
let autoSlideTimer = null

const product = computed(() => catalog.byId(route.params.id))
const related = computed(() =>
  catalog.products.filter((p) => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 4),
)

const productImages = computed(() => {
  if (!product.value) return []
  if (Array.isArray(product.value.images) && product.value.images.length > 0) {
    return product.value.images
  }
  return product.value.image ? [product.value.image] : []
})

const currentImage = computed(() => {
  if (!productImages.value.length) return ''
  return productImages.value[activeImageIndex.value] || productImages.value[0] || ''
})

function selectImage(idx) {
  activeImageIndex.value = idx
  if (product.value?.hasOptions && product.value.options.length) {
    const targetImg = productImages.value[idx]
    const matched = product.value.options.find((o) => o.image === targetImg)
    if (matched) {
      selectedOption.value = matched
      qty.value = 1
    }
  }
  resetAutoSlide()
}

function nextImage(e) {
  if (e) e.stopPropagation()
  if (productImages.value.length <= 1) return
  activeImageIndex.value = (activeImageIndex.value + 1) % productImages.value.length
  resetAutoSlide()
}

function prevImage(e) {
  if (e) e.stopPropagation()
  if (productImages.value.length <= 1) return
  activeImageIndex.value =
    (activeImageIndex.value - 1 + productImages.value.length) % productImages.value.length
  resetAutoSlide()
}

function startAutoSlide() {
  stopAutoSlide()
  if (productImages.value.length <= 1) return
  autoSlideTimer = setInterval(() => {
    if (!isGalleryPaused.value && !isZoomOpen.value && productImages.value.length > 1) {
      activeImageIndex.value = (activeImageIndex.value + 1) % productImages.value.length
    }
  }, 4000)
}

function stopAutoSlide() {
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer)
    autoSlideTimer = null
  }
}

function resetAutoSlide() {
  stopAutoSlide()
  startAutoSlide()
}

function onGalleryMouseEnter() {
  isGalleryPaused.value = true
}

function onGalleryMouseLeave() {
  isGalleryPaused.value = false
}

// Touch swipe gestures on mobile
let touchStartX = 0
let touchEndX = 0

function onGalleryTouchStart(e) {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX
    isGalleryPaused.value = true
  }
}

function onGalleryTouchEnd(e) {
  if (e.changedTouches.length === 1) {
    touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > 35) {
      if (diff > 0) nextImage()
      else prevImage()
    }
    setTimeout(() => {
      isGalleryPaused.value = false
    }, 1200)
  }
}

// Zoom Modal State
const isZoomOpen = ref(false)
const zoomScale = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const startOffset = ref({ x: 0, y: 0 })

function openZoom() {
  if (!currentImage.value) return
  isZoomOpen.value = true
  zoomScale.value = 1
  panOffset.value = { x: 0, y: 0 }
  document.body.style.overflow = 'hidden'
}

function closeZoom() {
  isZoomOpen.value = false
  zoomScale.value = 1
  panOffset.value = { x: 0, y: 0 }
  document.body.style.overflow = ''
}

function zoomIn() {
  zoomScale.value = Math.min(3.5, Number((zoomScale.value + 0.5).toFixed(2)))
}

function zoomOut() {
  const next = Math.max(1, Number((zoomScale.value - 0.5).toFixed(2)))
  zoomScale.value = next
  if (next <= 1) {
    panOffset.value = { x: 0, y: 0 }
  }
}

function resetZoom() {
  zoomScale.value = 1
  panOffset.value = { x: 0, y: 0 }
}

function toggleZoom() {
  if (zoomScale.value > 1.2) {
    resetZoom()
  } else {
    zoomScale.value = 2.2
  }
}

function handleWheel(e) {
  const delta = e.deltaY > 0 ? -0.25 : 0.25
  const nextScale = Math.min(3.5, Math.max(1, Number((zoomScale.value + delta).toFixed(2))))
  zoomScale.value = nextScale
  if (nextScale <= 1) {
    panOffset.value = { x: 0, y: 0 }
  }
}

function startDrag(e) {
  if (zoomScale.value <= 1) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  startOffset.value = { ...panOffset.value }
}

function onDrag(e) {
  if (!isDragging.value || zoomScale.value <= 1) return
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  panOffset.value = {
    x: startOffset.value.x + dx,
    y: startOffset.value.y + dy,
  }
}

function stopDrag() {
  isDragging.value = false
}

function onTouchStart(e) {
  if (e.touches.length === 1 && zoomScale.value > 1) {
    isDragging.value = true
    dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    startOffset.value = { ...panOffset.value }
  }
}

function onTouchMove(e) {
  if (!isDragging.value || e.touches.length !== 1 || zoomScale.value <= 1) return
  const dx = e.touches[0].clientX - dragStart.value.x
  const dy = e.touches[0].clientY - dragStart.value.y
  panOffset.value = {
    x: startOffset.value.x + dx,
    y: startOffset.value.y + dy,
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && isZoomOpen.value) {
    closeZoom()
  } else if (e.key === 'ArrowRight') {
    nextImage()
  } else if (e.key === 'ArrowLeft') {
    prevImage()
  }
}

const selectedOption = ref(null)

function initSelectedOption() {
  if (product.value?.options && product.value.options.length > 0) {
    if (product.value.isMultiple) {
      const firstWithStock = product.value.options.find((o) => (Number(o.stock) || 0) > 0)
      selectedOption.value = firstWithStock || product.value.options[0]
    } else {
      // Individual: selecciona la primera opción (#1) por defecto
      selectedOption.value = product.value.options[0]
    }
    const idx = productImages.value.findIndex((img) => img === selectedOption.value?.image)
    if (idx !== -1) {
      activeImageIndex.value = idx
    }
  } else {
    selectedOption.value = null
  }
}

function selectOption(opt) {
  selectedOption.value = opt
  qty.value = 1
  const idx = productImages.value.findIndex((img) => img === opt.image)
  if (idx !== -1) {
    activeImageIndex.value = idx
    resetAutoSlide()
  }
}

const remainingStock = computed(() => {
  if (!product.value) return 0
  if (product.value.isMultiple && selectedOption.value) {
    const optStock = Number(selectedOption.value.stock) || 0
    const optKey = `${product.value.id}__opt_${selectedOption.value.id}`
    const inCart = (cart.items || []).find((it) => (it.itemKey || it.id) === optKey)?.qty || 0
    return Math.max(0, optStock - inCart)
  }
  // Individual: maneja el stock global único del producto
  const inCart = (cart.items || []).filter((it) => it.id === product.value.id).reduce((s, it) => s + it.qty, 0)
  return Math.max(0, (Number(product.value.stock) || 0) - inCart)
})

const inStock = computed(() => remainingStock.value > 0)
const maxQty = computed(() => Math.max(1, remainingStock.value || 1))

function increment() {
  if (qty.value < maxQty.value) qty.value += 1
}

function decrement() {
  if (qty.value > 1) qty.value -= 1
}

function addToCart() {
  if (!product.value || remainingStock.value <= 0) return
  cart.add(product.value, qty.value, selectedOption.value)
}

function buyNow() {
  if (!product.value || remainingStock.value <= 0) return
  cart.add(product.value, qty.value, selectedOption.value)
  cart.checkout()
}

watch(
  () => route.params.id,
  () => {
    qty.value = 1
    activeImageIndex.value = 0
    initSelectedOption()
    resetAutoSlide()
  },
)

watch(
  () => product.value,
  () => {
    initSelectedOption()
  },
  { immediate: true },
)

watch(
  () => productImages.value.length,
  () => {
    if (activeImageIndex.value >= productImages.value.length) {
      activeImageIndex.value = 0
    }
    resetAutoSlide()
  },
)

watch(
  () => activeImageIndex.value,
  (idx) => {
    if (thumbStrip.value && thumbStrip.value.children[idx]) {
      thumbStrip.value.children[idx].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  },
)

onMounted(() => {
  catalog.fetch()
  window.addEventListener('keydown', onKeydown)
  startAutoSlide()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  stopAutoSlide()
})
</script>

<template>
  <main v-if="product" class="product-page">
    <div class="container">
      <nav class="crumbs">
        <router-link to="/">Inicio</router-link> /
        <router-link to="/tienda">Tienda</router-link> /
        <router-link :to="`/tienda/${product.category}`">{{ product.categoryName }}</router-link> /
        <span>{{ product.name }}</span>
      </nav>

      <div class="product-layout">
        <!-- Columna de Fotos / Galería Interactiva -->
        <div class="product-media-col" data-aos="fade-right">
          <div
            class="product-image"
            @click="openZoom"
            @mouseenter="onGalleryMouseEnter"
            @mouseleave="onGalleryMouseLeave"
            @touchstart.passive="onGalleryTouchStart"
            @touchend.passive="onGalleryTouchEnd"
            title="Haz clic para ampliar la imagen"
          >
            <!-- Imagen Principal -->
            <transition name="fade-img" mode="out-in">
              <img
                :key="currentImage"
                :src="resolveImage(currentImage)"
                :alt="`${product.name} - foto ${activeImageIndex + 1}`"
                class="main-img"
              />
            </transition>

            <!-- Badges superiores (Stock y Descuento) -->
            <div class="product-image-badges">
              <span class="stock-pill-badge" :class="{ out: !inStock }">
                <span class="stock-dot"></span>
                {{ inStock ? 'En stock' : 'Agotado' }}
              </span>
              <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}% OFF</span>
            </div>

            <!-- Flechas de navegación (si hay más de 1 imagen) -->
            <template v-if="productImages.length > 1">
              <button
                type="button"
                class="gallery-arrow arrow-prev"
                aria-label="Foto anterior"
                title="Foto anterior"
                @click.stop="prevImage"
              >
                <AppIcon name="chevronLeft" :size="20" />
              </button>
              <button
                type="button"
                class="gallery-arrow arrow-next"
                aria-label="Siguiente foto"
                title="Siguiente foto"
                @click.stop="nextImage"
              >
                <AppIcon name="chevronRight" :size="20" />
              </button>
            </template>

            <!-- Contador de fotos estilo reyesboutique (ej: 5 / 7) -->
            <div v-if="productImages.length > 1" class="photo-counter-pill">
              {{ activeImageIndex + 1 }} / {{ productImages.length }}
            </div>

            <div class="zoom-indicator">
              <AppIcon name="search" :size="14" />
              <span>Zoom</span>
            </div>
          </div>

          <!-- Carrusel de Miniaturas debajo de la foto principal (Idéntico a la imagen enviada por el usuario) -->
          <div
            v-if="productImages.length > 1"
            class="thumbnails-wrapper"
            @mouseenter="onGalleryMouseEnter"
            @mouseleave="onGalleryMouseLeave"
          >
            <div class="thumbnails-track" ref="thumbStrip">
              <button
                v-for="(img, idx) in productImages"
                :key="idx"
                type="button"
                class="thumb-item"
                :class="{ active: idx === activeImageIndex }"
                :aria-label="`Ver foto ${idx + 1}`"
                @click="selectImage(idx)"
              >
                <img :src="resolveImage(img)" :alt="`${product.name} miniatura ${idx + 1}`" />
              </button>
            </div>
          </div>
        </div>

        <!-- Columna de Información del Producto -->
        <div class="product-info" data-aos="fade-left">
          <span class="eyebrow">{{ product.categoryName }}</span>
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="price-box">
            <div class="price">
              <span class="price-now">{{ formatPrice(product.price) }}</span>
              <span v-if="product.oldPrice && product.oldPrice > product.price" class="price-old">
                {{ formatPrice(product.oldPrice) }}
              </span>
            </div>
            <span v-if="product.discount" class="discount-pill">
              Ahorras {{ formatPrice(product.oldPrice - product.price) }} (-{{ product.discount }}%)
            </span>
          </div>

          <!-- Precio en Bolívares a la tasa del momento -->
          <div v-if="currency.effectiveRate" class="price-bs-large">
            <span class="bs-amount">Bs. {{ currency.formatBsNum(product.price) }}</span>
            <span class="bs-rate-tag" title="Calculado con la tasa oficial BCV de DolarVZLA">
              Tasa BCV del momento: {{ currency.formattedRate }}
            </span>
          </div>

          <div v-if="product.discountSource === 'category'" class="category-promo-note">
            Descuento especial del {{ product.discount }}% aplicado por categoría: <strong>{{ product.categoryName }}</strong>
          </div>

          <p v-if="product.description" class="desc">
            {{ product.description }}
          </p>

          <!-- Selector de Variantes / Opciones por foto (estilo Reyes Boutique) -->
          <div v-if="product.options && product.options.length > 1" class="variant-box">
            <div class="variant-top-row">
              <div class="variant-label-group">
                <span class="variant-heading">{{ product.isMultiple ? 'Variante' : 'Opción' }}</span>
                <span v-if="selectedOption" class="variant-active-pill">
                  {{ selectedOption.name }}
                </span>
              </div>
              <span class="variant-total-count">{{ product.options.length }} opciones</span>
            </div>

            <div class="variant-grid">
              <button
                v-for="opt in product.options"
                :key="opt.id"
                type="button"
                class="variant-card"
                :class="{
                  'active': selectedOption?.id === opt.id,
                  'is-exhausted': product.isMultiple ? ((Number(opt.stock) || 0) <= 0) : (remainingStock <= 0),
                }"
                :aria-label="`Elegir ${opt.name}`"
                @click="selectOption(opt)"
              >
                <div class="variant-card-media">
                  <img :src="resolveImage(opt.image)" :alt="opt.name" />
                  <!-- Badge circular negro con check blanco al estar seleccionada -->
                  <span v-if="selectedOption?.id === opt.id" class="variant-check-pill">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div class="variant-card-footer">
                  <span class="variant-card-name" :title="opt.name">{{ opt.name }}</span>
                  <template v-if="product.isMultiple">
                    <span v-if="(Number(opt.stock) || 0) <= 0" class="variant-card-status out">Agotado</span>
                    <span v-else class="variant-card-status in">{{ opt.stock }} disp.</span>
                  </template>
                  <template v-else>
                    <span v-if="remainingStock <= 0" class="variant-card-status out">Agotado</span>
                    <span v-else class="variant-card-status in">{{ remainingStock }} disp.</span>
                  </template>
                </div>
              </button>
            </div>
          </div>

          <div class="qty-row">
            <div class="qty">
              <button class="qty-btn" aria-label="Menos" :disabled="qty <= 1" @click="decrement">
                <AppIcon name="minus" :size="15" />
              </button>
              <span class="qty-num">{{ qty }}</span>
              <button class="qty-btn" aria-label="Más" :disabled="qty >= maxQty || !inStock" @click="increment">
                <AppIcon name="plus" :size="15" />
              </button>
            </div>
            <div class="subtotal-group">
              <span class="subtotal">Total: {{ formatPrice(product.price * qty) }}</span>
              <span v-if="currency.effectiveRate" class="subtotal-bs">
                (Bs. {{ currency.formatBsNum(product.price * qty) }})
              </span>
            </div>
          </div>

          <div class="avail-row">
            <template v-if="product.isMultiple && selectedOption">
              <span v-if="remainingStock > 0" class="avail">
                Stock disponible de <strong>{{ selectedOption.name }}</strong>: {{ remainingStock }}
              </span>
              <span v-else class="avail out">
                La opción <strong>{{ selectedOption.name }}</strong> está agotada temporalmente.
              </span>
            </template>
            <template v-else>
              <span class="avail" :class="{ out: remainingStock <= 0 }">
                Stock disponible: {{ remainingStock }}
              </span>
            </template>
          </div>

          <div class="buy-row">
            <button class="btn btn-primary" :disabled="remainingStock <= 0" @click="addToCart">
              <AppIcon name="bag" :size="17" />
              {{ remainingStock > 0 ? 'Agregar al carrito' : 'Agotado' }}
            </button>
            <button
              class="btn btn-whatsapp"
              :disabled="!inStock || remainingStock <= 0"
              @click="buyNow"
            >
              <AppIcon name="whatsapp" :size="17" />
              Comprar ahora
            </button>
          </div>

          <div class="features-mini">
            <div class="mini"><AppIcon name="truck" :size="16" /> Envíos a todo el país</div>
            <div class="mini"><AppIcon name="gift" :size="16" /> Empaque para regalo</div>
            <div class="mini"><AppIcon name="shield" :size="16" /> Compra segura</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Zoom / Lightbox -->
    <Teleport to="body">
      <Transition name="zoom-modal">
        <div
          v-if="isZoomOpen"
          class="zoom-backdrop"
          @click.self="closeZoom"
          @wheel.prevent="handleWheel"
        >
          <div class="zoom-topbar">
            <div class="zoom-title">
              <span>{{ product.name }}</span>
              <span v-if="productImages.length > 1" class="zoom-counter">
                ({{ activeImageIndex + 1 }} / {{ productImages.length }})
              </span>
            </div>
            <div class="zoom-controls">
              <button
                class="zoom-btn"
                @click="zoomOut"
                :disabled="zoomScale <= 1"
                title="Alejar (-)"
                aria-label="Alejar"
              >
                <AppIcon name="minus" :size="18" />
              </button>
              <button
                class="zoom-btn zoom-level"
                @click="resetZoom"
                title="Restablecer zoom a 100%"
              >
                {{ Math.round(zoomScale * 100) }}%
              </button>
              <button
                class="zoom-btn"
                @click="zoomIn"
                :disabled="zoomScale >= 3.5"
                title="Acercar (+)"
                aria-label="Acercar"
              >
                <AppIcon name="plus" :size="18" />
              </button>
              <button
                class="zoom-btn zoom-close"
                @click="closeZoom"
                title="Cerrar (Esc)"
                aria-label="Cerrar"
              >
                <AppIcon name="close" :size="20" />
              </button>
            </div>
          </div>

          <div
            class="zoom-viewport"
            :class="{ 'is-zoomed': zoomScale > 1, 'is-dragging': isDragging }"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="stopDrag"
            @dblclick="toggleZoom"
          >
            <!-- Navegación dentro del lightbox -->
            <template v-if="productImages.length > 1 && zoomScale <= 1.1">
              <button
                class="zoom-nav-btn prev"
                aria-label="Foto anterior"
                @click.stop="prevImage"
              >
                <AppIcon name="chevronLeft" :size="26" />
              </button>
              <button
                class="zoom-nav-btn next"
                aria-label="Foto siguiente"
                @click.stop="nextImage"
              >
                <AppIcon name="chevronRight" :size="26" />
              </button>
            </template>

            <img
              :src="resolveImage(currentImage)"
              :alt="product.name"
              class="zoom-img"
              :style="{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }"
              draggable="false"
            />
          </div>

          <div class="zoom-hint-bottom">
            <span>Doble clic para {{ zoomScale > 1.2 ? 'restablecer' : 'acercar' }} · Rueda del mouse para zoom · Flechas para cambiar de foto</span>
          </div>
        </div>
      </Transition>
    </Teleport>

    <section v-if="related.length" class="container related">
      <div class="section-head" data-aos="fade-down">
        <span class="eyebrow">También te puede gustar</span>
        <h2 class="section-title">Productos relacionados</h2>
      </div>
      <div class="related-grid">
        <ProductCard
          v-for="(item, index) in related"
          :key="item.id"
          :product="item"
          data-aos="fade-up"
          :data-aos-delay="Math.min(index * 60, 400)"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.product-page {
  padding: 20px 0 70px;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-400);
  margin: 20px 0 30px;
  flex-wrap: wrap;
}

.crumbs a:hover {
  color: var(--rose-600);
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: start;
}

/* Columna de Medios / Galería */
.product-media-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.product-image {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--rose-50);
  cursor: zoom-in;
  aspect-ratio: 1;
  max-height: 540px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.product-image .main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.product-image:hover .main-img {
  transform: scale(1.025);
}

.fade-img-enter-active,
.fade-img-leave-active {
  transition: opacity 0.22s ease;
}

.fade-img-enter-from,
.fade-img-leave-to {
  opacity: 0.6;
}

/* Flechas de Navegación */
.gallery-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #111111;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition: all 0.2s ease;
  z-index: 3;
  opacity: 0;
  backdrop-filter: blur(4px);
}

.product-image:hover .gallery-arrow {
  opacity: 1;
}

.gallery-arrow.arrow-prev {
  left: 12px;
}

.gallery-arrow.arrow-next {
  right: 12px;
}

.gallery-arrow:hover {
  background: #ffffff;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

/* Contador de Fotos (ej: 5 / 7) */
.photo-counter-pill {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(18, 18, 20, 0.72);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  letter-spacing: 0.04em;
  z-index: 2;
  pointer-events: none;
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(18, 18, 20, 0.72);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 2;
}

.product-image:hover .zoom-indicator {
  background: rgba(18, 18, 20, 0.88);
  transform: translateY(-1px);
}

.product-image-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
}

.stock-pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #059669;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(4px);
}

.stock-pill-badge .stock-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
}

.stock-pill-badge.out {
  color: #dc2626;
  background: rgba(254, 242, 242, 0.94);
}

.stock-pill-badge.out .stock-dot {
  background: #ef4444;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 999px;
  color: var(--white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tag-discount {
  background: linear-gradient(135deg, #e84a6f 0%, #c92a54 100%);
  letter-spacing: 0.02em;
}

/* Carrusel de Miniaturas inferior */
.thumbnails-wrapper {
  position: relative;
  width: 100%;
}

.thumbnails-track {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
  padding: 4px 2px 8px;
}

.thumbnails-track::-webkit-scrollbar {
  display: none;
}

.thumb-item {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  padding: 0;
  background: #f8f8f8;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.22s ease;
  position: relative;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.thumb-item:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.thumb-item.active {
  border-color: #111111;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

/* Información del Producto */
.product-info {
  padding-top: 8px;
}

.product-name {
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 600;
  color: var(--ink-900);
  line-height: 1.1;
  margin: 12px 0 14px;
}

.price-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.price-now {
  font-size: 32px;
  font-weight: 600;
  color: var(--ink-900);
}

.price-old {
  font-size: 18px;
  color: var(--ink-400);
  text-decoration: line-through;
}

.discount-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  background: #fff0f3;
  color: #c92a54;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid #fed7e2;
}

.price-bs-large {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.bs-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--rose-600);
  letter-spacing: 0.01em;
}

.bs-rate-tag {
  font-size: 11.5px;
  background: #fff5f7;
  border: 1px solid var(--rose-200, #f3c6d2);
  color: var(--ink-600);
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.category-promo-note {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fdf2f4;
  color: #c92a54;
  font-size: 12.5px;
  border-left: 3px solid #e84a6f;
}

.desc {
  color: var(--ink-500);
  font-size: 15px;
  margin-bottom: 22px;
  max-width: 480px;
  line-height: 1.6;
  white-space: pre-line;
}

/* Selector de Variantes (Diseño tipo Reyes Boutique) */
.variant-box {
  margin: 18px 0 24px;
  padding: 16px 18px;
  background: #fdfbfb;
  border: 1px solid #f1e2e6;
  border-radius: 14px;
}

.variant-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.variant-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.variant-heading {
  font-family: var(--font-body);
  font-size: 14.5px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.01em;
}

.variant-active-pill {
  font-size: 12px;
  font-weight: 700;
  color: #c92a54;
  background: #fff0f3;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #fed7e2;
}

.variant-total-count {
  font-size: 12px;
  color: #888888;
  font-weight: 500;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.variant-card {
  position: relative;
  background: #ffffff;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  text-align: left;
}

.variant-card:hover {
  border-color: #111111;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.variant-card.active {
  border-color: #111111;
  border-width: 2.5px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
}

.variant-card.is-exhausted {
  opacity: 0.7;
}

.variant-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f4f4f4;
}

.variant-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.variant-card:hover .variant-card-media img {
  transform: scale(1.05);
}

.variant-card.is-exhausted .variant-card-media img {
  filter: grayscale(100%);
  opacity: 0.6;
}

/* Badge circular negro con check blanco (exacto al screenshot) */
.variant-check-pill {
  position: absolute;
  bottom: 5px;
  left: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.variant-card-footer {
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  background: #ffffff;
  transition: background 0.2s ease, color 0.2s ease;
}

.variant-card.active .variant-card-footer {
  background: #111111;
  color: #ffffff;
}

.variant-card-name {
  font-family: var(--font-body);
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.variant-card-status {
  font-size: 9px;
  font-weight: 700;
  line-height: 1.1;
}

.variant-card-status.out {
  color: #dc2626;
}

.variant-card.active .variant-card-status.out {
  color: #fca5a5;
}

.variant-card-status.in,
.variant-card-status.low {
  color: #d97706;
}

.variant-card.active .variant-card-status.in,
.variant-card.active .variant-card-status.low {
  color: #fde68a;
}

.avail-row {
  margin-bottom: 20px;
}

.avail.out {
  color: #dc2626;
  font-weight: 600;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 3px;
  background: #ffffff;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #ffffff;
  color: #111111;
  border-radius: 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-num {
  width: 34px;
  text-align: center;
  font-size: 13.5px;
  font-weight: 600;
  color: #111111;
}

.subtotal-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.subtotal {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-700);
}

.subtotal-bs {
  font-size: 14px;
  font-weight: 600;
  color: var(--rose-600);
}

.avail {
  font-size: 13px;
  color: var(--ink-400);
  margin-bottom: 20px;
}

.buy-row {
  display: flex;
  gap: 14px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}

.buy-row .btn {
  flex: 1;
  min-width: 170px;
  padding: 13px 20px;
}

.features-mini {
  display: flex;
  gap: 26px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.mini {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-500);
}

.mini svg {
  color: var(--rose-500);
}

/* Lightbox / Zoom Modal */
.zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 10, 14, 0.94);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.zoom-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  flex-shrink: 0;
  z-index: 10;
}

.zoom-title {
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-counter {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.08);
}

.zoom-btn.zoom-level {
  width: auto;
  padding: 0 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.zoom-btn.zoom-close {
  background: rgba(220, 38, 38, 0.8);
  border-color: rgba(220, 38, 38, 0.9);
}

.zoom-btn.zoom-close:hover {
  background: #dc2626;
}

.zoom-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: zoom-in;
  padding: 10px;
}

.zoom-viewport.is-zoomed {
  cursor: grab;
}

.zoom-viewport.is-dragging {
  cursor: grabbing;
}

.zoom-img {
  max-width: 88vw;
  max-height: 76vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
  pointer-events: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.zoom-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.zoom-nav-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-50%) scale(1.1);
}

.zoom-nav-btn.prev {
  left: 20px;
}

.zoom-nav-btn.next {
  right: 20px;
}

.zoom-hint-bottom {
  text-align: center;
  padding: 12px 20px 18px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.02em;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  flex-shrink: 0;
}

.zoom-modal-enter-active,
.zoom-modal-leave-active {
  transition: opacity 0.22s ease;
}

.zoom-modal-enter-from,
.zoom-modal-leave-to {
  opacity: 0;
}

.related {
  margin-top: 70px;
}

.section-head {
  margin-bottom: 28px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .product-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .product-image {
    max-height: 420px;
  }
  .gallery-arrow {
    opacity: 0.9;
    width: 36px;
    height: 36px;
  }
  .thumb-item {
    flex: 0 0 64px;
    width: 64px;
    height: 64px;
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .product-image {
    max-height: 360px;
    border-radius: var(--radius-md);
  }
  .thumb-item {
    flex: 0 0 58px;
    width: 58px;
    height: 58px;
  }
  .related-grid {
    grid-template-columns: 1fr;
  }
  .buy-row {
    flex-direction: column;
  }
  .buy-row .btn {
    width: 100%;
  }
  .variant-box {
    padding: 14px 12px;
  }
  .variant-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .variant-card-name {
    font-size: 9px;
  }
}
</style>
