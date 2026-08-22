<script setup>
import { ref } from 'vue'
import { STORE } from '@/config'
import AppIcon from '@/components/AppIcon.vue'

const form = ref({ name: '', email: '', message: '' })
const sent = ref(false)

function submit() {
  if (!form.value.name || !form.value.email || !form.value.message) return
  const text = `Hola ${STORE.name}, me llamo ${form.value.name} (${form.value.email}). ${form.value.message}`
  window.open(
    `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`,
    '_blank',
  )
  sent.value = true
}
</script>

<template>
  <main class="contact">
    <section class="contact-hero">
      <div class="container">
        <span class="eyebrow">Contacto</span>
        <h1 class="contact-title">Hablemos</h1>
        <p class="contact-sub">Escríbenos y te responderemos lo antes posible.</p>
      </div>
    </section>

    <section class="container contact-grid">
      <div class="contact-info">
        <div class="info-item">
          <div class="info-icon"><AppIcon name="whatsapp" :size="22" /></div>
          <div>
            <p class="info-label">WhatsApp</p>
            <a :href="`https://wa.me/${STORE.whatsapp}`" class="info-value">+{{ STORE.whatsapp }}</a>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon"><AppIcon name="mail" :size="22" /></div>
          <div>
            <p class="info-label">Correo</p>
            <span class="info-value">{{ STORE.email }}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon"><AppIcon name="mapPin" :size="22" /></div>
          <div>
            <p class="info-label">Ubicación</p>
            <span class="info-value">{{ STORE.address }}</span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon"><AppIcon name="instagram" :size="22" /></div>
          <div>
            <p class="info-label">Instagram</p>
            <span class="info-value">{{ STORE.instagram }}</span>
          </div>
        </div>
      </div>

      <form class="contact-form" @submit.prevent="submit">
        <label class="field">
          <span>Nombre</span>
          <input v-model="form.name" type="text" placeholder="Tu nombre" />
        </label>
        <label class="field">
          <span>Correo</span>
          <input v-model="form.email" type="email" placeholder="tu@correo.com" />
        </label>
        <label class="field">
          <span>Mensaje</span>
          <textarea v-model="form.message" rows="5" placeholder="Cuéntanos en qué te ayudamos"></textarea>
        </label>
        <p v-if="sent" class="sent">¡Recibido! Te contactaremos por WhatsApp.</p>
        <button type="submit" class="btn btn-primary">
          <AppIcon name="heart" :size="16" />
          Enviar mensaje
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.contact-hero {
  background: var(--rose-gradient);
  color: var(--white);
  text-align: center;
  padding: 64px 0;
}

.contact-hero .eyebrow {
  color: rgba(255, 255, 255, 0.9);
}

.contact-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 60px);
  font-weight: 600;
}

.contact-sub {
  margin-top: 8px;
  opacity: 0.95;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 50px;
  padding-top: 60px;
  padding-bottom: 70px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  flex: 0 0 auto;
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: var(--rose-100);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-400);
}

.info-value {
  font-weight: 600;
  color: var(--ink-900);
}

.info-value:hover {
  color: var(--rose-600);
}

.contact-form {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 34px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input,
.field textarea {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.sent {
  color: var(--rose-600);
  font-weight: 500;
}

@media (max-width: 800px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
