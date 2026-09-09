<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  product: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue', 'close'])

const cart = useCartStore()
const currency = useCurrencyStore()

const selectedModalOpt = ref(null)
const modalQty = ref(1)

// Lightbox para ver las fotos en grande
const showLightbox = ref(false)
const lightboxImage = ref('')
const lightboxTitle = ref('')
const lightboxIndex = ref(0)

// Drag to dismiss / swipe down gesture on bottom sheet
const sheetTranslateY = ref(0)
let touchStartY = 0
let isDraggingSheet = false

const modalImagesList = computed(() => {
  if (!props.product) return []
  if (props.product.options && props.product.options.length) {
    return props.product.options.map((opt) => ({
      image: opt.image,
      name: opt.name,
      id: opt.id,
    }))
  }
  if (props.product.images && props.product.images.length) {
    return props.product.images.map((img, i) => ({
      image: img,
      name: `Foto ${i + 1}`,
      id: `img_${i}`,
    }))
  }
  return [{ image: props.product.image, name: props.product.name, id: 'main' }]
})

function getOptionRemaining(opt) {
  if (!opt || !props.product) return 0
  const optKey = `${props.product.id}__opt_${opt.id || opt.name}`
  const inCart = (cart.items || []).find((it) => (it.itemKey || it.id) === optKey)?.qty || 0
  return Math.max(0, (Number(opt.stock) || 0) - inCart)
}

const modalOptStock = computed(() => {
  return getOptionRemaining(selectedModalOpt.value)
})

function initModal() {
  if (!props.product) return
  const firstWithStock = props.product.options?.find((o) => getOptionRemaining(o) > 0)
  selectedModalOpt.value = firstWithStock || props.product.options?.[0] || null
  modalQty.value = 1
  sheetTranslateY.value = 0
}

function selectModalOption(opt) {
  if (getOptionRemaining(opt) <= 0) return
  selectedModalOpt.value = opt
  modalQty.value = 1
}

function close() {
  sheetTranslateY.value = 0
  isDraggingSheet = false
  emit('update:modelValue', false)
  emit('close')
}

function addFromModal() {
  if (!selectedModalOpt.value || modalOptStock.value <= 0) return
  cart.add(props.product, modalQty.value, selectedModalOpt.value)
  close()
}

// Lightbox logic
function openLightbox(imgUrl, title = '', index = 0) {
  lightboxImage.value = imgUrl || selectedModalOpt.value?.image || props.product?.image
  lightboxTitle.value = title || selectedModalOpt.value?.name || props.product?.name
  lightboxIndex.value = typeof index === 'number' && index >= 0 ? index : 0
  showLightbox.value = true
}

function openActiveLightbox() {
  const currentImg = selectedModalOpt.value?.image || props.product?.image
  const currentTitle = selectedModalOpt.value?.name || props.product?.name
  const index = modalImagesList.value.findIndex(
    (item) => item.id === selectedModalOpt.value?.id || item.image === currentImg
  )
  openLightbox(currentImg, currentTitle, index >= 0 ? index : 0)
}

function closeLightbox() {
  showLightbox.value = false
}

function nextLightbox() {
  if (!modalImagesList.value.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % modalImagesList.value.length
  const current = modalImagesList.value[lightboxIndex.value]
  lightboxImage.value = current.image
  lightboxTitle.value = current.name
}

function prevLightbox() {
  if (!modalImagesList.value.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + modalImagesList.value.length) % modalImagesList.value.length
  const current = modalImagesList.value[lightboxIndex.value]
  lightboxImage.value = current.image
  lightboxTitle.value = current.name
}

function goToLightboxIndex(idx) {
  if (idx < 0 || idx >= modalImagesList.value.length) return
  lightboxIndex.value = idx
  const current = modalImagesList.value[idx]
  lightboxImage.value = current.image
  lightboxTitle.value = current.name
}

// Touch Gestures: pull down to close sheet on mobile
function onSheetTouchStart(e) {
  touchStartY = e.touches[0].clientY
  isDraggingSheet = false
}

function onSheetTouchMove(e) {
  const currentY = e.touches[0].clientY
  const deltaY = currentY - touchStartY
  const modalBody = e.currentTarget.querySelector('.quick-modal-body')
  const isAtTop = !modalBody || modalBody.scrollTop <= 0

  if (deltaY > 0 && isAtTop) {
    isDraggingSheet = true
    sheetTranslateY.value = deltaY
  }
}

function onSheetTouchEnd() {
  if (isDraggingSheet && sheetTranslateY.value > 65) {
    close()
  } else {
    sheetTranslateY.value = 0
  }
  isDraggingSheet = false
}

// Keyboard navigation
function handleKeydown(e) {
  if (showLightbox.value) {
    if (e.key === 'Escape') closeLightbox()
    else if (e.key === 'ArrowRight') nextLightbox()
    else if (e.key === 'ArrowLeft') prevLightbox()
  } else if (props.modelValue && e.key === 'Escape') {
    close()
  }
}

// Lock body scroll and set up listeners
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      initModal()
      window.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      sheetTranslateY.value = 0
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <!-- Popup / Modal de Selección Rápida -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="modelValue && product"
          class="quick-opt-backdrop"
          role="dialog"
          aria-modal="true"
          @click.self="close"
          @wheel.self="close"
          @touchmove.self.prevent="close"
        >
          <div
            class="quick-opt-modal"
            :style="sheetTranslateY > 0 ? { transform: `translateY(${sheetTranslateY}px)`, transition: 'none' } : {}"
            @touchstart="onSheetTouchStart"
            @touchmove="onSheetTouchMove"
            @touchend="onSheetTouchEnd"
          >
            <!-- Pestaña decorativa para mobile (bottom sheet handle) -->
            <div class="mobile-sheet-handle" @click="close"></div>

            <div class="quick-modal-head">
              <div class="quick-head-info">
                <span class="quick-eyebrow">Selección de variante</span>
                <h4 class="quick-title">{{ product.name }}</h4>
              </div>
              <button type="button" class="quick-close-btn" aria-label="Cerrar modal" @click="close">
                <AppIcon name="close" :size="16" />
              </button>
            </div>

            <div class="quick-modal-body">
              <!-- Vista previa de la variante seleccionada -->
              <div class="quick-active-preview">
                <div
                  class="quick-preview-img-box"
                  role="button"
                  title="Toca para ver la foto en grande"
                  aria-label="Ver foto ampliada"
                  tabindex="0"
                  @click="openActiveLightbox"
                  @keydown.enter="openActiveLightbox"
                >
                  <img
                    :src="resolveImage(selectedModalOpt?.image || product.image)"
                    :alt="selectedModalOpt?.name || product.name"
                    class="quick-preview-img"
                  />
                  <div class="quick-img-zoom-hint" title="Ver en grande">
                    <AppIcon name="search" :size="11" />
                  </div>
                </div>
                <div class="quick-preview-details">
                  <div class="quick-opt-title-line">
                    <span class="quick-opt-active-name">{{ selectedModalOpt?.name || 'Selecciona una opción' }}</span>
                    <span
                      v-if="modalOptStock <= 0"
                      class="quick-stock-badge out"
                    >
                      Agotado
                    </span>
                    <span
                      v-else
                      class="quick-stock-badge in"
                    >
                      ● {{ modalOptStock }} disp.
                    </span>
                  </div>
                  <div class="quick-price-line">
                    <strong class="quick-price">{{ formatPrice(product.price) }}</strong>
                    <span v-if="currency.effectiveRate" class="quick-price-bs">
                      (Bs. {{ currency.formatBsNum(product.price) }})
                    </span>
                    <button
                      type="button"
                      class="btn-zoom-inline"
                      title="Ver foto en tamaño completo"
                      @click="openActiveLightbox"
                    >
                      <AppIcon name="search" :size="11" />
                      <span>Ver grande</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Lista de opciones disponibles -->
              <div v-if="product.options && product.options.length" class="quick-variants-section">
                <div class="quick-section-header">
                  <label class="quick-section-title">Opciones disponibles</label>
                  <span class="quick-options-count">{{ product.options.length }} opciones</span>
                </div>
                <div class="quick-variants-grid">
                  <button
                    v-for="(opt, idx) in product.options"
                    :key="opt.id"
                    type="button"
                    class="quick-variant-btn"
                    :class="{
                      active: selectedModalOpt?.id === opt.id,
                      exhausted: getOptionRemaining(opt) <= 0,
                    }"
                    @click="selectModalOption(opt)"
                  >
                    <div class="quick-thumb-wrap">
                      <img :src="resolveImage(opt.image)" :alt="opt.name" />
                      <span v-if="selectedModalOpt?.id === opt.id" class="quick-check-dot">
                        <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <span
                        class="quick-thumb-zoom-btn"
                        title="Ver foto grande"
                        aria-label="Ver foto grande"
                        @click.stop="openLightbox(opt.image, opt.name, idx)"
                      >
                        <AppIcon name="search" :size="9" />
                      </span>
                    </div>
                    <span class="quick-opt-name" :title="opt.name">{{ opt.name }}</span>
                    <span v-if="getOptionRemaining(opt) <= 0" class="quick-opt-status out">Agotado</span>
                    <span v-else class="quick-opt-status in">{{ getOptionRemaining(opt) }} disp.</span>
                  </button>
                </div>
              </div>

              <!-- Selector de cantidad -->
              <div class="quick-qty-section">
                <div class="quick-qty-label-box">
                  <label class="quick-section-title">Cantidad</label>
                  <span class="quick-qty-limit-note">Máx: {{ modalOptStock }} unid.</span>
                </div>
                <div class="quick-qty-right">
                  <div class="quick-qty-stepper">
                    <button
                      type="button"
                      class="qty-stepper-btn"
                      :disabled="modalQty <= 1"
                      aria-label="Menos"
                      @click="modalQty = Math.max(1, modalQty - 1)"
                    >
                      <AppIcon name="minus" :size="13" />
                    </button>
                    <span class="qty-stepper-num">{{ modalQty }}</span>
                    <button
                      type="button"
                      class="qty-stepper-btn"
                      :disabled="modalQty >= modalOptStock"
                      aria-label="Más"
                      @click="modalQty++"
                    >
                      <AppIcon name="plus" :size="13" />
                    </button>
                  </div>
                  <div class="quick-subtotal-calc">
                    <span>Total:</span>
                    <strong>{{ formatPrice(product.price * modalQty) }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="quick-modal-footer">
              <button
                type="button"
                class="btn-quick-add"
                :disabled="modalOptStock <= 0"
                @click="addFromModal"
              >
                <AppIcon name="bag" :size="16" />
                <span>{{ modalOptStock <= 0 ? 'Opción agotada' : 'Agregar al carrito' }}</span>
              </button>
              <router-link
                :to="`/producto/${product.id}`"
                class="quick-view-more"
                @click="close"
              >
                <span>Ver detalles y descripción completa</span>
                <AppIcon name="arrowRight" :size="13" />
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Lightbox Modal para fotos en grande -->
    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div
          v-if="showLightbox"
          class="catalog-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          @click.self="closeLightbox"
        >
          <div class="catalog-lightbox-topbar">
            <div class="lightbox-info">
              <span class="lightbox-product-title">{{ product?.name }}</span>
              <span v-if="lightboxTitle" class="lightbox-opt-name">• {{ lightboxTitle }}</span>
              <span v-if="modalImagesList.length > 1" class="lightbox-counter">
                ({{ lightboxIndex + 1 }} / {{ modalImagesList.length }})
              </span>
            </div>
            <button
              type="button"
              class="lightbox-close-btn"
              title="Cerrar (Esc)"
              aria-label="Cerrar"
              @click="closeLightbox"
            >
              <AppIcon name="close" :size="20" />
            </button>
          </div>

          <div class="catalog-lightbox-content" @click.self="closeLightbox">
            <button
              v-if="modalImagesList.length > 1"
              type="button"
              class="lightbox-nav-btn prev"
              aria-label="Foto anterior"
              title="Anterior"
              @click.stop="prevLightbox"
            >
              <AppIcon name="chevronLeft" :size="24" />
            </button>

            <div class="lightbox-img-wrapper" @click.self="closeLightbox">
              <img
                :src="resolveImage(lightboxImage)"
                :alt="lightboxTitle || product?.name"
                class="lightbox-main-img"
              />
            </div>

            <button
              v-if="modalImagesList.length > 1"
              type="button"
              class="lightbox-nav-btn next"
              aria-label="Foto siguiente"
              title="Siguiente"
              @click.stop="nextLightbox"
            >
              <AppIcon name="chevronRight" :size="24" />
            </button>
          </div>

          <!-- Miniaturas inferiores para navegar entre fotos en el lightbox -->
          <div v-if="modalImagesList.length > 1" class="lightbox-thumbs-bar">
            <button
              v-for="(item, idx) in modalImagesList"
              :key="item.id || idx"
              type="button"
              class="lightbox-thumb-item"
              :class="{ active: lightboxIndex === idx }"
              :title="item.name"
              @click="goToLightboxIndex(idx)"
            >
              <img :src="resolveImage(item.image)" :alt="item.name" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Modal de selección rápida de variantes - Sofisticado Boutique */
.quick-opt-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 19, 0.45);
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overscroll-behavior: contain;
  touch-action: none;
}

.quick-opt-modal {
  background: #ffffff;
  width: 440px;
  max-width: 100%;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px -10px rgba(45, 30, 36, 0.28);
  border: 1px solid #eee8e5;
  overflow: hidden;
  animation: modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: auto;
  transition: transform 0.2s ease;
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.mobile-sheet-handle {
  display: none;
}

/* Header refinado, claro y sofisticado */
.quick-modal-head {
  padding: 16px 20px;
  background: #fbf9f8;
  border-bottom: 1px solid #f0eae7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quick-eyebrow {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #a8826b;
  font-weight: 700;
  display: block;
  margin-bottom: 2px;
}

.quick-title {
  font-family: var(--font-body);
  font-size: 15.5px;
  font-weight: 700;
  color: #242021;
  margin: 0;
  line-height: 1.25;
}

.quick-close-btn {
  background: #f5efe9;
  border: 1px solid #e7e0dc;
  color: #6e645e;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.quick-close-btn:hover {
  background: #f3ede9;
  color: #1f1b1a;
  transform: rotate(90deg);
}

.quick-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Vista previa de variante */
.quick-active-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fdfbfb;
  border: 1px solid #f2ebe8;
  padding: 12px 14px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.quick-preview-img-box {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #ece4e0;
  background: #faf7f5;
  flex-shrink: 0;
  cursor: zoom-in;
  transition: all 0.2s ease;
}

.quick-preview-img-box:hover {
  border-color: #a4425f;
  transform: scale(1.04);
  box-shadow: 0 4px 14px rgba(164, 66, 95, 0.16);
}

.quick-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.quick-img-zoom-hint {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 19px;
  height: 19px;
  background: rgba(36, 32, 33, 0.75);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: all 0.2s ease;
}

.quick-preview-img-box:hover .quick-img-zoom-hint {
  background: #a4425f;
  transform: scale(1.1);
}

.quick-preview-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.quick-opt-title-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-opt-active-name {
  font-size: 14px;
  font-weight: 700;
  color: #242021;
}

.quick-price-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-zoom-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fbf6f4;
  border: 1px solid #f0e6e2;
  color: #8c7668;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s ease;
}

.btn-zoom-inline:hover {
  background: #ffffff;
  border-color: #a4425f;
  color: #a4425f;
}

.quick-price {
  font-size: 16px;
  font-weight: 800;
  color: #a4425f;
}

.quick-price-bs {
  font-size: 12px;
  color: #8c827c;
  font-weight: 600;
}

.quick-stock-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.quick-stock-badge.in {
  background: #edf7ed;
  color: #2e7d32;
}
.quick-stock-badge.out {
  background: #fdf2f2;
  color: #dc2626;
}

.quick-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quick-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #786f68;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.quick-options-count {
  font-size: 11px;
  color: #a8826b;
  font-weight: 600;
}

.quick-variants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 9px;
}

.quick-variant-btn {
  background: #ffffff;
  border: 1.5px solid #ece5e1;
  border-radius: 12px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: center;
}

.quick-variant-btn:hover:not(.exhausted) {
  border-color: #a8826b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 130, 107, 0.12);
}

.quick-variant-btn.active {
  border-color: #a4425f;
  background: #fff8fa;
  box-shadow: 0 0 0 1.5px #a4425f, 0 4px 12px rgba(164, 66, 95, 0.15);
}

.quick-variant-btn.exhausted {
  opacity: 0.45;
  filter: grayscale(85%);
  cursor: not-allowed;
  border-color: #e5e5e5;
  background: #fafafa;
}

.quick-thumb-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0eae7;
}

.quick-thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quick-check-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #a4425f;
  color: #ffffff;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.quick-thumb-zoom-btn {
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: rgba(36, 32, 33, 0.78);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 2;
}

.quick-variant-btn:hover .quick-thumb-zoom-btn {
  opacity: 1;
}

.quick-thumb-zoom-btn:hover {
  background: #a4425f;
  transform: scale(1.15);
}

.quick-opt-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #242021;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-opt-status {
  font-size: 10.5px;
  font-weight: 700;
}
.quick-opt-status.in {
  color: #a8826b;
}
.quick-opt-status.out {
  color: #dc2626;
}

.quick-qty-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f0eae7;
  gap: 12px;
}

.quick-qty-label-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-qty-limit-note {
  font-size: 10.5px;
  color: #8c827c;
}

.quick-qty-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.quick-qty-stepper {
  display: flex;
  align-items: center;
  border: 1.5px solid #e0d8d3;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.qty-stepper-btn {
  background: #fbf9f8;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4a423d;
  transition: all 0.15s ease;
}
.qty-stepper-btn:hover:not(:disabled) {
  background: #ede6e1;
  color: #1a1716;
}
.qty-stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-stepper-num {
  width: 34px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #242021;
}

.quick-subtotal-calc {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 12px;
  color: #786f68;
}
.quick-subtotal-calc strong {
  font-size: 16px;
  color: #242021;
}

.quick-modal-footer {
  padding: 14px 20px 18px;
  background: #fbf9f8;
  border-top: 1px solid #f0eae7;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-quick-add {
  width: 100%;
  padding: 12px 18px;
  background: linear-gradient(135deg, #242021 0%, #3a3235 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(36, 32, 33, 0.18);
}
.btn-quick-add:hover:not(:disabled) {
  background: linear-gradient(135deg, #a4425f 0%, #87304a 100%);
  box-shadow: 0 6px 18px rgba(164, 66, 95, 0.28);
  transform: translateY(-1px);
}
.btn-quick-add:disabled {
  background: #dfd8d4;
  color: #9c928c;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.quick-view-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #8c7668;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
  padding: 2px 0;
}
.quick-view-more:hover {
  color: #a4425f;
}

/* Lightbox Transitions & Styling */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

.catalog-lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100001;
  background: rgba(14, 11, 12, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 20px 24px;
  box-sizing: border-box;
}

.catalog-lightbox-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 10px;
  color: #ffffff;
  z-index: 2;
}

.lightbox-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.lightbox-product-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
}

.lightbox-opt-name {
  font-size: 14px;
  font-weight: 700;
  color: #f6cfb5;
}

.lightbox-counter {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 9px;
  border-radius: 12px;
}

.lightbox-close-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.lightbox-close-btn:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: scale(1.08);
}

.catalog-lightbox-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 0;
  padding: 12px 0;
}

.lightbox-img-wrapper {
  max-width: 90vw;
  max-height: 72vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-main-img {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
  animation: zoomPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomPop {
  from {
    opacity: 0.5;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #ffffff;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 3;
}

.lightbox-nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.08);
}

.lightbox-nav-btn.prev {
  left: 12px;
}

.lightbox-nav-btn.next {
  right: 12px;
}

.lightbox-thumbs-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  overflow-x: auto;
  z-index: 2;
}

.lightbox-thumb-item {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  padding: 0;
  opacity: 0.55;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.lightbox-thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lightbox-thumb-item.active,
.lightbox-thumb-item:hover {
  opacity: 1;
  border-color: #a4425f;
  transform: translateY(-2px);
}

/* RESPONSIVE DESIGN */
@media (max-width: 520px) {
  .quick-opt-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .quick-opt-modal {
    width: 100%;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 22px 22px 0 0;
    border-bottom: none;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
    animation: sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes sheetSlideUp {
    from {
      opacity: 0.6;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-sheet-handle {
    display: block;
    width: 42px;
    height: 4.5px;
    background: #d8ceca;
    border-radius: 4px;
    margin: 10px auto 4px;
    cursor: pointer;
  }

  .quick-modal-head {
    padding: 10px 16px 14px;
  }

  .quick-title {
    font-size: 14px;
  }

  .quick-modal-body {
    padding: 14px 16px;
    gap: 14px;
  }

  .quick-variants-grid {
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 8px;
  }

  .quick-thumb-wrap {
    width: 38px;
    height: 38px;
  }

  .quick-qty-section {
    flex-direction: row;
    align-items: center;
  }

  .btn-quick-add {
    padding: 13px;
    font-size: 14px;
  }

  .catalog-lightbox-backdrop {
    padding: 10px 12px 16px;
  }
  .lightbox-main-img {
    max-height: 62vh;
  }
  .lightbox-nav-btn {
    width: 38px;
    height: 38px;
  }
  .lightbox-thumb-item {
    width: 38px;
    height: 38px;
  }
}
</style>
