<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/config'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()

const categorySlug = computed(() => route.params.category || '')
const isNew = computed(() => route.query.new === '1')
const search = computed(() => (route.query.q || '').toString().toLowerCase())

const currentCategory = computed(() =>
  CATEGORIES.find((cat) => cat.slug === categorySlug.value),
)

const filtered = computed(() => {
  let list = PRODUCTS
  if (categorySlug.value) {
    list = list.filter((p) => p.category === categorySlug.value)
  }
  if (isNew.value) {
    list = list.filter((p) => p.isNew)
  }
  if (search.value) {
    list = list.filter((p) => p.name.toLowerCase().includes(search.value))
  }
  return list
})

const title = computed(() => {
  if (isNew.value) return 'Novedades'
  return currentCategory.value ? currentCategory.value.name : 'Tienda'
})
</script>

<template>
  <main class="shop">
    <section class="shop-hero">
      <div class="container">
        <p class="crumbs">Inicio / {{ title }}</p>
        <h1 class="shop-title">{{ title }}</h1>
        <p class="shop-sub">
          {{
            isNew
              ? 'Lo último que llegó a nuestra colección.'
              : currentCategory
                ? 'Encuentra el accesorio perfecto para cada ocasión.'
                : 'Accesorios que cuentan tu historia y realzan tu esencia.'
          }}
        </p>
      </div>
    </section>

    <section v-if="filtered.length" class="container shop-grid-wrap">
      <div class="shop-grid">
        <ProductCard v-for="product in filtered" :key="product.id" :product="product" />
      </div>
    </section>

    <section v-else class="container empty">
      <p>No encontramos productos con esos filtros.</p>
      <router-link to="/tienda" class="btn btn-ghost">Ver toda la tienda</router-link>
    </section>
  </main>
</template>

<style scoped>
.shop-hero {
  background: var(--rose-gradient);
  color: var(--white);
  padding: 56px 0;
  text-align: center;
}

.crumbs {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.shop-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 600;
}

.shop-sub {
  margin-top: 8px;
  font-size: 15px;
  opacity: 0.95;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.shop-grid-wrap {
  padding-top: 50px;
  padding-bottom: 70px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 26px;
}

@media (max-width: 1000px) {
  .shop-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .shop-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.empty {
  text-align: center;
  padding: 90px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: var(--ink-500);
}
</style>
