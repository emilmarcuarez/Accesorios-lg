<script setup>
import { ref, onMounted, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'
import { PRODUCTS } from '@/data/products'
import ProductCard from '@/components/ProductCard.vue'

const auth = useAuthStore()
const favorites = useFavoritesStore()
const ready = ref(false)

const favoriteProducts = () => PRODUCTS.filter((p) => favorites.ids.includes(p.id))

onMounted(async () => {
  if (!auth.ready) await auth.init()
  if (auth.isAuthenticated) await favorites.load()
  ready.value = true
})

watch(() => auth.user, async (user) => {
  if (user) await favorites.load()
  else favorites.ids = []
})
</script>

<template>
  <main class="fav-page">
    <section class="fav-hero">
      <div class="container">
        <span class="eyebrow">Tu selección</span>
        <h1 class="fav-title">Favoritos</h1>
        <p class="fav-sub">Guarda tus accesorios favoritos para encontrarlos fácilmente.</p>
      </div>
    </section>

    <section v-if="!auth.isAuthenticated" class="container fav-empty-wrap">
      <div class="fav-empty">
        <div class="fav-empty-icon"><AppIcon name="heart" :size="34" /></div>
        <h2 class="fav-empty-title">Inicia sesión</h2>
        <p class="fav-empty-text">Inicia sesión para ver y guardar tus productos favoritos.</p>
        <router-link to="/login" class="btn btn-primary">Iniciar sesión</router-link>
      </div>
    </section>

    <section v-else-if="favoriteProducts().length" class="container fav-grid-wrap">
      <div class="fav-grid">
        <ProductCard v-for="product in favoriteProducts()" :key="product.id" :product="product" />
      </div>
    </section>

    <section v-else class="container fav-empty-wrap">
      <div class="fav-empty">
        <div class="fav-empty-icon"><AppIcon name="heart" :size="34" /></div>
        <h2 class="fav-empty-title">Aún no tienes favoritos</h2>
        <p class="fav-empty-text">Toca el corazón en un producto para guardarlo aquí.</p>
        <router-link to="/tienda" class="btn btn-primary">Ver productos</router-link>
      </div>
    </section>
  </main>
</template>

<style scoped>
.fav-page {
  background: var(--cream);
  min-height: 70vh;
}

.fav-hero {
  background: var(--rose-gradient);
  color: var(--white);
  text-align: center;
  padding: 52px 0;
}

.fav-hero .eyebrow {
  color: rgba(255, 255, 255, 0.9);
}

.fav-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 54px);
  font-weight: 600;
}

.fav-sub {
  margin-top: 8px;
  opacity: 0.95;
}

.fav-grid-wrap {
  padding-top: 50px;
  padding-bottom: 70px;
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1000px) {
  .fav-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .fav-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .fav-grid {
    grid-template-columns: 1fr;
  }
}

.fav-empty-wrap {
  padding-top: 60px;
  padding-bottom: 70px;
}

.fav-empty {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 460px;
  margin: 0 auto;
}

.fav-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--rose-100);
  color: var(--rose-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.fav-empty-title {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--ink-900);
}

.fav-empty-text {
  color: var(--ink-500);
  font-size: 15px;
  margin-bottom: 8px;
}
</style>
