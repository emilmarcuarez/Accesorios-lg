<script setup>
import { onMounted } from 'vue'
import { STORE } from '@/config'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import AppIcon from '@/components/AppIcon.vue'

const auth = useAuthStore()
const settings = useSettingsStore()

onMounted(() => {
  settings.fetch()
})
</script>

<template>
  <section
    v-if="settings.registerBanner && settings.registerBanner.enabled !== false"
    class="newsletter"
  >
    <!-- Ondas decorativas superiores -->
    <div class="newsletter-wave-top" aria-hidden="true">
      <svg
        viewBox="0 0 1440 90"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Capa 1 translúcida para suavidad y profundidad -->
        <path
          d="M0,0 L0,45 C240,82 480,22 720,54 C960,86 1200,28 1440,46 L1440,0 Z"
          fill="#ffffff"
          opacity="0.5"
        />
        <!-- Capa 2 onda sólida que hace transición desde el fondo blanco superior -->
        <path
          d="M0,0 L0,24 C260,65 520,72 780,36 C1040,2 1260,46 1440,20 L1440,0 Z"
          fill="#ffffff"
        />
      </svg>
    </div>

    <div class="container">
      <div class="newsletter-content" data-aos="fade-up">
        <div class="nl-copy">
          <span class="eyebrow">{{ settings.registerBanner.eyebrow }}</span>
          <h2 class="nl-title">{{ settings.registerBanner.title }}</h2>
          <p class="nl-text">
            {{ settings.registerBanner.text }}
            <span class="coupon-code-pill">{{ settings.registerBanner.couponCode || STORE.coupon }}</span>
          </p>

          <div class="benefits-row">
            <div v-if="settings.registerBanner.benefit1" class="benefit-tag">
              <AppIcon name="check" :size="13" class="benefit-icon" />
              <span>{{ settings.registerBanner.benefit1 }}</span>
            </div>
            <div v-if="settings.registerBanner.benefit2" class="benefit-tag">
              <AppIcon name="check" :size="13" class="benefit-icon" />
              <span>{{ settings.registerBanner.benefit2 }}</span>
            </div>
            <div v-if="settings.registerBanner.benefit3" class="benefit-tag">
              <AppIcon name="check" :size="13" class="benefit-icon" />
              <span>{{ settings.registerBanner.benefit3 }}</span>
            </div>
          </div>
        </div>

        <div class="nl-action-side">
          <template v-if="!auth.isAuthenticated">
            <router-link to="/registro" class="btn-register-cta">
              <AppIcon name="user" :size="17" />
              {{ settings.registerBanner.buttonText || 'Registrarme y Obtener 10% OFF' }}
            </router-link>
            <p class="login-prompt">
              ¿Ya tienes cuenta?
              <router-link to="/login" class="login-link">Inicia sesión</router-link>
            </p>
          </template>

          <template v-else>
            <div class="logged-member-box">
              <p class="member-name">¡Hola, {{ auth.fullName || 'bienvenida/o' }}!</p>
              <p class="member-desc">
                Ya eres parte de nuestra tienda. Tu código
                <strong>{{ settings.registerBanner.couponCode || STORE.coupon }}</strong> te espera.
              </p>
              <router-link to="/tienda" class="btn-shop-cta">
                Explorar Colección
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.newsletter {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, #fff3f6 0%, #fde7ed 40%, #fbeef1 100%);
  padding: 0 0 54px 0;
  overflow: hidden;
  border-bottom: 1px solid rgba(234, 169, 187, 0.25);
}

.newsletter-wave-top {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
  pointer-events: none;
  z-index: 2;
}

.newsletter-wave-top svg {
  display: block;
  width: 100%;
  height: 46px;
}

@media (min-width: 768px) {
  .newsletter-wave-top svg {
    height: 70px;
  }
}

@media (min-width: 1200px) {
  .newsletter-wave-top svg {
    height: 86px;
  }
}

.newsletter-content {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding: 24px 0 10px;
}

.eyebrow {
  color: #111111;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.nl-copy {
  max-width: 560px;
}

.nl-title {
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(42px, 6vw, 64px);
  font-weight: 800;
  line-height: 1;
  margin: 10px 0 12px;
  color: #111111;
  letter-spacing: -0.02em;
}

.nl-text {
  font-size: 15.5px;
  color: var(--ink-700);
  line-height: 1.55;
}

.nl-text strong {
  color: #111111;
  font-weight: 700;
}

.coupon-code-pill {
  display: inline-block;
  background: #111111;
  color: #ffffff;
  padding: 3px 12px;
  border-radius: 2px;
  font-weight: 800;
  font-size: 13.5px;
  letter-spacing: 0.06em;
  margin-left: 4px;
}

.benefits-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.benefit-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #222222;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 6px 12px;
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.benefit-icon {
  color: #c92a54;
}

.nl-action-side {
  flex: 1;
  min-width: 320px;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.btn-register-cta {
  width: 100%;
  padding: 17px 30px;
  background: #111111;
  color: #ffffff;
  border: 1px solid #111111;
  border-radius: 2px;
  font-family: 'Montserrat', sans-serif;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  transition: all 0.25s ease;
  text-decoration: none;
}

.btn-register-cta:hover {
  background: #c92a54;
  border-color: #c92a54;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(201, 42, 84, 0.28);
}

.login-prompt {
  margin-top: 14px;
  font-size: 13px;
  color: var(--ink-500);
  text-align: center;
}

.login-link {
  color: #111111;
  font-weight: 700;
  text-decoration: underline;
  margin-left: 4px;
  transition: color 0.2s;
}

.login-link:hover {
  color: #c92a54;
}

.logged-member-box {
  width: 100%;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  padding: 24px 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.member-name {
  font-weight: 700;
  font-size: 17px;
  color: #111111;
  margin-bottom: 4px;
}

.member-desc {
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 18px;
  line-height: 1.4;
}

.btn-shop-cta {
  display: inline-block;
  width: 100%;
  padding: 13px 20px;
  background: #111111;
  color: #ffffff;
  border-radius: 2px;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn-shop-cta:hover {
  background: #c92a54;
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .newsletter-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0 10px;
    gap: 32px;
  }
  .benefits-row {
    justify-content: center;
  }
  .nl-action-side {
    width: 100%;
    max-width: 480px;
    min-width: 0;
  }
}
</style>
