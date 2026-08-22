<script setup>
import { STORE } from '@/config'
import AppIcon from '@/components/AppIcon.vue'

const shopLinks = [
  { label: 'Collares', to: '/tienda/collares' },
  { label: 'Pulseras', to: '/tienda/pulseras' },
  { label: 'Aretes', to: '/tienda/aretes' },
  { label: 'Anillos', to: '/tienda/anillos' },
  { label: 'Accesorios para el cabello', to: '/tienda/cabello' },
  { label: 'Regalos Personalizados', to: '/tienda/personalizados' },
]

const infoLinks = [
  { label: 'Envíos', to: '/nosotros' },
  { label: 'Medios de pago', to: '/nosotros' },
  { label: 'Preguntas frecuentes', to: '/nosotros' },
  { label: 'Devoluciones', to: '/nosotros' },
  { label: 'Términos y condiciones', to: '/nosotros' },
  { label: 'Privacidad', to: '/nosotros' },
]

const helpLinks = [
  { label: 'Preguntas frecuentes', to: '/nosotros' },
  { label: 'Guía de tallas', to: '/nosotros' },
  { label: 'Cuidado de joyas', to: '/nosotros' },
  { label: 'Contacto', to: '/contactos' },
]

const socials = [
  { icon: 'instagram', url: `https://instagram.com/${STORE.instagram.replace('@', '')}` },
  { icon: 'facebook', url: 'https://facebook.com' },
  { icon: 'tiktok', url: 'https://tiktok.com' },
]

const payments = ['Pago Movil', 'Transferencias','Zelle', 'USDT', 'Dolares', 'Euros']
</script>

<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="brand">
          <span class="brand-script">{{ STORE.name }} </span>
          <span class="brand-sub"> Accesorios</span>
        </div>
        <p class="footer-desc">Accesorios que cuentan tu historia y realzan tu esencia, hechos con amor para ti.</p>
        <div class="socials">
          <a
            v-for="social in socials"
            :key="social.icon"
            :href="social.url"
            class="social"
            target="_blank"
            aria-label="Red social"
          >
            <AppIcon :name="social.icon" :size="18" />
          </a>
        </div>
      </div>

      <div class="footer-col">
        <p class="footer-title">Tienda</p>
        <router-link v-for="link in shopLinks" :key="link.label" :to="link.to" class="footer-link">
          {{ link.label }}
        </router-link>
      </div>

      <div class="footer-col">
        <p class="footer-title">Información</p>
        <router-link v-for="link in infoLinks" :key="link.label" :to="link.to" class="footer-link">
          {{ link.label }}
        </router-link>
      </div>

      <div class="footer-col">
        <p class="footer-title">Ayudo</p>
        <router-link v-for="link in helpLinks" :key="link.label" :to="link.to" class="footer-link">
          {{ link.label }}
        </router-link>
      </div>

      <div class="footer-col">
        <p class="footer-title">Contacto</p>
        <div class="contact-item">
          <AppIcon name="mail" :size="16" />
          <span>{{ STORE.email }}</span>
        </div>
        <div class="contact-item">
          <AppIcon name="whatsapp" :size="16" />
          <span>+{{ STORE.whatsapp }}</span>
        </div>
        <div class="contact-item">
          <AppIcon name="mapPin" :size="16" />
          <span>{{ STORE.address }}</span>
        </div>
      </div>
    </div>

    <div class="container footer-bottom">
      <p class="copyright">© 2026 {{ STORE.name }}. Todos los derechos reservados.</p>
      <div class="payments">
        <span v-for="pay in payments" :key="pay" class="payment">{{ pay }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #fbeef1;
  border-top: 1px solid var(--line);
  padding-top: 60px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1.2fr;
  gap: 36px;
  padding-bottom: 40px;
}

.brand-script {
  font-family: var(--font-script);
  font-size: 28px;
  font-weight: 700;
  color: var(--rose-600);
}

.brand-sub {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  color: var(--ink-400);
  text-transform: uppercase;
}

.footer-desc {
  font-size: 13.5px;
  color: var(--ink-500);
  margin: 16px 0 20px;
  max-width: 300px;
}

.socials {
  display: flex;
  gap: 10px;
}

.social {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--white);
  border: 1px solid var(--rose-200);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-600);
  transition: all 0.2s ease;
}

.social:hover {
  background: var(--rose-600);
  color: var(--white);
  border-color: var(--rose-600);
}

.footer-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-900);
  margin-bottom: 18px;
}

.footer-link {
  display: block;
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 12px;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--rose-600);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 14px;
}

.contact-item svg {
  color: var(--rose-500);
  flex: 0 0 auto;
}

.footer-bottom {
  border-top: 1px solid var(--rose-100);
  padding: 22px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.copyright {
  font-size: 12px;
  color: var(--ink-400);
}

.payments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.payment {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-500);
  border: 1px solid var(--rose-200);
  border-radius: 6px;
  padding: 4px 10px;
  background: var(--white);
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
  }
  .payments {
    justify-content: center;
  }
}
</style>
