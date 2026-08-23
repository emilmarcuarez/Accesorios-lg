<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import { STORE } from '@/config'
import PasswordInput from '@/components/PasswordInput.vue'

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

          <PasswordInput v-model="form.password" label="Contraseña" placeholder="Mínimo 8 caracteres" />

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
