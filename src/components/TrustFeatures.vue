<script setup>
import AppIcon from '@/components/AppIcon.vue'

const features = [
  { icon: 'truck', title: 'Envíos incluidos', text: 'A todo el país', link: '' },
  { icon: 'shield', title: 'Compra segura', text: 'Protegemos tu pago', link: '' },
  { icon: 'headset', title: 'Atención personalizada', text: 'Te acompañamos siempre', link: '' },
  { icon: 'gift', title: 'Empaque listo para regalo', text: 'Con detalles especiales', link: '' },
]
</script>

<template>
  <section class="features">
    <div class="container features-grid">
      <div
        v-for="(item, index) in features"
        :key="item.title"
        class="feature"
        data-aos="fade-up"
        :data-aos-delay="index * 80"
      >
        <div class="feature-icon"><AppIcon :name="item.icon" :size="26" /></div>
        <div>
          <p class="feature-title">{{ item.title }}</p>
          <p class="feature-text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 50px 0;
  background: #ffffff;
  border-top: 1px solid rgba(234, 169, 187, 0.22);
  border-bottom: 1px solid rgba(234, 169, 187, 0.22);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feature-icon {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 2px;
  background: var(--rose-50);
  border: 1px solid rgba(234, 169, 187, 0.4);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--ink-900);
}

.feature-text {
  font-size: 13px;
  color: var(--ink-400);
  margin-top: 2px;
}

@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 22px;
  }
}
</style>
