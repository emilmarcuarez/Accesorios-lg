<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '@/store/catalog'
import AppIcon from '@/components/AppIcon.vue'
import { resolveImage } from '@/utils/image'

const catalog = useCatalogStore()
const categories = computed(() => catalog.categoryCards)

onMounted(() => catalog.fetch())
</script>

<template>
  <main>
    <section class="cat-hero" data-aos="fade-down">
      <div class="container">
        <p class="crumbs">Inicio / Categorías</p>
        <span class="eyebrow">Detallitos Accesorios</span>
        <h1 class="cat-title">Categorías</h1>
        <p class="cat-sub">Encuentra el accesorio perfecto para cada ocasión.</p>
      </div>
    </section>

    <section class="container cat-grid-wrap">
      <router-link
        v-for="(cat, index) in categories"
        :key="cat.slug"
        :to="`/tienda/${cat.slug}`"
        class="cat-card"
        data-aos="fade-up"
        :data-aos-delay="Math.min(index * 60, 450)"
      >
        <div class="cat-image">
          <img
            v-if="cat.image"
            :src="resolveImage(cat.image)"
            :alt="cat.name"
            :style="{ objectPosition: cat.pos }"
          />
          <div v-else class="cat-image-placeholder">
            <AppIcon name="bag" :size="30" />
          </div>
        </div>
        <p class="cat-label">{{ cat.name }}</p>
        <span class="cat-arrow"><AppIcon name="chevronRight" :size="18" /></span>
      </router-link>
    </section>

    <section class="cat-banner">
      <div class="container">
        <div class="cat-banner-inner" data-aos="zoom-in-up">
          <div>
            <span class="eyebrow">El regalo perfecto</span>
            <h2 class="cb-title">Detalles que te hacen brillar</h2>
            <p class="cb-text">Cada accesorio está hecho para iluminar tu esencia única.</p>
          </div>
          <router-link to="/tienda" class="btn btn-primary">
            Comprar ahora
            <AppIcon name="heart" :size="16" />
          </router-link>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.cat-hero {
  background: linear-gradient(180deg, #fff7f9 0%, #ffffff 100%);
  border-bottom: 1.5px solid var(--rose-200, #f3c6d2);
  color: var(--ink-900);
  padding: 56px 0;
  text-align: center;
}

.crumbs {
  font-size: 13px;
  color: var(--rose-600);
  margin-bottom: 12px;
}

.cat-hero .eyebrow {
  color: var(--rose-600);
}

.cat-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 64px);
  font-weight: 600;
  color: var(--ink-900);
}

.cat-sub {
  margin-top: 8px;
  font-size: 15px;
  color: var(--ink-500);
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}

.cat-grid-wrap {
  padding: 60px 20px 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.cat-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 1;
  display: flex;
  align-items: flex-end;
  padding: 22px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.cat-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-md);
}

.cat-image {
  position: absolute;
  inset: 0;
}

.cat-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.cat-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-300);
  background: linear-gradient(135deg, #fbeef1, #f7dde4);
}

.cat-card:hover .cat-image img {
  transform: scale(1.08);
}

.cat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(61, 42, 49, 0.6));
}

.cat-label {
  position: relative;
  z-index: 2;
  color: var(--white);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
}

.cat-arrow {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cat-banner {
  background: transparent;
  padding: 40px 0 70px;
}

.cat-banner-inner {
  background: var(--white);
  border: 1.5px solid var(--rose-300, #eaa9bb);
  box-shadow: 0 8px 24px rgba(217, 109, 139, 0.08);
  border-radius: var(--radius-lg);
  padding: 36px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.cb-title {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 600;
  color: var(--ink-900);
  margin: 8px 0 6px;
}

.cb-text {
  color: var(--ink-500);
  font-size: 15px;
  max-width: 420px;
}

@media (max-width: 900px) {
  .cat-grid-wrap {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .cat-grid-wrap {
    grid-template-columns: 1fr;
  }
}
</style>
