<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PasswordInput from '@/components/PasswordInput.vue'
import { useAuthStore } from '@/store/auth'
import { STORE } from '@/config'

const auth = useAuthStore()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const ready = ref(false)

onMounted(async () => {
  if (!auth.user) await auth.init()
  ready.value = true
})

async function submit() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  const res = await auth.updatePassword(password.value)
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  router.push('/login')
}
</script>

<template>
  <section class="auth">
    <div class="container auth-card auth-card-small">
      <div class="auth-only">
        <span class="brand-script">{{ STORE.name }}</span>
        <h1 class="auth-title">Restablece tu contraseña</h1>
        <p class="auth-sub">Ingresa y confirma tu nueva contraseña.</p>

        <form @submit.prevent="submit">
          <PasswordInput v-model="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" />
          <PasswordInput v-model="confirm" label="Confirmar contraseña" />

          <p v-if="error" class="form-error">{{ error }}</p>

          <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </form>

        <p class="auth-switch">
          <router-link to="/login">Volver al inicio de sesión</router-link>
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

.auth-card-small {
  max-width: 460px;
}

.auth-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.auth-only {
  padding: 48px 46px;
}

.brand-script {
  display: block;
  font-family: var(--font-script);
  font-size: 40px;
  font-weight: 700;
  color: var(--rose-600);
  text-align: center;
  margin-bottom: 16px;
}

.auth-title {
  font-family: var(--font-display);
  font-size: 30px;
  color: var(--ink-900);
  text-align: center;
}

.auth-sub {
  color: var(--ink-500);
  margin: 8px 0 26px;
  font-size: 15px;
  text-align: center;
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

@media (max-width: 600px) {
  .auth-only {
    padding: 32px 24px;
  }
}
</style>
