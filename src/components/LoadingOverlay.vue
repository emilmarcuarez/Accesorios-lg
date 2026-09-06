<script setup>
import { useUiStore } from '@/store/ui'
import { STORE } from '@/config'

const ui = useUiStore()
</script>

<template>
  <transition name="fade">
    <div v-if="ui.loading" class="loading-overlay">
      <div class="loading-box">
        <!-- Aro giratorio de lujo que enmarca el logo -->
        <div class="spinner-frame">
          <div class="spinner-ring"></div>
          <div class="spinner-core">
            <img src="/img/logo.png" :alt="STORE.name" class="loading-logo-img" />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: radial-gradient(circle at center, #ffffff 0%, #fff2f5 55%, #fde6ec 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner-frame {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(217, 109, 139, 0.2), 0 2px 12px rgba(0, 0, 0, 0.04);
}

.spinner-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #111111;
  border-right-color: #e2829c;
  border-bottom-color: transparent;
  border-left-color: #e2829c;
  animation: spin 1.1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

.spinner-core {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}

.loading-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: pulseLogo 2s ease-in-out infinite alternate;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulseLogo {
  0% {
    transform: scale(0.95);
    opacity: 0.92;
  }
  100% {
    transform: scale(1.04);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
