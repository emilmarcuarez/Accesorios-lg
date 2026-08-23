<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  const res = await auth.signIn(email.value, password.value)
  loading.value = false
  if (res.error) {
    error.value = res.error
    return
  }
  if (!auth.isAdmin) {
    await auth.signOut()
    error.value = 'Esta cuenta no tiene permisos de administrador.'
    return
  }
  router.push('/admin/dashboard')
}
</script>

<template>
  <main class="admin-login">
    <div class="admin-card">
      <div class="admin-logo">
        <span class="admin-dot"></span>
      </div>
      <h1 class="admin-title">Panel de administración</h1>
      <p class="admin-sub">Acceso restringido para el equipo Detallitos.</p>

      <p v-if="route.query.denied" class="form-banner">Necesitas sesión de administrador.</p>

      <form @submit.prevent="submit">
        <label class="field">
          <span>Correo</span>
          <input v-model="email" type="email" placeholder="admin@detallitos.com" required />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary admin-submit" :disabled="loading">
          {{ loading ? 'Verificando...' : 'Entrar al panel' }}
        </button>
      </form>

      <router-link to="/" class="back-home">Volver a la tienda</router-link>
    </div>
  </main>
</template>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a1f24, #3d2a31);
  padding: 24px;
}

.admin-card {
  width: 100%;
  max-width: 400px;
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 40px 36px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.admin-logo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--rose-gradient);
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--white);
}

.admin-title {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-900);
}

.admin-sub {
  color: var(--ink-500);
  font-size: 14px;
  margin: 6px 0 24px;
}

.form-banner {
  background: var(--rose-50);
  color: #c0392b;
  border: 1px solid var(--rose-200);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  text-align: left;
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

.admin-submit {
  width: 100%;
  padding: 14px;
}

.back-home {
  display: inline-block;
  margin-top: 18px;
  font-size: 13px;
  color: var(--ink-400);
}

.back-home:hover {
  color: var(--rose-600);
}
</style>
