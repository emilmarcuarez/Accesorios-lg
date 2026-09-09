<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import { useSettingsStore } from '@/store/settings'
import { useCurrencyStore } from '@/store/currency'
import AppIcon from '@/components/AppIcon.vue'
import ProductVariantModal from '@/components/ProductVariantModal.vue'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
const favorites = useFavoritesStore()
const settings = useSettingsStore()
const currency = useCurrencyStore()

settings.fetch()

const remainingStock = computed(() => {
  const inCart = (cart.items || []).find((it) => it.id === props.product.id)?.qty || 0
  return Math.max(0, (Number(props.product.stock) || 0) - inCart)
})

// Modal de selección rápida para productos múltiples
const showModal = ref(false)

function openModal() {
  if (remainingStock.value <= 0) return
  showModal.value = true
}

function handleAddIndividual() {
  if (remainingStock.value <= 0) return
  const firstOpt = props.product.options && props.product.options.length
    ? props.product.options[0]
    : (props.product.images && props.product.images.length > 1
        ? { id: 'opt_1', name: 'Opción 1', image: props.product.images[0], stock: props.product.stock }
        : null)
  cart.add(props.product, 1, firstOpt)
}
</script>

<template>
  <article class="card">
    <router-link :to="`/producto/${product.id}`" class="card-media">
      <img
        :src="resolveImage(product.image)"
        :alt="product.name"
        :style="{ objectPosition: product.pos }"
        loading="lazy"
        class="card-img card-img-primary"
      />
      <img
        v-if="product.images && product.images.length > 1"
        :src="resolveImage(product.images[1])"
        :alt="product.name"
        :style="{ objectPosition: product.pos }"
        loading="lazy"
        class="card-img card-img-secondary"
      />
      <div v-if="product.images && product.images.length > 1" class="multi-photos-dots">
        <span class="dot active"></span>
        <span class="dot"></span>
        <span v-if="product.images.length > 2" class="dot"></span>
      </div>
      <div class="card-badges">
        <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}% OFF</span>
        <span v-if="product.isNew" class="tag tag-new">Nuevo</span>
        <span v-if="product.isMultiple && product.options && product.options.length" class="tag tag-variants">
          {{ product.options.length }} opciones
        </span>
        <span v-if="product.stock === 0" class="tag tag-soldout">Agotado</span>
        <span v-else-if="product.stock <= settings.lowStock" class="tag tag-low">Últimas {{ product.stock }}</span>
      </div>
      <button
        class="fav"
        :class="{ active: favorites.isFav(product.id) }"
        aria-label="Favorito"
        @click.prevent="favorites.toggle(product.id)"
      >
        <AppIcon name="heart" :size="18" :filled="favorites.isFav(product.id)" />
      </button>
    </router-link>

    <div class="card-body">
      <p class="card-cat">{{ product.categoryName || product.category }}</p>
      <router-link :to="`/producto/${product.id}`" class="card-name">
        {{ product.name }}
      </router-link>
      <div class="price-wrap">
        <div class="price-block">
          <div class="price">
            <span class="price-now">{{ formatPrice(product.price) }}</span>
            <span v-if="product.oldPrice && product.oldPrice > product.price" class="price-old">
              {{ formatPrice(product.oldPrice) }}
            </span>
          </div>
          <div v-if="currency.effectiveRate" class="price-bs">
            Bs. {{ currency.formatBsNum(product.price) }}
          </div>
        </div>
        <span v-if="product.discount" class="discount-badge">-{{ product.discount }}%</span>
      </div>

      <div class="card-stock">
        <span class="stock-simple">Stock: {{ remainingStock }}</span>
      </div>

      <!-- Botón para Producto Múltiple (abre Popup de selección rápida) -->
      <button
        v-if="product.isMultiple && product.options && product.options.length"
        class="btn add-btn btn-choose-opt"
        :disabled="remainingStock <= 0"
        @click="openModal"
      >
        <AppIcon name="bag" :size="16" />
        {{ remainingStock <= 0 ? 'Agotado' : 'Agregar al carrito' }}
      </button>

      <!-- Botón para Producto Individual (agrega con la primera opción por defecto) -->
      <button
        v-else
        class="btn add-btn"
        :disabled="remainingStock <= 0"
        @click="handleAddIndividual"
      >
        <AppIcon name="bag" :size="16" />
        {{ remainingStock <= 0 ? 'Agotado' : 'Agregar al carrito' }}
      </button>
    </div>

    <!-- Popup / Modal de Selección Rápida para Productos Múltiples -->
    <ProductVariantModal v-model="showModal" :product="product" />
  </article>
</template>

<style scoped>
.card {
  background: var(--white);
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-4px);
  border-color: #111111;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.card-media {
  position: relative;
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--rose-50);
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease, opacity 0.4s ease;
}

.card-img-secondary {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.card:hover .card-img-primary {
  transform: scale(1.07);
}

.card:hover .card-img-secondary {
  opacity: 1;
  transform: scale(1.07);
}

.multi-photos-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(18, 18, 20, 0.5);
  backdrop-filter: blur(4px);
  padding: 3px 6px;
  border-radius: 10px;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card:hover .multi-photos-dots {
  opacity: 1;
}

.multi-photos-dots .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}

.multi-photos-dots .dot.active {
  background: #ffffff;
  width: 10px;
  border-radius: 4px;
}

.card-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 50px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  z-index: 3;
  pointer-events: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 2px;
  line-height: 1.2;
}

.tag-discount {
  background: #111111;
  color: #ffffff;
}

.tag-new {
  background: #ffffff;
  border: 1px solid #111111;
  color: #111111;
}

.tag-variants {
  background: #fff0f3;
  color: #c92a54;
  border: 1px solid #fccfd8;
}

.tag-soldout {
  background: #f4f4f4;
  border: 1px solid #cccccc;
  color: #777777;
}

.tag-low {
  background: #fdf6ec;
  border: 1px solid #d4a373;
  color: #8c5b23;
}

.btn-choose-opt {
  background: #111111;
  color: #ffffff;
  border-color: #111111;
}

.btn-choose-opt:hover:not(:disabled) {
  background: var(--rose-600);
  border-color: var(--rose-600);
  color: #ffffff;
}

.price-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.discount-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 2px;
  background: #f5f5f5;
  color: #111111;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e0e0e0;
  white-space: nowrap;
}

.fav {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink-400);
  box-shadow: var(--shadow-sm);
  transition: color 0.2s ease, transform 0.2s ease;
}

.fav:hover {
  color: var(--rose-500);
  transform: scale(1.1);
}

.fav.active {
  color: var(--rose-600);
  background: var(--rose-100);
}

.card-body {
  padding: 16px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-cat {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #888888;
}

.card-name {
  font-family: var(--font-body);
  font-size: 14.5px;
  font-weight: 600;
  color: #111111;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.7em;
  transition: color 0.2s ease;
}

.card-name:hover {
  color: #666666;
}

.price-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 2px;
}

.price-now {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
}

.price-old {
  font-size: 13px;
  color: #999999;
  text-decoration: line-through;
}

.price-bs {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--rose-600);
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.card-stock {
  display: flex;
  align-items: center;
  margin: 2px 0 6px;
}

.stock-simple {
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 500;
  color: #888888;
  letter-spacing: 0.02em;
}

.add-btn {
  margin-top: auto;
  padding: 11px 16px;
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #ffffff;
  color: var(--rose-500);
  border: 1.5px solid var(--rose-500);
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(217, 109, 139, 0.12);
  transition: all 0.25s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-btn:hover:not(:disabled) {
  background: var(--rose-50);
  border-color: var(--rose-600);
  color: var(--rose-600);
  box-shadow: 0 4px 14px rgba(217, 109, 139, 0.22);
  transform: translateY(-2px);
}

.add-btn:disabled {
  background: #f4f4f4;
  border-color: #e0e0e0;
  color: #999999;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

@media (max-width: 760px) {
  .card-body {
    padding: 12px 10px 14px;
    gap: 6px;
  }
  .card-name {
    font-size: 13.5px;
  }
  .add-btn {
    padding: 9px 8px;
    font-size: 11px;
    letter-spacing: 0.04em;
  }
  .add-btn svg {
    display: none;
  }
}
</style>
