<script setup>
import { CATEGORIES } from '@/config'
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <main>
    <section class="cat-hero">
      <div class="container">
        <p class="crumbs">Inicio / Categorías</p>
        <span class="eyebrow">Detallitos Accesorios</span>
        <h1 class="cat-title">Categorías</h1>
        <p class="cat-sub">Encuentra el accesorio perfecto para cada ocasión.</p>
      </div>
    </section>

    <section class="container cat-grid-wrap">
      <router-link
        v-for="cat in CATEGORIES"
        :key="cat.slug"
        :to="`/tienda/${cat.slug}`"
        class="cat-card"
      >
        <div class="cat-image">
          <img :src="cat.image" :alt="cat.name" :style="{ objectPosition: cat.pos }" />
        </div>
        <p class="cat-label">{{ cat.name }}</p>
        <span class="cat-arrow"><AppIcon name="chevronRight" :size="18" /></span>
      </router-link>
    </section>

    <section class="cat-banner">
      <div class="container">
        <div class="cat-banner-inner">
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
  background: var(--rose-gradient);
  color: var(--white);
  padding: 56px 0;
  text-align: center;
}

.crumbs {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.cat-hero .eyebrow {
  color: rgba(255, 255, 255, 0.9);
}

.cat-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 64px);
  font-weight: 600;
}

.cat-sub {
  margin-top: 8px;
  font-size: 15px;
  opacity: 0.95;
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
  background: var(--rose-50);
  padding: 40px 0 70px;
}

.cat-banner-inner {
  background: var(--white);
  border: 1px solid var(--line);
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
