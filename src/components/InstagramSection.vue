<script setup>
import { STORE } from '@/config'
import AppIcon from '@/components/AppIcon.vue'

const gallery = [
  { src: '/img/mujer.png', pos: 'left' },
  { src: '/img/banner.png', pos: 'center' },
  { src: '/img/cadena.png', pos: 'center' },
  { src: '/img/pulsera.png', pos: 'center' },
  { src: '/img/regalo.png', pos: 'center' },
]
</script>

<template>
  <section class="ig">
    <div class="container ig-footer-top">
      <div class="ig-head">
        <span class="eyebrow">Comunidad</span>
        <h2 class="section-title">Inspírate con nosotros</h2>
        <a :href="`https://instagram.com/${STORE.instagram.replace('@', '')}`" class="ig-handle" target="_blank">
          <AppIcon name="instagram" :size="18" /> {{ STORE.instagram }}
        </a>
      </div>
      <a :href="`https://instagram.com/${STORE.instagram.replace('@', '')}`" class="btn btn-ghost" target="_blank">
        Sigueme
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </div>

    <div class="container">
      <div class="ig-grid">
        <a
          v-for="(img, i) in gallery"
          :key="i"
          :href="`https://instagram.com/${STORE.instagram.replace('@', '')}`"
          class="ig-item"
          target="_blank"
        >
          <img :src="img.src" :alt="STORE.instagram" :style="{ objectPosition: img.pos }" />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ig {
  padding: 60px 0;
}

.ig-footer-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.ig-handle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-weight: 600;
  color: var(--rose-600);
}

.ig-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.ig-item {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: block;
}

.ig-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.ig-item:hover img {
  transform: scale(1.08);
}

@media (max-width: 800px) {
  .ig-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 500px) {
  .ig-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
