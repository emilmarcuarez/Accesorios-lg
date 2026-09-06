<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuthStore } from '@/store/auth'
import {
  listUsers,
  updateUserRole,
  adminChangePassword,
  sendPasswordResetEmail,
  updateUserProfile,
} from '@/lib/db'
import { supabase } from '@/lib/supabase'

const auth = useAuthStore()

const users = ref([])
const loading = ref(true)
const dataSource = ref('rpc')
const searchQuery = ref('')
const roleFilter = ref('all') // 'all' | 'customer' | 'admin'
const actionLoading = ref({})
const toast = ref({ show: false, message: '', type: 'success' })

// Modales
const showPasswordModal = ref(false)
const selectedUser = ref(null)
const newPassword = ref('')
const confirmPassword = ref('')
const showPasswordText = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')

const showEditModal = ref(false)
const editForm = ref({ name: '', lastname: '', phone: '', role: 'customer' })
const editSaving = ref(false)
const editError = ref('')

const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  lastname: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
})
const createSaving = ref(false)
const createError = ref('')

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

async function load() {
  loading.value = true
  const res = await listUsers()
  users.value = res.data || []
  dataSource.value = res.source || 'rpc'
  loading.value = false
}

onMounted(load)

// Métricas
const totalCount = computed(() => users.value.length)
const adminCount = computed(() => users.value.filter((u) => u.role === 'admin').length)
const customerCount = computed(() => users.value.filter((u) => u.role !== 'admin').length)
const newThisMonthCount = computed(() => {
  const now = new Date()
  return users.value.filter((u) => {
    if (!u.created_at) return false
    const d = new Date(u.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

// Filtrado
const filteredUsers = computed(() => {
  let list = users.value || []

  if (roleFilter.value === 'admin') {
    list = list.filter((u) => u.role === 'admin')
  } else if (roleFilter.value === 'customer') {
    list = list.filter((u) => u.role !== 'admin')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((u) => {
      const full = `${u.name || ''} ${u.lastname || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      const phone = (u.phone || '').toLowerCase()
      return full.includes(q) || email.includes(q) || phone.includes(q)
    })
  }

  return list
})

function getInitials(user) {
  const n = (user.name || '').trim()
  const l = (user.lastname || '').trim()
  if (n && l) return `${n[0]}${l[0]}`.toUpperCase()
  if (n) return n.slice(0, 2).toUpperCase()
  if (user.email && user.email !== '—') return user.email.slice(0, 2).toUpperCase()
  return 'US'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// -------------------------------------------------------------
// CAMBIO DE ROL
// -------------------------------------------------------------
async function toggleAdminRole(user) {
  const isCurrentAdmin = user.role === 'admin'
  const newRole = isCurrentAdmin ? 'customer' : 'admin'

  if (user.id === auth.user?.id && isCurrentAdmin) {
    if (!confirm('¿Estás seguro de quitarte los permisos de administrador a ti mismo? Perderás acceso a este panel.')) {
      return
    }
  } else {
    const actionText = isCurrentAdmin
      ? `¿Quitar permisos de administrador a ${user.name || user.email}?`
      : `¿Convertir a ${user.name || user.email} en Administrador con acceso total?`
    if (!confirm(actionText)) return
  }

  actionLoading.value[user.id] = true
  const res = await updateUserRole(user.id, newRole)
  actionLoading.value[user.id] = false

  if (res.error) {
    showToast(`Error: ${res.error}`, 'error')
  } else {
    user.role = newRole
    showToast(
      newRole === 'admin'
        ? `¡${user.name || user.email} ahora es Administrador!`
        : `Permisos de admin retirados a ${user.name || user.email}`,
      'success',
    )
  }
}

// -------------------------------------------------------------
// MODAL CONTRASEÑA
// -------------------------------------------------------------
function openPasswordModal(user) {
  selectedUser.value = user
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  showPasswordText.value = false
  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  selectedUser.value = null
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
}

async function handleSavePassword() {
  passwordError.value = ''
  if (!newPassword.value) {
    passwordError.value = 'Por favor ingresa una nueva contraseña.'
    return
  }
  if (newPassword.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las contraseñas no coinciden.'
    return
  }

  passwordSaving.value = true
  const res = await adminChangePassword(selectedUser.value.id, newPassword.value)
  passwordSaving.value = false

  if (res.error) {
    passwordError.value = res.error
  } else {
    showToast(`Contraseña actualizada con éxito para ${selectedUser.value.email}`)
    closePasswordModal()
  }
}

async function handleSendResetEmail() {
  if (!selectedUser.value?.email || selectedUser.value.email === '—') {
    passwordError.value = 'Este usuario no tiene un email válido registrado.'
    return
  }

  passwordSaving.value = true
  const res = await sendPasswordResetEmail(selectedUser.value.email)
  passwordSaving.value = false

  if (res.error) {
    passwordError.value = res.error
  } else {
    showToast(`Enlace de restablecimiento enviado a ${selectedUser.value.email}`)
    closePasswordModal()
  }
}

// -------------------------------------------------------------
// MODAL EDITAR PERFIL
// -------------------------------------------------------------
function openEditModal(user) {
  selectedUser.value = user
  editForm.value = {
    name: user.name || '',
    lastname: user.lastname || '',
    phone: user.phone || '',
    role: user.role || 'customer',
  }
  editError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  selectedUser.value = null
  editError.value = ''
}

async function handleSaveProfile() {
  editError.value = ''
  editSaving.value = true

  const patch = {
    name: editForm.value.name.trim(),
    lastname: editForm.value.lastname.trim(),
    phone: editForm.value.phone.trim(),
    role: editForm.value.role,
  }

  const res = await updateUserProfile(selectedUser.value.id, patch)
  editSaving.value = false

  if (res.error) {
    editError.value = res.error
  } else {
    selectedUser.value.name = patch.name
    selectedUser.value.lastname = patch.lastname
    selectedUser.value.phone = patch.phone
    selectedUser.value.role = patch.role
    showToast('Datos de usuario actualizados correctamente')
    closeEditModal()
  }
}

// -------------------------------------------------------------
// MODAL CREAR USUARIO
// -------------------------------------------------------------
function openCreateModal() {
  createForm.value = {
    name: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  }
  createError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  createError.value = ''
}

async function handleCreateUser() {
  createError.value = ''
  if (!createForm.value.email || !createForm.value.email.includes('@')) {
    createError.value = 'Ingresa un correo electrónico válido.'
    return
  }
  if (!createForm.value.password || createForm.value.password.length < 6) {
    createError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  createSaving.value = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: createForm.value.email.trim(),
      password: createForm.value.password,
      options: {
        data: {
          name: createForm.value.name.trim(),
          lastname: createForm.value.lastname.trim(),
          phone: createForm.value.phone.trim(),
        },
      },
    })

    if (error) {
      createError.value = error.message
      createSaving.value = false
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          name: createForm.value.name.trim(),
          lastname: createForm.value.lastname.trim(),
          phone: createForm.value.phone.trim(),
          email: createForm.value.email.trim(),
          role: createForm.value.role,
        },
        { onConflict: 'id' },
      )
    }

    createSaving.value = false
    showToast(`Usuario ${createForm.value.email} creado con éxito`)
    closeCreateModal()
    await load()
  } catch (err) {
    createSaving.value = false
    createError.value = err.message || 'Error al crear el usuario'
  }
}

</script>

<template>
  <div class="admin-page-wrap">
    <!-- Toast de Notificación -->
    <transition name="toast">
      <div v-if="toast.show" class="toast-banner" :class="toast.type">
        <AppIcon :name="toast.type === 'success' ? 'check' : 'close'" :size="16" />
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Toolbar Superior -->
    <div class="admin-toolbar">
      <div>
        <h2 class="admin-title">Gestión de Usuarios</h2>
        <span class="muted">Visualiza, asigna roles y administra contraseñas de cuentas</span>
      </div>
      <div class="toolbar-actions">
        <button class="admin-btn" @click="openCreateModal">
          <AppIcon name="plus" :size="16" />
          <span>Nuevo usuario</span>
        </button>
      </div>
    </div>

    <!-- Métricas Clave -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon-wrap rose">
          <AppIcon name="user" :size="22" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Usuarios</span>
          <strong class="metric-val">{{ totalCount }}</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-wrap amber">
          <AppIcon name="shield" :size="22" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Administradores</span>
          <strong class="metric-val">{{ adminCount }}</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-wrap blue">
          <AppIcon name="bag" :size="22" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Clientes</span>
          <strong class="metric-val">{{ customerCount }}</strong>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon-wrap green">
          <AppIcon name="sparkles" :size="22" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Nuevos este mes</span>
          <strong class="metric-val">{{ newThisMonthCount }}</strong>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Buscador -->
    <div class="filter-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: roleFilter === 'all' }"
          @click="roleFilter = 'all'"
        >
          Todos ({{ totalCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: roleFilter === 'customer' }"
          @click="roleFilter = 'customer'"
        >
          Clientes ({{ customerCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: roleFilter === 'admin' }"
          @click="roleFilter = 'admin'"
        >
          Administradores ({{ adminCount }})
        </button>
      </div>

      <div class="search-box">
        <AppIcon name="search" :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          <AppIcon name="close" :size="14" />
        </button>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando usuarios registrados...</p>
    </div>

    <!-- Lista Vacía -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <div class="empty-icon">
        <AppIcon name="user" :size="40" />
      </div>
      <h3>No se encontraron usuarios</h3>
      <p class="muted">Prueba cambiando los filtros o el término de búsqueda.</p>
    </div>

    <!-- Tabla de Usuarios -->
    <div v-else class="users-table-card">
      <div class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Registro</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              :class="{ 'highlight-self': user.id === auth.user?.id }"
            >
              <!-- Info Usuario -->
              <td>
                <div class="user-cell">
                  <div class="avatar" :class="{ 'avatar-admin': user.role === 'admin' }">
                    {{ getInitials(user) }}
                  </div>
                  <div class="user-details">
                    <div class="user-name-line">
                      <span class="user-fullname">
                        {{ [user.name, user.lastname].filter(Boolean).join(' ') || 'Sin nombre registrado' }}
                      </span>
                      <span v-if="user.id === auth.user?.id" class="self-tag">Tú</span>
                    </div>
                    <span class="user-email">{{ user.email || '—' }}</span>
                  </div>
                </div>
              </td>

              <!-- Contacto -->
              <td>
                <div class="contact-cell">
                  <span v-if="user.phone" class="phone-link">
                    <AppIcon name="phone" :size="13" />
                    <a
                      :href="`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`"
                      target="_blank"
                      rel="noopener"
                      class="phone-text"
                      title="Abrir en WhatsApp"
                    >
                      {{ user.phone }}
                    </a>
                  </span>
                  <span v-else class="muted-dash">—</span>
                </div>
              </td>

              <!-- Rol -->
              <td>
                <span
                  class="role-badge"
                  :class="user.role === 'admin' ? 'role-admin' : 'role-customer'"
                >
                  <AppIcon
                    :name="user.role === 'admin' ? 'shield' : 'user'"
                    :size="13"
                  />
                  {{ user.role === 'admin' ? 'Administrador' : 'Cliente' }}
                </span>
              </td>

              <!-- Fecha de Registro -->
              <td>
                <div class="date-cell">
                  <span class="date-text">{{ formatDate(user.created_at) }}</span>
                  <span v-if="user.last_sign_in_at" class="last-login" title="Último acceso">
                    Último: {{ formatDate(user.last_sign_in_at) }}
                  </span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="text-right">
                <div class="actions-group">
                  <!-- Cambiar Rol (Hacer Admin / Quitar Admin) -->
                  <button
                    class="action-btn"
                    :class="user.role === 'admin' ? 'btn-demote' : 'btn-promote'"
                    :title="user.role === 'admin' ? 'Quitar privilegios de administrador' : 'Hacer Administrador'"
                    :disabled="actionLoading[user.id]"
                    @click="toggleAdminRole(user)"
                  >
                    <AppIcon :name="user.role === 'admin' ? 'shield' : 'sparkles'" :size="15" />
                    <span>{{ user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin' }}</span>
                  </button>

                  <!-- Cambiar Contraseña -->
                  <button
                    class="action-btn icon-only"
                    title="Cambiar contraseña o enviar recuperación"
                    @click="openPasswordModal(user)"
                  >
                    <AppIcon name="edit" :size="15" />
                  </button>

                  <!-- Editar Datos Básicos -->
                  <button
                    class="action-btn icon-only"
                    title="Editar datos de contacto"
                    @click="openEditModal(user)"
                  >
                    <AppIcon name="user" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: CAMBIAR CONTRASEÑA -->
    <!-- ============================================================ -->
    <div v-if="showPasswordModal" class="modal-backdrop" @click.self="closePasswordModal">
      <div class="modal-dialog">
        <div class="modal-head">
          <div class="modal-head-title">
            <AppIcon name="shield" :size="20" class="head-icon" />
            <div>
              <h3>Cambiar Contraseña</h3>
              <span class="muted">{{ selectedUser?.name || '' }} ({{ selectedUser?.email }})</span>
            </div>
          </div>
          <button class="modal-close" @click="closePasswordModal">
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="passwordError" class="modal-error">
            <AppIcon name="close" :size="16" />
            <span>{{ passwordError }}</span>
          </div>

          <!-- Opción 1: Establecer contraseña directa -->
          <div class="option-block">
            <h4 class="option-title">Asignar nueva contraseña directamente</h4>
            <p class="option-desc">
              Define una nueva clave que el usuario podrá usar inmediatamente para iniciar sesión.
            </p>

            <div class="form-group">
              <label class="form-label">Nueva Contraseña</label>
              <div class="password-input-wrap">
                <input
                  v-model="newPassword"
                  :type="showPasswordText ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  class="pwd-toggle"
                  @click="showPasswordText = !showPasswordText"
                >
                  <AppIcon :name="showPasswordText ? 'eyeOff' : 'eye'" :size="16" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Confirmar Contraseña</label>
              <input
                v-model="confirmPassword"
                :type="showPasswordText ? 'text' : 'password'"
                class="form-input"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <button
              class="admin-btn full-w"
              :disabled="passwordSaving || !newPassword"
              @click="handleSavePassword"
            >
              <span v-if="passwordSaving">Guardando...</span>
              <span v-else>Actualizar Contraseña</span>
            </button>
          </div>

          <div class="divider">
            <span>O también</span>
          </div>

          <!-- Opción 2: Enviar link por email -->
          <div class="option-block secondary">
            <h4 class="option-title">Enviar correo de restablecimiento</h4>
            <p class="option-desc">
              Le enviará un enlace seguro a <strong>{{ selectedUser?.email }}</strong> para que ingrese su propia contraseña.
            </p>
            <button
              class="btn-secondary-custom full-w"
              :disabled="passwordSaving"
              @click="handleSendResetEmail"
            >
              <AppIcon name="mail" :size="16" />
              <span>Enviar enlace al correo</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: EDITAR USUARIO -->
    <!-- ============================================================ -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-dialog">
        <div class="modal-head">
          <div class="modal-head-title">
            <AppIcon name="edit" :size="20" class="head-icon" />
            <div>
              <h3>Editar Información</h3>
              <span class="muted">{{ selectedUser?.email }}</span>
            </div>
          </div>
          <button class="modal-close" @click="closeEditModal">
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="editError" class="modal-error">
            <AppIcon name="close" :size="16" />
            <span>{{ editError }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input v-model="editForm.name" type="text" class="form-input" placeholder="Nombre" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido</label>
              <input v-model="editForm.lastname" type="text" class="form-input" placeholder="Apellido" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Teléfono / WhatsApp</label>
            <input
              v-model="editForm.phone"
              type="text"
              class="form-input"
              placeholder="+58 412 1234567"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Rol del Usuario</label>
            <select v-model="editForm.role" class="form-select">
              <option value="customer">Cliente</option>
              <option value="admin">Administrador (Acceso al panel)</option>
            </select>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeEditModal">Cancelar</button>
            <button class="admin-btn" :disabled="editSaving" @click="handleSaveProfile">
              <span v-if="editSaving">Guardando...</span>
              <span v-else>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL: CREAR USUARIO -->
    <!-- ============================================================ -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-dialog">
        <div class="modal-head">
          <div class="modal-head-title">
            <AppIcon name="plus" :size="20" class="head-icon" />
            <div>
              <h3>Crear Nuevo Usuario</h3>
              <span class="muted">Registra una nueva cuenta de cliente o administrador</span>
            </div>
          </div>
          <button class="modal-close" @click="closeCreateModal">
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="createError" class="modal-error">
            <AppIcon name="close" :size="16" />
            <span>{{ createError }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input v-model="createForm.name" type="text" class="form-input" placeholder="Ej: María" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellido</label>
              <input v-model="createForm.lastname" type="text" class="form-input" placeholder="Ej: Pérez" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico *</label>
            <input
              v-model="createForm.email"
              type="email"
              class="form-input"
              placeholder="cliente@ejemplo.com"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input
                v-model="createForm.phone"
                type="text"
                class="form-input"
                placeholder="+58 412 1234567"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Rol</label>
              <select v-model="createForm.role" class="form-select">
                <option value="customer">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña Inicial *</label>
            <input
              v-model="createForm.password"
              type="password"
              class="form-input"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="closeCreateModal">Cancelar</button>
            <button class="admin-btn" :disabled="createSaving" @click="handleCreateUser">
              <span v-if="createSaving">Creando...</span>
              <span v-else>Crear Cuenta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Toast */
.toast-banner {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.toast-banner.success {
  background: #10b981;
  color: white;
}
.toast-banner.error {
  background: #ef4444;
  color: white;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Toolbar */
.admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.admin-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f1418;
  margin: 0 0 4px;
}
.muted {
  font-size: 13px;
  color: #8b757e;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--rose-gradient, linear-gradient(135deg, #d85a7f 0%, #b83259 100%));
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(184, 50, 89, 0.25);
}
.admin-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}
.admin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.admin-btn.full-w {
  width: 100%;
}
.btn-secondary-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ffffff;
  color: #4a343d;
  border: 1px solid #ebd9df;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary-custom:hover:not(:disabled) {
  background: #fdf5f7;
  border-color: #d85a7f;
  color: #b83259;
}
.btn-secondary-custom.full-w {
  width: 100%;
}

/* Info alert */
.info-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff8eb;
  border: 1px solid #fbd38d;
  color: #8d5b12;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 13.5px;
}
.info-alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.alert-btn {
  background: #8d5b12;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}
.metric-card {
  background: #ffffff;
  border: 1px solid #f0e2e6;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.metric-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.metric-icon-wrap.rose {
  background: #fdf2f4;
  color: #d85a7f;
}
.metric-icon-wrap.amber {
  background: #fef8eb;
  color: #d97706;
}
.metric-icon-wrap.blue {
  background: #eff6ff;
  color: #3b82f6;
}
.metric-icon-wrap.green {
  background: #ecfdf5;
  color: #10b981;
}
.metric-info {
  display: flex;
  flex-direction: column;
}
.metric-label {
  font-size: 12px;
  color: #8b757e;
  font-weight: 500;
}
.metric-val {
  font-size: 22px;
  font-weight: 700;
  color: #2a2024;
}

/* Filter bar */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #f0e2e6;
  border-radius: 14px;
  padding: 12px 18px;
}
.tabs {
  display: flex;
  gap: 6px;
}
.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #7a6870;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  background: #fdf2f4;
  color: #b83259;
}
.tab-btn.active {
  background: #fce7ec;
  color: #b83259;
  font-weight: 600;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 280px;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #a8949d;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border-radius: 10px;
  border: 1px solid #ebd9df;
  font-size: 13.5px;
  color: #33242a;
  background: #faf6f7;
  outline: none;
  transition: all 0.2s;
}
.search-input:focus {
  border-color: #d85a7f;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(216, 90, 127, 0.12);
}
.clear-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #a8949d;
  cursor: pointer;
  padding: 4px;
}

/* Loading & Empty */
.loading-state,
.empty-state {
  background: #ffffff;
  border: 1px solid #f0e2e6;
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #fce7ec;
  border-top-color: #d85a7f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fdf2f4;
  color: #d85a7f;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.empty-state h3 {
  margin: 0 0 6px;
  color: #2a2024;
}

/* Table */
.users-table-card {
  background: #ffffff;
  border: 1px solid #f0e2e6;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.table-responsive {
  overflow-x: auto;
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13.5px;
}
.users-table th {
  padding: 14px 20px;
  background: #faf5f7;
  color: #856f77;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f0e2e6;
}
.users-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f7eef1;
  color: #3f2d34;
  vertical-align: middle;
}
.users-table tbody tr:hover {
  background: #fffdfd;
}
.users-table tbody tr.highlight-self {
  background: #fef7f9;
}
.text-right {
  text-align: right;
}

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e9d5dc 0%, #d8bcc6 100%);
  color: #5c434e;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-admin {
  background: linear-gradient(135deg, #d85a7f 0%, #872342 100%);
  color: #ffffff;
}
.user-details {
  display: flex;
  flex-direction: column;
}
.user-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-fullname {
  font-weight: 600;
  color: #23161c;
}
.self-tag {
  background: #d85a7f;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  text-transform: uppercase;
}
.user-email {
  font-size: 12.5px;
  color: #806c74;
}

/* Contact cell */
.contact-cell {
  display: flex;
  align-items: center;
}
.phone-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
}
.phone-text {
  color: #1e6e4f;
  text-decoration: none;
  font-weight: 500;
}
.phone-text:hover {
  text-decoration: underline;
}
.muted-dash {
  color: #bfaab2;
}

/* Role badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}
.role-admin {
  background: #fdf2f4;
  color: #b83259;
  border: 1px solid #fbd0da;
}
.role-customer {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

/* Date cell */
.date-cell {
  display: flex;
  flex-direction: column;
}
.date-text {
  font-size: 13px;
  color: #443239;
}
.last-login {
  font-size: 11px;
  color: #9c8890;
}

/* Action buttons */
.actions-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn.icon-only {
  padding: 7px;
  color: #7a6870;
  background: #faf5f7;
  border-color: #ebd9df;
}
.action-btn.icon-only:hover {
  background: #fdf2f4;
  color: #b83259;
  border-color: #d85a7f;
}
.btn-promote {
  background: #fdf2f4;
  color: #b83259;
  border-color: #fbd0da;
}
.btn-promote:hover:not(:disabled) {
  background: #b83259;
  color: white;
}
.btn-demote {
  background: #f9fafb;
  color: #6b7280;
  border-color: #e5e7eb;
}
.btn-demote:hover:not(:disabled) {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 17, 21, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-dialog {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-dialog.modal-large {
  max-width: 680px;
}
@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0e2e6;
  background: #faf5f7;
}
.modal-head-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.head-icon {
  color: #b83259;
}
.modal-head-title h3 {
  margin: 0;
  font-size: 17px;
  color: #23161c;
}
.modal-close {
  background: transparent;
  border: none;
  color: #8b757e;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.modal-close:hover {
  background: #ebd9df;
  color: #23161c;
}
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

/* Option block in password modal */
.option-block {
  background: #faf6f7;
  border: 1px solid #ebd9df;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option-block.secondary {
  background: #f9fafb;
  border-color: #e5e7eb;
}
.option-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #23161c;
}
.option-desc {
  margin: 0;
  font-size: 12.5px;
  color: #7a6870;
  line-height: 1.4;
}
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #a8949d;
  font-size: 12px;
  margin: -4px 0;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ebd9df;
}
.divider span {
  padding: 0 10px;
}

/* Form inputs */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #4a3740;
}
.form-input,
.form-select {
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid #ebd9df;
  font-size: 13.5px;
  color: #2a1e23;
  outline: none;
  background: #ffffff;
}
.form-input:focus,
.form-select:focus {
  border-color: #d85a7f;
  box-shadow: 0 0 0 3px rgba(216, 90, 127, 0.12);
}
.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.password-input-wrap .form-input {
  width: 100%;
  padding-right: 38px;
}
.pwd-toggle {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #8b757e;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.modal-actions.space-between {
  justify-content: space-between;
  align-items: center;
}
.btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  padding: 9px 16px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #e5e7eb;
}

/* Code box */
.sql-intro {
  margin: 0;
  font-size: 13.5px;
  color: #443239;
  line-height: 1.5;
}
.code-box {
  background: #1f1418;
  border-radius: 10px;
  padding: 14px;
  max-height: 280px;
  overflow-y: auto;
}
.code-box pre {
  margin: 0;
}
.code-box code {
  color: #fce7ec;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .admin-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-actions {
    flex-direction: column;
  }
  .toolbar-actions button {
    width: 100%;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    min-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .modal-actions,
  .modal-actions.space-between {
    flex-direction: column-reverse;
    gap: 8px;
    align-items: stretch;
  }
  .modal-actions button,
  .btn-cancel,
  .btn-save-modal {
    width: 100%;
    justify-content: center;
  }
  .actions-group {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
