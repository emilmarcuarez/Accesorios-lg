<script setup>
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useFavoritesStore } from '@/store/favorites'

const favorites = useFavoritesStore()
const router = useRouter()

function goLogin() {
  favorites.closePopup()
  router.push({ path: '/login', query: { redirect: '/favoritos' } })
}
</script>

<template>
  <transition name="fade">
    <div v-if="favorites.popupOpen" class="prompt-overlay" @click="favorites.closePopup()">
      <div class="prompt-card" @click.stop>
        <button class="prompt-close" aria-label="Cerrar" @click="favorites.closePopup()">
          <AppIcon name="close" :size="18" />
        </button>
        <div class="prompt-icon">
          <AppIcon name="heart" :size="30" :filled="true" />
        </div>
        <h3 class="prompt-title">Inicia sesión</h3>
        <p class="prompt-text">Necesitas iniciar sesión para guardar tus favoritos.</p>
        <button class="btn btn-primary prompt-btn" @click="goLogin">
          Iniciar sesión
        </button>
        <button class="btn btn-ghost prompt-btn" @click="favorites.closePopup()">Ahora no</button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(40, 26, 30, 0.55);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.prompt-card {
  position: relative;
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 38px 34px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.prompt-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-400);
  border-radius: 50%;
}

.prompt-close:hover {
  color: var(--ink-700);
  background: var(--rose-50);
}

.prompt-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--rose-100);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.prompt-title {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-900);
  margin-bottom: 8px;
}

.prompt-text {
  color: var(--ink-500);
  font-size: 14px;
  margin-bottom: 22px;
}

.prompt-btn {
  width: 100%;
  margin-top: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
