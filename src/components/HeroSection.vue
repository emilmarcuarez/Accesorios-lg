<script setup>
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <section class="hero">
    <div class="hero-shade"></div>

    <span class="spark spark-a">&#10022;</span>
    <span class="spark spark-b">&#10022;</span>

    <span class="heart he-a"><AppIcon name="heart" :size="26" /></span>
    <span class="heart he-b"><AppIcon name="heart" :size="18" /></span>
    <span class="heart he-c"><AppIcon name="heart" :size="22" /></span>
    <span class="heart he-d"><AppIcon name="heart" :size="16" /></span>

    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="hero-eyebrow">Pequeños detalles,</p>
        <h1 class="hero-title">grandes <span class="accent">recuerdos</span></h1>
        <p class="hero-text">Accesorios que cuentan tu historia y realzan tu esencia.</p>
        <div class="hero-actions">
          <a href="/tienda" class="btn btn-primary hero-btn">
            Descubre la colección
            <AppIcon name="chevronRight" :size="18" />
          </a>
          <p class="hero-note"><AppIcon name="heart" :size="15" /> Hecho con amor para ti</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background-image: url('/img/banner.png');
  background-size: cover;
  background-position: center;
  min-height: 600px;
  display: flex;
  align-items: center;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 249, 250, 0.92) 0%,
    rgba(255, 249, 250, 0.72) 38%,
    rgba(255, 249, 250, 0.28) 62%,
    rgba(255, 249, 250, 0) 82%
  );
}

.hero-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-copy {
  max-width: 560px;
}

.hero-eyebrow {
  font-size: 21px;
  font-weight: 400;
  color: var(--ink-700);
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(46px, 6.5vw, 82px);
  line-height: 1.02;
  color: var(--ink-900);
}

.hero-title .accent {
  font-family: var(--font-script);
  font-weight: 700;
  color: var(--rose-500);
  font-size: 0.86em;
}

.hero-text {
  margin: 20px 0 28px;
  font-size: 17px;
  color: var(--ink-500);
  max-width: 430px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

.hero-btn {
  font-size: 15px;
  padding: 15px 32px;
}

.hero-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--rose-600);
}

.spark {
  position: absolute;
  color: var(--gold);
  font-size: 22px;
  z-index: 1;
  animation: twinkle 3.2s ease-in-out infinite;
}

.spark-a {
  top: 18%;
  left: 46%;
}

.spark-b {
  top: 26%;
  right: 12%;
  animation-delay: 1.4s;
}

.heart {
  position: absolute;
  color: rgba(217, 109, 139, 0.5);
  z-index: 1;
  animation: float 7s ease-in-out infinite;
}

.he-a {
  top: 16%;
  right: 28%;
}

.he-b {
  bottom: 22%;
  left: 48%;
  animation-delay: 1.2s;
}

.he-c {
  top: 36%;
  right: 16%;
  animation-delay: 2.4s;
}

.he-d {
  bottom: 30%;
  right: 34%;
  animation-delay: 3.4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-26px) rotate(8deg);
    opacity: 0.35;
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@media (max-width: 900px) {
  .hero {
    min-height: 520px;
  }
  .hero-shade {
    background: linear-gradient(
      180deg,
      rgba(255, 249, 250, 0.94) 0%,
      rgba(255, 249, 250, 0.78) 100%
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
  .hero-title {
    font-size: clamp(38px, 11vw, 54px);
  }
}

@media (max-width: 480px) {
  .hero {
    min-height: 460px;
    padding: 60px 0;
  }
  .he-c,
  .he-d,
  .spark-b {
    display: none;
  }
}
</style>
