<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import { STORE } from '@/config'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  name: '',
  lastname: '',
  phone: '',
  email: '',
  password: '',
  saveCarts: true,
  notifications: true,
})
const error = ref('')
const info = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  info.value = ''
  loading.value = true
  const res = await auth.signUp(form.value)
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  if (res.user && !auth.user) {
    info.value = 'Revisa tu correo para confirmar tu cuenta.'
    return
  }
  router.push('/cuenta')
}

function google() {
  loading.value = true
  auth.signInWithGoogle()
}
</script>

<template>
  <section class="auth">
    <div class="container auth-card">
      <div class="auth-side">
        <span class="brand-script">{{ STORE.name }}</span>
        <p class="auth-side-title">Crea tu cuenta</p>
        <p class="auth-side-text">Guarda tu carrito, recibe cupones y descuentos solo para ti.</p>
      </div>

      <div class="auth-form">
        <h1 class="auth-title">Registrarse</h1>
        <p class="auth-sub">Completa tus datos para empezar.</p>

        <form @submit.prevent="submit">
          <div class="row">
            <label class="field">
              <span>Nombre</span>
              <input v-model="form.name" type="text" placeholder="Nombre" required />
            </label>
            <label class="field">
              <span>Apellido</span>
              <input v-model="form.lastname" type="text" placeholder="Apellido" required />
            </label>
          </div>

          <label class="field">
            <span>Teléfono</span>
            <input v-model="form.phone" type="tel" placeholder="+58 4XX XXX XXXX" required />
          </label>

          <label class="field">
            <span>Correo</span>
            <input v-model="form.email" type="email" placeholder="tu@correo.com" required />
          </label>

          <label class="field">
            <span>Contraseña</span>
            <input v-model="form.password" type="password" placeholder="Mínimo 8 caracteres" required minlength="8" />
          </label>

          <div class="prefs">
            <p class="prefs-title">Preferencias</p>
            <label class="check">
              <input v-model="form.saveCarts" type="checkbox" />
              <span>Guardar mi carrito para compras futuras</span>
            </label>
            <label class="check">
              <input v-model="form.notifications" type="checkbox" />
              <span>Recibir notificaciones de descuentos y cupones</span>
            </label>
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>
          <p v-if="info" class="form-info">{{ info }}</p>

          <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="divider"><span>o</span></div>

        <button class="btn btn-google" :disabled="loading" @click="google">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Registrarse con Google
        </button>

        <p class="auth-switch">
          ¿Ya tienes cuenta?
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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
  width: 100%;
}

.field input:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.prefs {
  background: var(--rose-50);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  margin-bottom: 18px;
}

.prefs-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-900);
  margin-bottom: 10px;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: var(--ink-700);
  margin-bottom: 8px;
  cursor: pointer;
}

.check input {
  width: 17px;
  height: 17px;
  accent-color: var(--rose-600);
}

.form-error {
  color: #c0392b;
  font-size: 13px;
  margin-bottom: 14px;
}

.form-info {
  color: var(--rose-600);
  font-size: 13px;
  margin-bottom: 14px;
}

.auth-submit {
  width: 100%;
  padding: 14px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--ink-400);
  font-size: 13px;
  margin: 22px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.btn-google {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink-700);
  padding: 13px;
  font-weight: 500;
}

.btn-google:hover {
  border-color: var(--rose-300);
  background: var(--rose-50);
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
  .row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
