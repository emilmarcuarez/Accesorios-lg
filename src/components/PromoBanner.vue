<script setup>
import { onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore } from '@/store/settings'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()

onMounted(() => {
  settings.fetch()
})
</script>

<template>
  <section class="promos">
    <div class="container promo-grid">
      <!-- Banner 1: Estilo Rosa -->
      <div class="promo-card promo-rose" data-aos="fade-right">
        <div class="promo-copy">
          <h3 class="promo-title" style="white-space: pre-line;">{{ settings.banners.banner1.title }}</h3>
          <p class="promo-text">{{ settings.banners.banner1.text }}</p>
          <a :href="settings.banners.banner1.buttonLink || '/tienda'" class="btn btn-light">
            {{ settings.banners.banner1.buttonText }}
          </a>
        </div>
        <div class="promo-media">
          <img :src="resolveImage(settings.banners.banner1.image)" :alt="settings.banners.banner1.title" />
        </div>
      </div>

      <!-- Banner 2: Estilo Crema -->
      <div class="promo-card promo-cream" data-aos="fade-left">
        <div class="promo-copy">
          <h3 class="promo-title" style="white-space: pre-line;">{{ settings.banners.banner2.title }}</h3>
          <p class="promo-text">{{ settings.banners.banner2.text }}</p>
          <a :href="settings.banners.banner2.buttonLink || '/tienda/personalizados'" class="btn btn-ghost">
            {{ settings.banners.banner2.buttonText }}
            <AppIcon name="chevronRight" :size="16" />
          </a>
        </div>
        <div class="promo-media">
          <img :src="resolveImage(settings.banners.banner2.image)" :alt="settings.banners.banner2.title" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.promos {
  padding: 55px 0;
  background: linear-gradient(180deg, rgba(255, 248, 250, 0) 0%, rgba(253, 237, 242, 0.65) 50%, rgba(255, 248, 250, 0) 100%);
}

.promo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.promo-card {
  display: flex;
  align-items: stretch;
  border-radius: 2px;
  overflow: hidden;
  min-height: 300px;
}

.promo-rose {
  background: linear-gradient(135deg, #fff7f9 0%, #fdecf1 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: var(--ink-900);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.promo-cream {
  background: linear-gradient(135deg, #fafafa 0%, #f4f4f4 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: var(--ink-900);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
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
  color: var(--ink-900);
}

.promo-text {
  font-size: 15px;
  color: var(--ink-500);
  line-height: 1.5;
}

.btn-light {
  background: #111111;
  color: #ffffff;
  border: 1px solid #111111;
  border-radius: 2px;
  padding: 12px 24px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: all 0.25s ease;
}

.btn-light:hover {
  background: #333333;
  border-color: #333333;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.btn-ghost {
  border-radius: 2px;
  border: 1px solid #111111;
  color: #111111;
  padding: 12px 24px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.25s ease;
}

.btn-ghost:hover {
  background: #111111;
  color: #ffffff;
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
