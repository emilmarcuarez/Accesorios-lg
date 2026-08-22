<script setup>
import { ref } from 'vue'
import { STORE } from '@/config'
import AppIcon from '@/components/AppIcon.vue'

const email = ref('')
const done = ref(false)

function subscribe() {
  if (!email.value.trim()) return
  done.value = true
}
</script>

<template>
  <section class="newsletter">
    <div class="container">
      <div class="newsletter-card">
        <div class="nl-copy">
          <span class="eyebrow">Suscríbete y recibe</span>
          <h2 class="nl-title">10% OFF</h2>
          <p class="nl-text">en tu primera compra con el código: <strong>{{ STORE.coupon }}</strong></p>
        </div>

        <div class="nl-form">
          <div v-if="!done" class="nl-input-wrap">
            <input v-model="email" type="email" placeholder="Ingresa tu correo electrónico" />
            <button class="btn btn-primary" @click="subscribe">Suscribirme</button>
          </div>
          <p v-else class="nl-success">
            <AppIcon name="check" :size="18" /> ¡Listo! Revisa tu correo.
          </p>
          <span class="nl-note">Al suscribirte aceptas nuestra política de privacidad.</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.newsletter {
  padding: 20px 0 50px;
}

.newsletter-card {
  background: var(--rose-gradient);
  border-radius: var(--radius-lg);
  padding: 48px 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  color: var(--white);
  box-shadow: var(--shadow-lg);
}

.eyebrow {
  color: rgba(255, 255, 255, 0.85);
}

.nl-copy {
  max-width: 520px;
}

.nl-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 60px);
  font-weight: 700;
  line-height: 1;
  margin: 6px 0 6px;
}

.nl-text {
  font-size: 15px;
  opacity: 0.95;
}

.nl-text strong {
  text-decoration: underline;
}

.nl-form {
  flex: 1;
  min-width: 340px;
  max-width: 480px;
}

.nl-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--white);
  border-radius: var(--radius-full);
  padding: 7px 7px 7px 22px;
}

.nl-input-wrap .btn {
  flex-shrink: 0;
  padding: 13px 24px;
}

.nl-input-wrap input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--ink-700);
}

.nl-note {
  display: block;
  margin-top: 10px;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
}

.nl-success {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  color: var(--rose-600);
  border-radius: var(--radius-full);
  padding: 14px 22px;
  font-weight: 500;
}

@media (max-width: 700px) {
  .newsletter-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 38px 26px;
    gap: 26px;
  }
  .nl-form {
    width: 100%;
    min-width: 0;
  }
}
</style>
