<script setup>
import { CATEGORIES } from '@/config'
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <section class="categories">
    <div class="container">
      <div class="cat-grid">
        <router-link
          v-for="cat in CATEGORIES"
          :key="cat.slug"
          :to="`/tienda/${cat.slug}`"
          class="cat-item"
        >
          <div class="cat-circle">
            <img :src="cat.image" :alt="cat.name" :style="{ objectPosition: cat.pos }" />
            <span class="cat-badge"><AppIcon name="heart" :size="14" /></span>
          </div>
          <p class="cat-name">{{ cat.name }}</p>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.categories {
  padding: 56px 0 20px;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 22px;
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

.cat-circle {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid var(--rose-100);
  background: var(--rose-50);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.cat-item:hover .cat-circle {
  transform: translateY(-6px);
  border-color: var(--rose-300);
}

.cat-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cat-badge {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  color: var(--rose-500);
  box-shadow: var(--shadow-sm);
}

.cat-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-700);
  line-height: 1.3;
  max-width: 120px;
}

@media (max-width: 1000px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (max-width: 560px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
