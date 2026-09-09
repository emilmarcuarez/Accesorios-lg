<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore } from '@/store/catalog'
import { useCartStore } from '@/store/cart'
import { useCurrencyStore } from '@/store/currency'
import AppIcon from '@/components/AppIcon.vue'
import ProductVariantModal from '@/components/ProductVariantModal.vue'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const cart = useCartStore()
const catalog = useCatalogStore()
const currency = useCurrencyStore()
const track = ref(null)

const arrivals = computed(() => catalog.newArrivals)

const showModal = ref(false)
const selectedArrivalProduct = ref(null)

function handleArrivalAdd(product) {
  if (product.isMultiple && product.options && product.options.length) {
    selectedArrivalProduct.value = product
    showModal.value = true
  } else {
    const firstOpt = product.options && product.options.length ? product.options[0] : null
    cart.add(product, 1, firstOpt)
  }
}

function scrollBy(dir) {
  if (!track.value) return
  const card = track.value.querySelector('.arrival-card')
  const step = card ? card.offsetWidth + 20 : 300
  track.value.scrollBy({ left: dir * step, behavior: 'smooth' })
}

onMounted(() => catalog.fetch())
</script>

<template>
  <section class="arrivals">
    <div class="container">
      <div class="section-head" data-aos="fade-down">
        <span class="eyebrow">Recién llegados</span>
        <h2 class="section-title">Novedades de la Semana</h2>
        <div class="scroll-ctrls">
          <button class="circle-btn" aria-label="Anterior" @click="scrollBy(-1)">
            <AppIcon name="chevronLeft" :size="18" />
          </button>
          <button class="circle-btn" aria-label="Siguiente" @click="scrollBy(1)">
            <AppIcon name="chevronRight" :size="18" />
          </button>
        </div>
      </div>

      <div v-if="arrivals.length" ref="track" class="arrival-track">
        <article
          v-for="(product, index) in arrivals"
          :key="product.id"
          class="arrival-card"
          data-aos="fade-up"
          :data-aos-delay="Math.min(index * 70, 450)"
        >
          <router-link :to="`/producto/${product.id}`" class="arrival-media">
            <img :src="resolveImage(product.image)" :alt="product.name" loading="lazy" />
            <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}% OFF</span>
          </router-link>
          <router-link :to="`/producto/${product.id}`" class="arrival-name">
            {{ product.name }}
          </router-link>
          <div class="arrival-foot">
            <div class="arrival-prices">
              <div class="arrival-price-row">
                <span class="arrival-price">{{ formatPrice(product.price) }}</span>
                <span v-if="product.oldPrice && product.oldPrice > product.price" class="arrival-old-price">
                  {{ formatPrice(product.oldPrice) }}
                </span>
              </div>
              <span v-if="currency.effectiveRate" class="arrival-price-bs">
                Bs. {{ currency.formatBsNum(product.price) }}
              </span>
            </div>
            <button
              class="mini-add"
              :aria-label="product.isMultiple && product.options && product.options.length ? 'Elegir variante' : 'Agregar al carrito'"
              @click="handleArrivalAdd(product)"
            >
              <AppIcon name="plus" :size="16" />
            </button>
          </div>
        </article>
      </div>
      <p v-if="!arrivals.length" class="empty">Aún no hay novedades.</p>
    </div>

    <!-- Modal de variantes para productos múltiples desde Novedades -->
    <ProductVariantModal
      v-model="showModal"
      :product="selectedArrivalProduct"
    />
  </section>
</template>

<style scoped>
.arrivals {
  padding: 50px 0;
  background: var(--rose-50);
  border-radius: 40px 40px 0 0;
}

.section-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  margin-bottom: 30px;
}

.section-head .eyebrow::before,
.section-head .eyebrow::after {
  background: var(--rose-300);
}

.scroll-ctrls {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.circle-btn {
  width: 38px;
  height: 38px;
  border-radius: 2px;
  border: 1px solid var(--rose-300);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-600);
  background: var(--white);
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.circle-btn:hover {
  background: var(--rose-600);
  color: var(--white);
  border-color: var(--rose-600);
  transform: scale(1.05);
}

.arrival-track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 8px 4px 16px;
}

.arrival-track::-webkit-scrollbar {
  display: none;
}

.arrival-card {
  scroll-snap-align: start;
  flex: 0 0 calc((100% - 60px) / 4);
  max-width: 285px;
  min-width: 230px;
  background: var(--white);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.arrival-card:hover {
  transform: translateY(-4px);
  border-color: #111111;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

@media (max-width: 1024px) {
  .arrival-card {
    flex: 0 0 calc((100% - 40px) / 3);
    max-width: 320px;
  }
}

@media (max-width: 768px) {
  .arrival-card {
    flex: 0 0 calc((100% - 16px) / 2);
    max-width: none;
    min-width: 160px;
  }
  .arrival-track {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .arrival-card {
    flex: 0 0 230px;
    min-width: 220px;
  }
}

.arrival-media {
  position: relative;
  display: block;
  aspect-ratio: 1;
  background: var(--rose-50);
  overflow: hidden;
}

.arrival-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 2px;
  color: var(--white);
}

.tag-discount {
  background: #111111;
  color: var(--white);
  padding: 3px 7px;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 2px;
  font-weight: 700;
}

.arrival-name {
  display: block;
  padding: 12px 14px 6px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.arrival-name:hover {
  color: #666666;
}

.arrival-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px 14px;
}

.arrival-prices {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.arrival-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.arrival-price {
  font-size: 15px;
  font-weight: 600;
  color: #111111;
}

.arrival-old-price {
  font-size: 12px;
  color: #999999;
  text-decoration: line-through;
}

.arrival-price-bs {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--rose-600);
}

.mini-add {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  background: #ffffff;
  color: var(--rose-500);
  border: 1.5px solid var(--rose-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 109, 139, 0.12);
}

.mini-add:hover {
  background: var(--rose-50);
  border-color: var(--rose-600);
  color: var(--rose-600);
  box-shadow: 0 4px 14px rgba(217, 109, 139, 0.25);
  transform: scale(1.08);
}

.empty {
  text-align: center;
  color: var(--ink-400);
  padding: 20px;
}
</style>
