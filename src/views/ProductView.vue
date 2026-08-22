<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/config'
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import { formatPrice } from '@/utils/format'

const route = useRoute()
const cart = useCartStore()
const qty = ref(1)

const product = computed(() => PRODUCTS.find((p) => p.id === Number(route.params.id)))
const category = computed(() => CATEGORIES.find((c) => c.slug === product.value?.category))
const related = computed(() =>
  PRODUCTS.filter((p) => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 4),
)

function addToCart() {
  if (!product.value) return
  cart.add(product.value)
  for (let i = 1; i < qty.value; i++) cart.increase(product.value.id)
}

function buyNow() {
  addToCart()
  cart.checkout()
}
</script>

<template>
  <main v-if="product" class="product-page">
    <div class="container">
      <nav class="crumbs">
        <router-link to="/">Inicio</router-link> /
        <router-link to="/tienda">Tienda</router-link> /
        <router-link :to="`/tienda/${product.category}`">{{ category?.name }}</router-link> /
        <span>{{ product.name }}</span>
      </nav>

      <div class="product-layout">
        <div class="product-image">
          <img :src="product.image" :alt="product.name" :style="{ objectPosition: product.pos }" />
          <span v-if="product.discount" class="tag tag-discount">-{{ product.discount }}%</span>
        </div>

        <div class="product-info">
          <span class="eyebrow">{{ category?.name }}</span>
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="rating">
            <div class="stars">
              <AppIcon v-for="n in product.rating" :key="n" name="star" :size="15" class="star" />
            </div>
            <span class="reviews">{{ product.reviews }} reseñas</span>
          </div>

          <div class="price">
            <span class="price-now">{{ formatPrice(product.price) }}</span>
            <span v-if="product.oldPrice" class="price-old">{{ formatPrice(product.oldPrice) }}</span>
          </div>

          <p class="desc">
            Accesorio elaborado con amor para acompañarte en cada ocasión. Calidad premium, diseño
            delicado y empaque listo para regalar.
          </p>

          <div class="qty-row">
            <div class="qty">
              <button class="qty-btn" aria-label="Menos" @click="qty > 1 && qty--">
                <AppIcon name="minus" :size="15" />
              </button>
              <span class="qty-num">{{ qty }}</span>
              <button class="qty-btn" aria-label="Más" @click="qty++">
                <AppIcon name="plus" :size="15" />
              </button>
            </div>
            <span class="subtotal">Total: {{ formatPrice(product.price * qty) }}</span>
          </div>

          <div class="buy-row">
            <button class="btn btn-primary" @click="addToCart">
              <AppIcon name="bag" :size="17" />
              Agregar al carrito
            </button>
            <button class="btn btn-whatsapp" @click="buyNow">
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

    <section v-if="related.length" class="container related">
      <div class="section-head">
        <span class="eyebrow">También te puede gustar</span>
        <h2 class="section-title">Productos relacionados</h2>
      </div>
      <div class="related-grid">
        <ProductCard v-for="item in related" :key="item.id" :product="item" />
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
}

.product-image img {
  width: 100%;
  height: 540px;
  object-fit: cover;
}

.tag {
  position: absolute;
  top: 18px;
  left: 18px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  color: var(--white);
}

.tag-discount {
  background: var(--rose-gradient);
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

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.stars {
  display: inline-flex;
  gap: 2px;
}

.star {
  color: var(--gold);
}

.reviews {
  font-size: 13px;
  color: var(--ink-400);
}

.price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
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
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  padding: 5px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-700);
  transition: background 0.2s ease;
}

.qty-btn:hover {
  background: var(--rose-100);
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

.buy-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-whatsapp {
  background: #25d366;
  color: var(--white);
  box-shadow: 0 10px 20px rgba(37, 211, 102, 0.35);
}

.btn-whatsapp:hover {
  transform: translateY(-2px);
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
