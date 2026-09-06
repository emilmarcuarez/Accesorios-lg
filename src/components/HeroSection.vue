<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore, DEFAULT_HERO } from '@/store/settings'
import { useUiStore } from '@/store/ui'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()
const ui = useUiStore()
const videoRef = ref(null)

function onVideoReady() {
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
  ui.markVideoReady()
}

function onVideoError() {
  ui.markVideoReady()
}

onMounted(() => {
  settings.fetch()
  if (videoRef.value && videoRef.value.readyState >= 3) {
    onVideoReady()
  }
})

const hero = computed(() => settings.hero || DEFAULT_HERO)

const hasVideo = computed(() => {
  return Boolean(hero.value.video && hero.value.video.trim())
})

const heroVideoSrc = computed(() => {
  if (!hero.value.video) return ''
  return resolveImage(hero.value.video)
})

const heroBg = computed(() => {
  if (hasVideo.value) return 'none'
  const imgUrl = hero.value.image || DEFAULT_HERO.image || '/img/banner.png'
  const resolved = resolveImage(imgUrl)
  return `url('${resolved}'), url('/img/banner.png')`
})
</script>

<template>
  <section class="hero" :class="{ 'with-video': hasVideo }" :style="{ backgroundImage: heroBg }">
    <!-- Video de fondo si está configurado -->
    <video
      v-if="hasVideo"
      ref="videoRef"
      :src="heroVideoSrc"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      class="hero-video-bg"
      @canplay="onVideoReady"
      @loadeddata="onVideoReady"
      @error="onVideoError"
    ></video>

    <!-- Capa de sombra y gradiente elegante multicapa -->
    <div class="hero-shade"></div>

    <!-- Luces ambientales de lujo (Aurora glow difuminado que respira lentamente) -->
    <div class="luxury-aurora aurora-one" aria-hidden="true"></div>
    <div class="luxury-aurora aurora-two" aria-hidden="true"></div>

    <div class="container hero-inner">
      <div class="hero-copy">
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
        </div>
      </div>
    </div>

    <!-- Indicador de desplazamiento sutil y elegante -->
    <div class="hero-scroll-indicator" aria-hidden="true">
      <span class="scroll-mouse">
        <span class="scroll-wheel"></span>
      </span>
      <span class="scroll-text">Explora la colección</span>
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
  min-height: 780px; /* Más alto para que el video y la portada luzcan más amplios y cinematográficos */
  display: flex;
  align-items: center;
  padding: 100px 0 140px; /* Espacio superior e inferior generoso */
  transition: background-image 0.5s ease-in-out;
}

.hero-video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

/* Sombra degradada multicapa para máxima legibilidad y lujo */
.hero-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
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

/* Luces ambientales Aurora de lujo (sustituyen las estrellas por brillo refinado) */
.luxury-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(85px);
  pointer-events: none;
  z-index: 1;
  opacity: 0.35;
  animation: auroraBreathe 10s ease-in-out infinite alternate;
}

.aurora-one {
  width: 440px;
  height: 440px;
  top: 15%;
  left: 20%;
  background: radial-gradient(circle, rgba(254, 205, 211, 0.8) 0%, rgba(244, 114, 182, 0.35) 60%, transparent 80%);
}

.aurora-two {
  width: 520px;
  height: 520px;
  bottom: 20%;
  right: 15%;
  background: radial-gradient(circle, rgba(254, 240, 138, 0.5) 0%, rgba(251, 207, 232, 0.35) 60%, transparent 80%);
  animation-duration: 12s;
  animation-delay: -5s;
}

@keyframes auroraBreathe {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.25;
  }
  50% {
    transform: translate(30px, -20px) scale(1.15);
    opacity: 0.45;
  }
  100% {
    transform: translate(-25px, 15px) scale(0.95);
    opacity: 0.3;
  }
}

.hero-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-copy {
  max-width: 580px;
}

.hero-eyebrow {
  font-size: 22px;
  font-weight: 400;
  color: var(--ink-700, #4a343d);
  margin: 0 0 6px;
  letter-spacing: 0.01em;
  animation: heroFadeIn 0.9s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(48px, 6.8vw, 86px);
  line-height: 1.03;
  color: var(--ink-900, #201318);
  margin: 0;
  text-shadow: 0 2px 8px rgba(255, 255, 255, 0.6);
  animation: heroFadeIn 1s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
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
  animation: heroFadeIn 1.1s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
  animation: heroFadeIn 1.2s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Botón llamativo con toque de negro sofisticado */
.hero-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #111111;
  border: 1.5px solid #111111;
  color: #ffffff;
  padding: 16px 38px;
  border-radius: 2px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-22deg);
  animation: btnSweep 4.5s infinite ease-in-out;
  pointer-events: none;
}

@keyframes btnSweep {
  0%, 65% {
    left: -120%;
  }
  85%, 100% {
    left: 200%;
  }
}

.hero-btn:hover {
  background: #2a2a2a;
  border-color: #2a2a2a;
  color: #ffffff;
  transform: translateY(-3px);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.28);
}

.hero-btn:hover .btn-arrow {
  transform: translateX(5px);
}

.btn-arrow {
  transition: transform 0.25s ease;
}

/* Indicador de scroll elegante */
.hero-scroll-indicator {
  position: absolute;
  bottom: 82px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
  opacity: 0.75;
  pointer-events: none;
}

.scroll-mouse {
  width: 22px;
  height: 34px;
  border: 2px solid rgba(184, 50, 89, 0.45);
  border-radius: 14px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(4px);
}

.scroll-wheel {
  width: 3.5px;
  height: 7px;
  background: var(--rose-600, #b83259);
  border-radius: 3px;
  animation: mouseScroll 2s infinite ease-in-out;
}

.scroll-text {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-500, #6d525d);
  font-weight: 600;
}

@keyframes mouseScroll {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  60% {
    transform: translateY(9px);
    opacity: 0.1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

@media (max-width: 900px) {
  .hero {
    min-height: 640px;
    background-position: center;
    padding: 70px 0 110px;
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
  .hero-scroll-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero {
    min-height: 560px;
    padding: 55px 0 90px;
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
