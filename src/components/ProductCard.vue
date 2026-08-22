<script setup>
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
</script>

<template>
  <article class="card">
    <router-link :to="`/producto/${product.id}`" class="card-media">
      <img
        :src="product.image"
        :alt="product.name"
        :style="{ objectPosition: product.pos }"
        loading="lazy"
      />
      <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}%</span>
      <span v-if="product.isNew" class="tag tag-new">Nuevo</span>
      <button class="fav" aria-label="Favorito" @click.prevent>
        <AppIcon name="heart" :size="18" />
      </button>
    </router-link>

    <div class="card-body">
      <p class="card-cat">{{ product.category }}</p>
      <router-link :to="`/producto/${product.id}`" class="card-name">
        {{ product.name }}
      </router-link>
      <div class="rating">
        <div class="stars">
          <AppIcon
            v-for="n in product.rating"
            :key="n"
            name="star"
            :size="14"
            class="star"
          />
        </div>
        <span class="reviews">({{ product.reviews }})</span>
      </div>
      <div class="price">
        <span class="price-now">{{ formatPrice(product.price) }}</span>
        <span v-if="product.oldPrice" class="price-old">{{ formatPrice(product.oldPrice) }}</span>
      </div>
      <button class="btn btn-primary add-btn" @click="cart.add(product)">
        <AppIcon name="bag" :size="16" />
        Agregar al carrito
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
  aspect-ratio: 1 / 1.05;
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

.tag {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  color: var(--white);
}

.tag-discount {
  background: var(--rose-gradient);
}

.tag-new {
  background: var(--ink-900);
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
}

.card-name:hover {
  color: var(--rose-600);
}

.rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: inline-flex;
  gap: 2px;
}

.star {
  color: var(--gold);
}

.reviews {
  font-size: 12px;
  color: var(--ink-400);
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
</style>
