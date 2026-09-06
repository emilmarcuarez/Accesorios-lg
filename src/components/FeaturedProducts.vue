<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '@/store/catalog'
import ProductCard from '@/components/ProductCard.vue'

const catalog = useCatalogStore()

const featured = computed(() => catalog.featured)

onMounted(() => catalog.fetch())
</script>

<template>
  <section class="featured">
    <div class="container">
      <div class="section-head" data-aos="fade-down">
        <span class="eyebrow">Los favoritos</span>
        <h2 class="section-title">Productos Destacados</h2>
        <router-link to="/tienda" class="btn btn-ghost section-btn">
          Ver todos los productos
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </router-link>
      </div>

      <div v-if="featured.length" class="product-grid">
        <ProductCard
          v-for="(product, index) in featured"
          :key="product.id"
          :product="product"
          data-aos="fade-up"
          :data-aos-delay="Math.min(index * 70, 450)"
        />
      </div>
      <p v-else class="empty">Aún no hay productos destacados.</p>
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
  border-radius: 2px;
  border: 1px solid var(--rose-400);
  color: var(--rose-600);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 12px 24px;
  background: #ffffff;
  transition: all 0.25s ease;
}

.section-btn:hover {
  background: var(--rose-600);
  border-color: var(--rose-600);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(216, 90, 127, 0.2);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.empty {
  text-align: center;
  color: var(--ink-400);
  padding: 30px;
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
