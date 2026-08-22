<script setup>
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <section class="promos">
    <div class="container promo-grid">
      <div class="promo-card promo-rose">
        <div class="promo-copy">
          <h3 class="promo-title">Para ti,<br />con amor</h3>
          <p class="promo-text">Detalles que te hacen brillar todos los días.</p>
          <a href="/tienda" class="btn btn-light">Nuestra alegría para ti</a>
        </div>
        <div class="promo-media">
          <img :src="'/img/mujer.png'" alt="Para ti con amor" />
        </div>
      </div>

      <div class="promo-card promo-cream">
        <div class="promo-copy">
          <h3 class="promo-title">El regalo<br />perfecto</h3>
          <p class="promo-text">Sorprende a quien más amas con algo inolvidable.</p>
          <a href="/tienda/personalizados" class="btn btn-ghost">
            Ver opciones de regalo
            <AppIcon name="chevronRight" :size="16" />
          </a>
        </div>
        <div class="promo-media">
          <img :src="'/img/regalo.png'" alt="El regalo perfecto" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.promos {
  padding: 40px 0;
}

.promo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.promo-card {
  display: flex;
  align-items: stretch;
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 300px;
}

.promo-rose {
  background: var(--rose-gradient);
  color: var(--white);
}

.promo-cream {
  background: linear-gradient(135deg, #fff5f1, #ffe8ef);
  color: var(--ink-900);
}

.promo-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 44px;
  gap: 14px;
}

.promo-title {
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 600;
  line-height: 1.08;
}

.promo-text {
  font-size: 15px;
  opacity: 0.92;
}

.btn-light {
  background: var(--white);
  color: var(--rose-600);
  box-shadow: var(--shadow-md);
}

.btn-light:hover {
  transform: translateY(-2px);
}

.promo-media {
  width: 42%;
  position: relative;
  overflow: hidden;
}

.promo-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 900px) {
  .promo-grid {
    grid-template-columns: 1fr;
  }
  .promo-card {
    flex-direction: column;
    min-height: 0;
  }
  .promo-copy {
    padding: 34px 30px;
  }
  .promo-media {
    width: 100%;
    height: 220px;
  }
}

@media (max-width: 480px) {
  .promo-copy {
    padding: 28px 24px;
  }
  .promo-media {
    height: 190px;
  }
}
</style>
