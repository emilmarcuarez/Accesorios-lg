<script setup>
import { ref } from 'vue'
import { PRODUCTS } from '@/data/products'
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
const track = ref(null)

const arrivals = PRODUCTS.filter((p) => p.isNew)
  .concat(PRODUCTS.filter((p) => !p.isNew).slice(0, 3))

function scrollBy(dir) {
  if (!track.value) return
  const card = track.value.querySelector('.arrival-card')
  const step = card ? card.offsetWidth + 20 : 300
  track.value.scrollBy({ left: dir * step, behavior: 'smooth' })
}
</script>

<template>
  <section class="arrivals">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Recién llegados</span>
        <h2 class="section-title">Los mas recientes</h2>
        <div class="scroll-ctrls">
          <button class="circle-btn" aria-label="Anterior" @click="scrollBy(-1)">
            <AppIcon name="chevronLeft" :size="18" />
          </button>
          <button class="circle-btn" aria-label="Siguiente" @click="scrollBy(1)">
            <AppIcon name="chevronRight" :size="18" />
          </button>
        </div>
      </div>

      <div ref="track" class="arrival-track">
        <article v-for="product in arrivals" :key="product.id" class="arrival-card">
          <router-link :to="`/producto/${product.id}`" class="arrival-media">
            <img
              :src="product.image"
              :alt="product.name"
              :style="{ objectPosition: product.pos }"
              loading="lazy"
            />
            <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}%</span>
          </router-link>
          <router-link :to="`/producto/${product.id}`" class="arrival-name">
            {{ product.name }}
          </router-link>
          <div class="arrival-foot">
            <span class="arrival-price">{{ formatPrice(product.price) }}</span>
            <button class="mini-add" aria-label="Agregar al carrito" @click="cart.add(product)">
              <AppIcon name="plus" :size="16" />
            </button>
          </div>
        </article>
      </div>
    </div>
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
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--rose-300);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-600);
  background: var(--white);
  transition: all 0.2s ease;
}

.circle-btn:hover {
  background: var(--rose-600);
  color: var(--white);
  border-color: var(--rose-600);
}

.arrival-track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 4px;
}

.arrival-track::-webkit-scrollbar {
  display: none;
}

.arrival-card {
  scroll-snap-align: start;
  flex: 0 0 220px;
  background: var(--white);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--line);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.arrival-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
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
  border-radius: 8px;
  color: var(--white);
}

.tag-discount {
  background: var(--rose-gradient);
}

.arrival-name {
  display: block;
  padding: 12px 14px 6px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-900);
  line-height: 1.2;
}

.arrival-name:hover {
  color: var(--rose-600);
}

.arrival-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px 14px;
}

.arrival-price {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-900);
}

.mini-add {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--rose-gradient);
  color: var(--white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.mini-add:hover {
  transform: scale(1.12);
}
</style>
