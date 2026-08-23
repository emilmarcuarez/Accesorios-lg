<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import { STORE } from '@/config'

const auth = useAuthStore()
const email = ref('')
const error = ref('')
const sent = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  const res = await auth.resetPassword(email.value)
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  sent.value = true
}
</script>

<template>
  <section class="auth">
    <div class="container auth-card">
      <div class="auth-side">
        <span class="brand-script">{{ STORE.name }}</span>
        <p class="auth-side-title">Recupera tu cuenta</p>
        <p class="auth-side-text">Te enviaremos un enlace para restablecer tu contraseña.</p>
      </div>

      <div class="auth-form">
        <h1 class="auth-title">¿Olvidaste tu contraseña?</h1>
        <p class="auth-sub">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>

        <div v-if="sent" class="sent-box">
          <AppIcon name="check" :size="34" class="sent-icon" />
          <p class="sent-title">Revisa tu correo</p>
          <p class="sent-text">Te enviamos un enlace a <strong>{{ email }}</strong> para restablecer tu contraseña.</p>
          <router-link to="/login" class="btn btn-primary">Volver al inicio de sesión</router-link>
        </div>

        <form v-else @submit.prevent="submit">
          <label class="field">
            <span>Correo</span>
            <input v-model="email" type="email" placeholder="tu@correo.com" required />
          </label>
          <p v-if="error" class="form-error">{{ error }}</p>
          <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
            {{ loading ? 'Enviando...' : 'Enviar enlace' }}
          </button>
        </form>

        <p class="auth-switch">
          ¿Recordaste tu contraseña?
          <router-link to="/login">Inicia sesión</router-link>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth {
  padding: 60px 0;
  background: linear-gradient(120deg, #fff8f6, #fbe9ee);
}

.auth-card {
  max-width: 960px;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  overflow: hidden;
}

.auth-side {
  background: var(--rose-gradient);
  color: var(--white);
  padding: 60px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.brand-script {
  font-family: var(--font-script);
  font-size: 40px;
  font-weight: 700;
}

.auth-side-title {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.1;
}

.auth-side-text {
  opacity: 0.92;
  font-size: 15px;
  max-width: 320px;
}

.auth-form {
  padding: 54px 48px;
}

.auth-title {
  font-family: var(--font-display);
  font-size: 32px;
  color: var(--ink-900);
}

.auth-sub {
  color: var(--ink-500);
  margin: 6px 0 26px;
  font-size: 15px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
}

.field input:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.form-error {
  color: #c0392b;
  font-size: 13px;
  margin-bottom: 14px;
}

.auth-submit {
  width: 100%;
  padding: 14px;
}

.sent-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}

.sent-icon {
  color: var(--rose-500);
}

.sent-title {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-900);
}

.sent-text {
  color: var(--ink-500);
  font-size: 14px;
  max-width: 360px;
}

.auth-switch {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--ink-500);
}

.auth-switch a {
  color: var(--rose-600);
  font-weight: 600;
}

@media (max-width: 800px) {
  .auth-card {
    grid-template-columns: 1fr;
  }
  .auth-side {
    padding: 36px 28px;
  }
  .auth-form {
    padding: 36px 28px;
  }
}
</style>
