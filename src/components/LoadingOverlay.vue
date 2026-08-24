<script setup>
import { useUiStore } from '@/store/ui'
import { STORE } from '@/config'

const ui = useUiStore()
</script>

<template>
  <transition name="fade">
    <div v-if="ui.loading" class="loading-overlay">
      <div class="loading-inner">
        <span class="loading-logo">{{ STORE.name }}</span>
        <span class="spinner" aria-label="Cargando"></span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: linear-gradient(135deg, #fff8f6, #fbe9ee);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
}

.loading-logo {
  font-family: var(--font-script);
  font-size: 42px;
  color: var(--rose-600);
  font-weight: 700;
}

.spinner {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 4px solid var(--rose-100);
  border-top-color: var(--rose-500);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
