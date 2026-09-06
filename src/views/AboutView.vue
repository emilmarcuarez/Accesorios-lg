<script setup>
import { computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore, DEFAULT_ABOUT } from '@/store/settings'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()

onMounted(() => {
  settings.fetch()
})

const aboutImage = computed(() => {
  return resolveImage(settings.about?.image || DEFAULT_ABOUT.image)
})

const values = [
  { icon: 'heart', title: 'Hecho con amor', text: 'Cada detalle es pensado para ti.' },
  { icon: 'gift', title: 'Empaque especial', text: 'Listo para regalar desde la caja.' },
  { icon: 'shield', title: 'Calidad garantizada', text: 'Materiales premium y duraderos.' },
]
</script>

<template>
  <main class="about">
    <section class="about-hero" data-aos="fade-down">
      <div class="container">
        <span class="eyebrow">Detallitos Accesorios</span>
        <h1 class="about-title">Historias que se llevan<br />en cada detalle</h1>
        <p class="about-sub">
          Somos una tienda accesorios creada para que cada mujer brille con piezas únicas. Creemos
          que los pequeños detalles cuentan grandes historias.
        </p>
      </div>
    </section>

    <section class="container about-content">
      <div class="about-img" data-aos="fade-right">
        <img :src="aboutImage" alt="Detallitos Accesorios" />
      </div>
      <div class="about-text" data-aos="fade-left">
        <span class="eyebrow">Nuestra esencia</span>
        <h2 class="section-title">Feminidad que se expresa</h2>
        <p>
          En Detallitos cada accesorio es elegido con cuidado para reflejar tu estilo. Desde
          collares delicados hasta regalos personalizados, queremos acompañarte en cada etapa con
          piezas que realzan tu esencia.
        </p>
        <div class="about-values">
          <div
            v-for="(value, index) in values"
            :key="value.title"
            class="value"
            data-aos="fade-up"
            :data-aos-delay="index * 80"
          >
            <div class="value-icon"><AppIcon :name="value.icon" :size="22" /></div>
            <div>
              <p class="value-title">{{ value.title }}</p>
              <p class="value-text">{{ value.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.about-hero {
  background: linear-gradient(180deg, #fff7f9 0%, #ffffff 100%);
  border-bottom: 1.5px solid var(--rose-200, #f3c6d2);
  color: var(--ink-900);
  text-align: center;
  padding: 60px 0;
}

.about-hero .eyebrow {
  color: var(--rose-600);
}

.about-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 60px);
  font-weight: 600;
  color: var(--ink-900);
  line-height: 1.1;
  margin-bottom: 14px;
}

.about-sub {
  font-size: 16px;
  color: var(--ink-500);
  max-width: 620px;
  margin: 0 auto;
  line-height: 1.6;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
  padding-top: 70px;
  padding-bottom: 70px;
}

.about-img img {
  width: 100%;
  height: 460px;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

.about-text > p {
  color: var(--ink-500);
  margin: 18px 0 30px;
  max-width: 520px;
}

.about-values {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.value {
  display: flex;
  align-items: center;
  gap: 16px;
}

.value-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--rose-100);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.value-title {
  font-weight: 600;
  color: var(--ink-900);
}

.value-text {
  font-size: 13px;
  color: var(--ink-400);
}

@media (max-width: 800px) {
  .about-content {
    grid-template-columns: 1fr;
  }
  .about-img img {
    height: 320px;
  }
}
</style>
