<script setup>
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import { useSettingsStore } from '@/store/settings'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
const favorites = useFavoritesStore()
const settings = useSettingsStore()

settings.fetch()
</script>

<template>
  <article class="card">
    <router-link :to="`/producto/${product.id}`" class="card-media">
      <img
        :src="resolveImage(product.image)"
        :alt="product.name"
        :style="{ objectPosition: product.pos }"
        loading="lazy"
      />
      <div class="card-badges">
        <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}% OFF</span>
        <span v-if="product.isNew" class="tag tag-new">Nuevo</span>
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
        <div class="price">
          <span class="price-now">{{ formatPrice(product.price) }}</span>
          <span v-if="product.oldPrice && product.oldPrice > product.price" class="price-old">
            {{ formatPrice(product.oldPrice) }}
          </span>
        </div>
        <span v-if="product.discount" class="discount-badge">-{{ product.discount }}%</span>
      </div>
      <button
        class="btn btn-primary add-btn"
        :disabled="product.stock === 0"
        @click="cart.add(product)"
      >
        <AppIcon name="bag" :size="16" />
        {{ product.stock === 0 ? 'Agotado' : 'Agregar al carrito' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-md);
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
  transition: transform 0.5s ease;
}

.card:hover .card-media img {
  transform: scale(1.07);
}

.card-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  z-index: 3;
  pointer-events: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  color: var(--white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.tag-discount {
  background: linear-gradient(135deg, #e84a6f 0%, #c92a54 100%);
}

.tag-new {
  background: var(--ink-900);
}

.tag-soldout {
  background: #b04b4b;
}

.tag-low {
  background: #d97706;
  color: var(--white);
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
  border-radius: 6px;
  background: #fff0f3;
  color: #c92a54;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #fed7e2;
  white-space: nowrap;
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--rose-400);
}

.card-name {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink-900);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5em;
}

.card-name:hover {
  color: var(--rose-600);
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
  color: var(--ink-900);
}

.price-old {
  font-size: 13px;
  color: var(--ink-400);
  text-decoration: line-through;
}

.add-btn {
  margin-top: auto;
  padding: 11px 16px;
  font-size: 13.5px;
}

@media (max-width: 760px) {
  .card-body {
    padding: 14px 13px 16px;
  }
  .add-btn {
    padding: 10px 10px;
    font-size: 11.5px;
    letter-spacing: 0;
  }
  .add-btn svg {
    display: none;
  }
}
</style>
