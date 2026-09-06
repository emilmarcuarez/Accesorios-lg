<script setup>
import { ref } from 'vue'
import { STORE } from '@/config'
import AppIcon from '@/components/AppIcon.vue'

const form = ref({
  name: '',
  phone: '',
  email: '',
  subject: 'Consulta sobre productos',
  message: '',
})
const sent = ref(false)
const lastUrl = ref('')

const subjectOptions = [
  'Consulta sobre productos',
  'Pedido personalizado o encargo',
  'Estado de mi pedido',
  'Ventas al mayor / Revendedora',
  'Dudas con métodos de pago',
  'Otro motivo',
]

function submit() {
  if (!form.value.name.trim() || !form.value.email.trim() || !form.value.message.trim()) return

  const cleanPhone = (STORE.whatsapp || '').replace(/\D/g, '')

  const textLines = [
    `✨ *NUEVO MENSAJE DE CONTACTO - ${STORE.name.toUpperCase()}* ✨`,
    ``,
    `👤 *Nombre:* ${form.value.name.trim()}`,
    `📧 *Correo:* ${form.value.email.trim()}`,
  ]

  if (form.value.phone?.trim()) {
    textLines.push(`📱 *Teléfono:* ${form.value.phone.trim()}`)
  }

  if (form.value.subject) {
    textLines.push(`📌 *Motivo:* ${form.value.subject}`)
  }

  textLines.push(
    ``,
    `💬 *Mensaje:*`,
    `"${form.value.message.trim()}"`,
    ``,
    `_Enviado desde el formulario de contacto de la tienda web_`,
  )

  const fullText = textLines.join('\n')
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`
  lastUrl.value = url

  window.open(url, '_blank')
  sent.value = true
}
</script>

<template>
  <main class="contact">
    <section class="contact-hero" data-aos="fade-down">
      <div class="container">
        <span class="eyebrow">Contacto</span>
        <h1 class="contact-title">Hablemos</h1>
        <p class="contact-sub">Escríbenos directamente a WhatsApp y te atenderemos con gusto.</p>
      </div>
    </section>

    <section class="container contact-grid">
      <div class="contact-info" data-aos="fade-right">
        <div class="info-item">
          <div class="info-icon"><AppIcon name="whatsapp" :size="22" /></div>
          <div>
            <p class="info-label">WhatsApp Oficial</p>
            <a :href="`https://wa.me/${STORE.whatsapp}`" class="info-value" target="_blank">+{{ STORE.whatsapp }}</a>
          </div>
        </div>
        <div class="info-item">
          <div class="info-icon"><AppIcon name="mail" :size="22" /></div>
          <div>
            <p class="info-label">Correo</p>
            <a :href="`mailto:${STORE.email}`" class="info-value">{{ STORE.email }}</a>
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
            <a
              :href="(STORE.instagram || '').startsWith('http') ? STORE.instagram : `https://instagram.com/${(STORE.instagram || '').replace('@', '')}`"
              target="_blank"
              class="info-value"
            >
              {{ STORE.instagram }}
            </a>
          </div>
        </div>
      </div>

      <form class="contact-form" data-aos="fade-left" @submit.prevent="submit">
        <div class="form-row-2">
          <label class="field">
            <span>Nombre completo *</span>
            <input v-model="form.name" type="text" placeholder="Tu nombre y apellido" required />
          </label>
          <label class="field">
            <span>Teléfono / WhatsApp</span>
            <input v-model="form.phone" type="tel" placeholder="Ej: 0412 1234567" />
          </label>
        </div>

        <div class="form-row-2">
          <label class="field">
            <span>Correo electrónico *</span>
            <input v-model="form.email" type="email" placeholder="tu@correo.com" required />
          </label>
          <label class="field">
            <span>Motivo de consulta</span>
            <select v-model="form.subject" class="field-select">
              <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span>Mensaje *</span>
          <textarea v-model="form.message" rows="5" placeholder="Cuéntanos con detalle en qué te podemos asesorar o ayudar..." required></textarea>
        </label>

        <!-- Aviso explicativo de WhatsApp -->
        <div class="ws-notice-box">
          <AppIcon name="whatsapp" :size="18" class="ws-notice-icon" />
          <div>
            <p class="ws-notice-title">Mensaje listo para WhatsApp</p>
            <p class="ws-notice-desc">Al presionar el botón se armará tu mensaje estructurado y se abrirá WhatsApp con nuestro equipo oficial (+{{ STORE.whatsapp }}).</p>
          </div>
        </div>

        <div v-if="sent" class="sent-box">
          <p class="sent-text">¡Mensaje preparado! Se abrió WhatsApp para enviarlo.</p>
          <a :href="lastUrl" target="_blank" class="sent-retry">¿No se abrió WhatsApp? Haz clic aquí para abrirlo directamente</a>
        </div>

        <button type="submit" class="btn btn-ws">
          <AppIcon name="whatsapp" :size="18" />
          Enviar mensaje por WhatsApp
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.contact-hero {
  background: linear-gradient(180deg, #fff7f9 0%, #ffffff 100%);
  border-bottom: 1.5px solid var(--rose-200, #f3c6d2);
  color: var(--ink-900);
  text-align: center;
  padding: 56px 0;
}

.contact-hero .eyebrow {
  color: var(--rose-600);
}

.contact-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 60px);
  font-weight: 600;
  color: var(--ink-900);
}

.contact-sub {
  margin-top: 8px;
  color: var(--ink-500);
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
.field textarea:focus,
.field-select:focus {
  border-color: #111111;
  background: var(--white);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-select {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
  cursor: pointer;
  font-family: inherit;
}

.ws-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 2px;
  padding: 14px 16px;
  font-size: 13px;
  color: #166534;
}

.ws-notice-icon {
  color: #25d366;
  flex-shrink: 0;
  margin-top: 2px;
}

.ws-notice-title {
  font-weight: 700;
  margin-bottom: 2px;
  color: #14532d;
  font-size: 13px;
}

.ws-notice-desc {
  color: #166534;
  line-height: 1.4;
  font-size: 12.5px;
}

.sent-box {
  background: #fdf2f8;
  border: 1px solid #fbcfe8;
  border-radius: 2px;
  padding: 14px 16px;
  text-align: center;
}

.sent-text {
  color: #9d174d;
  font-weight: 700;
  font-size: 13.5px;
  margin-bottom: 4px;
}

.sent-retry {
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  display: inline-block;
  margin-top: 2px;
}

.sent-retry:hover {
  color: #166534;
}

.btn-ws {
  background: #111111;
  color: #ffffff;
  border: 1px solid #111111;
  border-radius: 2px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 16px 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  width: 100%;
}

.btn-ws:hover {
  background: #242424;
  border-color: #242424;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.26);
}

.btn-ws :deep(svg) {
  color: #25D366;
}

@media (max-width: 800px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
