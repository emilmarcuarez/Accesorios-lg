<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  name: auth.profile?.name || '',
  lastname: auth.profile?.lastname || '',
  phone: auth.profile?.phone || '',
  saveCarts: auth.profile?.save_carts ?? true,
  notifications: auth.profile?.notifications ?? true,
})
const saved = ref(false)

async function save() {
  saved.value = false
  await auth.updateProfile(form.value)
  saved.value = true
}

async function logout() {
  await auth.signOut()
  router.push('/')
}
</script>

<template>
  <main class="account">
    <section class="account-hero">
      <div class="container">
        <span class="eyebrow">Mi cuenta</span>
        <h1 class="account-title">Hola, {{ auth.fullName || 'Detallita' }}</h1>
        <p class="account-sub">{{ auth.user?.email }}</p>
      </div>
    </section>

    <section class="container account-body">
      <div class="account-info">
        <p class="account-label">Correo</p>
        <p class="account-value">{{ auth.user?.email }}</p>
        <p class="account-label">Miembro</p>
        <p class="account-value">Registrada</p>
        <button class="btn btn-ghost" @click="saved = false" style="margin-top: 8px"></button>
      </div>

      <div class="account-form">
        <h2 class="form-title">Mis datos</h2>
        <label class="field">
          <span>Nombre</span>
          <input v-model="form.name" type="text" />
        </label>
        <label class="field">
          <span>Apellido</span>
          <input v-model="form.lastname" type="text" />
        </label>
        <label class="field">
          <span>Teléfono</span>
          <input v-model="form.phone" type="tel" />
        </label>

        <h2 class="form-title">Preferencias</h2>
        <label class="check">
          <input v-model="form.saveCarts" type="checkbox" />
          <span>Guardar mi carrito para compras futuras</span>
        </label>
        <label class="check">
          <input v-model="form.notifications" type="checkbox" />
          <span>Recibir notificaciones de descuentos y cupones</span>
        </label>

        <p v-if="saved" class="form-success">Guardado correctamente.</p>

        <div class="actions">
          <button class="btn btn-primary" @click="save">Guardar cambios</button>
          <button class="btn btn-outline" @click="logout">
            <AppIcon name="close" :size="16" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.account {
  background: linear-gradient(120deg, #fff8f6, #fbe9ee);
  min-height: 70vh;
}

.account-hero {
  background: var(--rose-gradient);
  color: var(--white);
  text-align: center;
  padding: 54px 0;
}

.account-hero .eyebrow {
  color: rgba(255, 255, 255, 0.9);
}

.account-title {
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 52px);
  font-weight: 600;
}

.account-sub {
  opacity: 0.95;
  margin-top: 6px;
}

.account-body {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 40px;
  padding-top: 50px;
  padding-bottom: 60px;
}

.account-info {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 30px 30px;
}

.account-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-400);
  margin-top: 14px;
}

.account-value {
  font-weight: 600;
  color: var(--ink-900);
}

.account-form {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.form-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--ink-900);
  margin-bottom: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
}

.field input:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--ink-700);
  margin-bottom: 12px;
  cursor: pointer;
}

.check input {
  width: 17px;
  height: 17px;
  accent-color: var(--rose-600);
}

.form-success {
  color: var(--rose-600);
  font-weight: 500;
  font-size: 14px;
  margin: 10px 0;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}

@media (max-width: 800px) {
  .account-body {
    grid-template-columns: 1fr;
  }
}
</style>
