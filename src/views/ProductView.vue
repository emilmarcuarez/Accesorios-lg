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

// Zoom Modal State
const isZoomOpen = ref(false)
const zoomScale = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const startOffset = ref({ x: 0, y: 0 })

function openZoom() {
  if (!product.value?.image) return
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
  }
}

const product = computed(() => catalog.byId(route.params.id))
const related = computed(() =>
  catalog.products.filter((p) => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 4),
)

const inStock = computed(() => (product.value?.stock ?? 0) > 0)
const remainingStock = computed(() => {
  if (!product.value) return 0
  const inCart = (cart.items || []).find((it) => it.id === product.value.id)?.qty || 0
  return Math.max(0, (Number(product.value.stock) || 0) - inCart)
})
const maxQty = computed(() => Math.max(1, remainingStock.value || 1))

function increment() {
  if (qty.value < maxQty.value) qty.value += 1
}

function decrement() {
  if (qty.value > 1) qty.value -= 1
}

function addToCart() {
  if (!product.value || !inStock.value) return
  cart.add(product.value)
  for (let i = 1; i < qty.value; i++) cart.increase(product.value.id)
}

function buyNow() {
  addToCart()
  cart.checkout()
}

watch(
  () => route.params.id,
  () => {
    qty.value = 1
  },
)

onMounted(() => {
  catalog.fetch()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
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
        <div class="product-image" data-aos="fade-right" @click="openZoom" title="Haz clic para ampliar la imagen">
          <img :src="resolveImage(product.image)" :alt="product.name" />
          <div class="zoom-indicator">
            <AppIcon name="search" :size="15" />
            <span>Ver foto / Zoom</span>
          </div>
          <div class="product-image-badges">
            <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}% OFF</span>
          </div>
          <span class="stock-badge" :class="{ out: !inStock }">
            {{ inStock ? `En stock · ${product.stock} uds` : 'Agotado' }}
          </span>
        </div>

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

          <p class="desc">
            Accesorio elaborado con amor para acompañarte en cada ocasión. Calidad premium, diseño
            delicado y empaque listo para regalar.
          </p>

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

          <p class="avail">
            Stock: {{ remainingStock }}
          </p>

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
            <img
              :src="resolveImage(product.image)"
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
            <span>Doble clic para {{ zoomScale > 1.2 ? 'restablecer' : 'acercar' }} · Rueda del mouse para zoom · Arrastra para mover la imagen</span>
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

.product-image {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--rose-50);
  cursor: zoom-in;
}

.product-image img {
  width: 100%;
  height: 540px;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-image:hover img {
  transform: scale(1.025);
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  background: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 2;
}

.product-image:hover .zoom-indicator {
  background: rgba(18, 18, 20, 0.92);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.product-image-badges {
  position: absolute;
  top: 18px;
  left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  color: var(--white);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.tag-discount {
  background: linear-gradient(135deg, #e84a6f 0%, #c92a54 100%);
  letter-spacing: 0.02em;
}

.price-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
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

.category-promo-note {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fdf2f4;
  color: #c92a54;
  font-size: 12.5px;
  border-left: 3px solid #e84a6f;
}

.stock-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  background: var(--white);
  color: var(--green);
  box-shadow: var(--shadow-sm);
}

.stock-badge.out {
  color: #c0392b;
  background: #fbe9e9;
}

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
  gap: 14px;
  flex-wrap: wrap;
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

.subtotal-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.subtotal-bs {
  font-size: 14px;
  font-weight: 600;
  color: var(--rose-600);
}

.price-old {
  font-size: 18px;
  color: var(--ink-400);
  text-decoration: line-through;
}

.desc {
  color: var(--ink-500);
  font-size: 15px;
  margin-bottom: 26px;
  max-width: 480px;
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
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-700);
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.qty-btn:hover {
  background: var(--rose-100);
  color: var(--rose-700);
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: transparent;
}

.qty-num {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
}

.subtotal {
  font-weight: 600;
  color: var(--rose-600);
}

.avail {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: #888888;
  margin: -10px 0 22px;
}

.buy-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-whatsapp {
  background: #111111;
  color: #ffffff !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
  border: 1px solid #111111;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-whatsapp :deep(svg),
.btn-whatsapp svg {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.btn-whatsapp:hover:not(:disabled) {
  background: #282828;
  border-color: #282828;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.35);
}

.btn-whatsapp:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Zoom Modal / Lightbox */
.zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(10, 10, 12, 0.92);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  user-select: none;
  outline: none;
  animation: zoomFadeIn 0.2s ease forwards;
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.zoom-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  z-index: 10;
  flex-shrink: 0;
}

.zoom-title {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 7px 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 600;
}

.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.zoom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-btn.zoom-close {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.45);
  color: #fca5a5;
  padding: 7px 13px;
  margin-left: 6px;
}

.zoom-btn.zoom-close:hover {
  background: rgba(239, 68, 68, 0.4);
  color: #ffffff;
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
  max-height: 78vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
  pointer-events: auto;
  user-select: none;
  -webkit-user-drag: none;
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
    gap: 30px;
  }
  .product-image img {
    height: 380px;
  }
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
