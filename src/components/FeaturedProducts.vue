<script setup>
import { PRODUCTS } from '@/data/products'
import ProductCard from '@/components/ProductCard.vue'

const featured = PRODUCTS.filter((p) => p.featured)
</script>

<template>
  <section class="featured">
    <div class="container">
      <div class="section-head">
        <span class="eyebrow">Los favoritos</span>
        <h2 class="section-title">Productos Destacados</h2>
        <router-link to="/tienda" class="btn btn-ghost section-btn">
          Ver todos los productos
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </router-link>
      </div>

      <div class="product-grid">
        <ProductCard v-for="product in featured" :key="product.id" :product="product" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.featured {
  padding: 70px 0 30px;
}

.section-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  margin-bottom: 38px;
}

.section-head .eyebrow::before,
.section-head .eyebrow::after {
  background: var(--rose-300);
}

.section-btn {
  margin-top: 6px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
}

@media (max-width: 1100px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 760px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
