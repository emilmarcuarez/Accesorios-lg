<script setup>
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <main class="nf">
    <div class="container nf-inner">
      <AppIcon name="bag" :size="70" class="nf-icon" />
      <h1 class="nf-title">404</h1>
      <p class="nf-text">Parece que esta página no existe. Pero seguro encuentras algo que te encante.</p>
      <router-link to="/" class="btn btn-primary">Volver al inicio</router-link>
    </div>
  </main>
</template>

<style scoped>
.nf {
  padding: 100px 0;
}

.nf-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.nf-icon {
  color: var(--rose-300);
}

.nf-title {
  font-family: var(--font-display);
  font-size: 110px;
  font-weight: 700;
  color: var(--rose-500);
  line-height: 1;
}

.nf-text {
  color: var(--ink-500);
  max-width: 400px;
}
</style>
