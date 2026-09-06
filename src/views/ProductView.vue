<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogStore } from '@/store/catalog'
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import ProductCard from '@/components/ProductCard.vue'
import { formatPrice } from '@/utils/format'
import { resolveImage } from '@/utils/image'

const route = useRoute()
const cart = useCartStore()
const catalog = useCatalogStore()
const qty = ref(1)

const product = computed(() => catalog.byId(route.params.id))
const related = computed(() =>
  catalog.products.filter((p) => p.category === product.value?.category && p.id !== product.value?.id).slice(0, 4),
)

const inStock = computed(() => (product.value?.stock ?? 0) > 0)
const maxQty = computed(() => Math.max(1, product.value?.stock ?? 1))

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

onMounted(() => catalog.fetch())
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
        <div class="product-image" data-aos="fade-right">
          <img :src="resolveImage(product.image)" :alt="product.name" />
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
            <span class="subtotal">Total: {{ formatPrice(product.price * qty) }}</span>
          </div>

          <p class="avail">
            <AppIcon name="bag" :size="14" />
            {{ inStock ? `Disponibles: ${product.stock} unds` : 'Producto agotado' }}
          </p>

          <div class="buy-row">
            <button class="btn btn-primary" :disabled="!inStock" @click="addToCart">
              <AppIcon name="bag" :size="17" />
              {{ inStock ? 'Agregar al carrito' : 'Agotado' }}
            </button>
            <button class="btn btn-whatsapp" :disabled="!inStock" @click="buyNow">
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
}

.product-image img {
  width: 100%;
  height: 540px;
  object-fit: cover;
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-500);
  margin: -10px 0 22px;
}

.avail svg {
  color: var(--rose-500);
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
  background: #25d366;
  color: var(--white);
  box-shadow: 0 10px 20px rgba(37, 211, 102, 0.35);
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
