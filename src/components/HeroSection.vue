<script setup>
import { computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore, DEFAULT_HERO } from '@/store/settings'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()

onMounted(() => {
  settings.fetch()
})

const hero = computed(() => settings.hero || DEFAULT_HERO)

const heroBg = computed(() => {
  const imgUrl = hero.value.image || DEFAULT_HERO.image || '/img/banner.png'
  const resolved = resolveImage(imgUrl)
  return `url('${resolved}'), url('/img/banner.png')`
})
</script>

<template>
  <section class="hero" :style="{ backgroundImage: heroBg }">
    <!-- Capa de sombra y gradiente elegante multicapa -->
    <div class="hero-shade"></div>

    <!-- Destellos dorados parpadeantes -->
    <span class="spark spark-a">&#10022;</span>
    <span class="spark spark-b">&#10022;</span>
    <span class="spark spark-c">&#10022;</span>

    <!-- Corazones flotantes delicados -->
    <span class="heart he-a"><AppIcon name="heart" :size="26" /></span>
    <span class="heart he-b"><AppIcon name="heart" :size="18" /></span>
    <span class="heart he-c"><AppIcon name="heart" :size="22" /></span>
    <span class="heart he-d"><AppIcon name="heart" :size="16" /></span>

    <div class="container hero-inner">
      <div class="hero-copy">
        <!-- Badge Chic Superior -->
        <div v-if="hero.badge" class="hero-badge">
          <span class="badge-sparkle">&#10022;</span>
          <span>{{ hero.badge }}</span>
        </div>

        <p class="hero-eyebrow">{{ hero.eyebrow || 'Pequeños detalles,' }}</p>

        <h1 class="hero-title">
          {{ hero.title || 'grandes' }}
          <span class="accent">{{ hero.titleAccent || 'recuerdos' }}</span>
        </h1>

        <p class="hero-text">
          {{ hero.text || 'Accesorios que cuentan tu historia y realzan tu esencia.' }}
        </p>

        <div class="hero-actions">
          <router-link :to="hero.buttonLink || '/tienda'" class="hero-btn">
            <span>{{ hero.buttonText || 'Descubre la colección' }}</span>
            <AppIcon name="chevronRight" :size="18" class="btn-arrow" />
          </router-link>

          <div class="hero-note">
            <span class="note-icon"><AppIcon name="heart" :size="15" /></span>
            <span>Hecho con amor para ti</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Corte Inferior en Ondas Elegantes (Wave Organic Shape Divider) -->
    <div class="hero-wave-wrap" aria-hidden="true">
      <svg class="hero-wave" viewBox="0 0 1440 110" preserveAspectRatio="none">
        <!-- Onda posterior translúcida perla -->
        <path
          class="wave-back"
          d="M0,28 C260,75 520,10 780,48 C1040,86 1280,30 1440,54 L1440,110 L0,110 Z"
        ></path>
        <!-- Onda frontal blanca pura que integra con el carrusel inferior -->
        <path
          class="wave-front"
          d="M0,45 C320,95 640,32 960,72 C1200,102 1360,58 1440,64 L1440,110 L0,110 Z"
        ></path>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  min-height: 620px;
  display: flex;
  align-items: center;
  padding: 60px 0 110px; /* Espacio inferior para el corte en ondas */
  transition: background-image 0.5s ease-in-out;
}

/* Sombra degradada multicapa para máxima legibilidad y lujo */
.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 248, 250, 0.96) 0%,
    rgba(255, 248, 250, 0.88) 35%,
    rgba(255, 248, 250, 0.45) 58%,
    rgba(255, 248, 250, 0.08) 78%,
    rgba(255, 248, 250, 0) 100%
  );
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-copy {
  max-width: 580px;
}

/* Badge Chic */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(224, 137, 160, 0.35);
  color: var(--rose-600, #b83259);
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(216, 90, 127, 0.12);
  animation: badgeGlow 4s ease-in-out infinite alternate;
}

.badge-sparkle {
  color: #e5a93c;
  font-size: 13px;
}

@keyframes badgeGlow {
  0% {
    box-shadow: 0 4px 14px rgba(216, 90, 127, 0.12);
    border-color: rgba(224, 137, 160, 0.35);
  }
  100% {
    box-shadow: 0 6px 20px rgba(216, 90, 127, 0.25);
    border-color: rgba(216, 90, 127, 0.6);
  }
}

.hero-eyebrow {
  font-size: 22px;
  font-weight: 400;
  color: var(--ink-700, #4a343d);
  margin: 0 0 6px;
  letter-spacing: 0.01em;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(48px, 6.8vw, 86px);
  line-height: 1.03;
  color: var(--ink-900, #201318);
  margin: 0;
  text-shadow: 0 2px 8px rgba(255, 255, 255, 0.6);
}

.hero-title .accent {
  font-family: var(--font-script, cursive);
  font-weight: 700;
  color: var(--rose-500, #d85a7f);
  font-size: 0.88em;
  display: inline-block;
  transform: rotate(-2deg);
  text-shadow: 0 4px 14px rgba(216, 90, 127, 0.25);
  margin-left: 6px;
}

.hero-text {
  margin: 22px 0 32px;
  font-size: 17.5px;
  color: var(--ink-500, #6e5861);
  max-width: 440px;
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

/* Botón llamativo con efecto de brillo fluido */
.hero-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--rose-gradient, linear-gradient(135deg, #d85a7f 0%, #b83259 100%));
  color: #ffffff;
  padding: 16px 36px;
  border-radius: 50px;
  font-size: 15.5px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 10px 28px rgba(184, 50, 89, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-22deg);
  transition: none;
}

.hero-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 14px 34px rgba(184, 50, 89, 0.45);
}

.hero-btn:hover::after {
  left: 140%;
  transition: left 0.85s ease-in-out;
}

.hero-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-arrow {
  transition: transform 0.25s ease;
}

.hero-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 17.5px;
  color: var(--rose-600, #b83259);
  font-weight: 500;
}

.note-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-500);
  animation: pulseHeart 2s infinite ease-in-out;
}

@keyframes pulseHeart {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* Corte Ondas SVG Inferior */
.hero-wave-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  line-height: 0;
  overflow: hidden;
  z-index: 3;
  pointer-events: none;
}

.hero-wave {
  position: relative;
  display: block;
  width: calc(100% + 1.3px);
  height: 68px;
}

.wave-back {
  fill: #fff3f5;
  opacity: 0.85;
}

.wave-front {
  fill: #ffffff;
}

/* Partículas flotantes */
.spark {
  position: absolute;
  color: #e6a836;
  font-size: 22px;
  z-index: 1;
  pointer-events: none;
  animation: twinkle 3.2s ease-in-out infinite;
}

.spark-a {
  top: 18%;
  left: 45%;
}

.spark-b {
  top: 26%;
  right: 12%;
  animation-delay: 1.4s;
}

.spark-c {
  top: 48%;
  left: 38%;
  font-size: 17px;
  animation-delay: 2.1s;
}

.heart {
  position: absolute;
  color: rgba(217, 109, 139, 0.45);
  z-index: 1;
  pointer-events: none;
  animation: float 7s ease-in-out infinite;
}

.he-a {
  top: 16%;
  right: 28%;
}

.he-b {
  bottom: 24%;
  left: 48%;
  animation-delay: 1.2s;
}

.he-c {
  top: 36%;
  right: 16%;
  animation-delay: 2.4s;
}

.he-d {
  bottom: 32%;
  right: 34%;
  animation-delay: 3.4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(-6deg);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-24px) rotate(8deg);
    opacity: 0.35;
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

@media (max-width: 900px) {
  .hero {
    min-height: 520px;
    background-position: center;
    padding: 50px 0 90px;
  }
  .hero-shade {
    background: linear-gradient(
      180deg,
      rgba(255, 248, 250, 0.95) 0%,
      rgba(255, 248, 250, 0.85) 60%,
      rgba(255, 248, 250, 0.5) 100%
    );
  }
  .hero-copy {
    margin: 0 auto;
    text-align: center;
  }
  .hero-text {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-wave {
    height: 48px;
  }
}

@media (max-width: 480px) {
  .hero {
    min-height: 470px;
    padding: 40px 0 75px;
  }
  .he-c,
  .he-d,
  .spark-b,
  .spark-c {
    display: none;
  }
  .hero-btn {
    padding: 14px 28px;
    font-size: 14.5px;
  }
  .hero-wave {
    height: 38px;
  }
}
</style>
