<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AppIcon from '@/components/AppIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)

// Cerrar el drawer automáticamente al cambiar de ruta
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  }
)

const menu = [
  { name: 'dashboard', label: 'Dashboard', icon: 'home', to: '/admin/dashboard' },
  { name: 'products', label: 'Productos', icon: 'bag', to: '/admin/productos' },
  { name: 'categories', label: 'Categorías', icon: 'heart', to: '/admin/categorias' },
  { name: 'coupons', label: 'Cupones', icon: 'gift', to: '/admin/cupones' },
  { name: 'discounts', label: 'Descuentos', icon: 'truck', to: '/admin/descuentos' },
  { name: 'orders', label: 'Pedidos / Ventas', icon: 'search', to: '/admin/pedidos' },
  { name: 'banners', label: 'Banners Inicio', icon: 'sparkles', to: '/admin/banners' },
  { name: 'gallery', label: 'Galería', icon: 'instagram', to: '/admin/galeria' },
  { name: 'users', label: 'Usuarios', icon: 'user', to: '/admin/usuarios' },
  { name: 'settings', label: 'Ajustes', icon: 'shield', to: '/admin/ajustes' },
]

async function logout() {
  await auth.signOut()
  router.push('/admin-login')
}
</script>

<template>
  <div class="admin-shell">
    <!-- Barra superior para móviles y tablets -->
    <header class="admin-mobile-bar">
      <button
        class="mobile-menu-btn"
        aria-label="Abrir navegación"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <AppIcon name="menu" :size="22" />
      </button>

      <div class="mobile-brand">
        <img src="/img/logo.png" class="mobile-logo" alt="Detallitos" />
        <span class="mobile-brand-title">Panel Admin</span>
      </div>

      <div class="mobile-actions">
        <router-link to="/" class="mobile-action-link" title="Ver tienda">
          <AppIcon name="bag" :size="18" />
        </router-link>
        <button class="mobile-action-btn" title="Cerrar sesión" @click="logout">
          <AppIcon name="close" :size="18" />
        </button>
      </div>
    </header>

    <!-- Backdrop oscurecedor cuando el menú móvil está abierto -->
    <transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="admin-backdrop"
        @click="mobileMenuOpen = false"
      ></div>
    </transition>

    <!-- Barra lateral (Sidebar en desktop, Drawer deslizable en móvil) -->
    <aside class="admin-side" :class="{ 'drawer-open': mobileMenuOpen }">
      <div class="admin-brand">
        <div class="brand-row">
          <img src="/img/logo.png" class="admin-logo" alt="Detallitos" />
          <button
            class="mobile-close-drawer"
            aria-label="Cerrar menú"
            @click="mobileMenuOpen = false"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </div>
        <span class="admin-brand-sub">Panel Admin</span>
      </div>

      <nav class="admin-nav">
        <router-link
          v-for="item in menu"
          :key="item.name"
          :to="item.to"
          class="admin-link"
          :class="{ active: $route.name === 'admin-' + item.name }"
          @click="mobileMenuOpen = false"
        >
          <AppIcon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="admin-foot">
        <div class="admin-user">
          <span class="admin-user-name">{{ auth.fullName || 'Admin' }}</span>
          <span class="admin-user-mail">{{ auth.user?.email }}</span>
        </div>
        <button class="admin-out" @click="logout">
          <AppIcon name="close" :size="16" />
          Salir
        </button>
        <router-link to="/" class="admin-site" @click="mobileMenuOpen = false">
          Ver tienda &rarr;
        </router-link>
      </div>
    </aside>

    <!-- Contenido principal -->
    <main class="admin-main">
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f7f1f3;
  position: relative;
}

/* Barra superior sólo para móvil */
.admin-mobile-bar {
  display: none;
}

.admin-side {
  width: 250px;
  flex-shrink: 0;
  background: #2a2024;
  color: #f5e9ec;
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.08);
}

.admin-brand {
  padding: 0 6px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-logo {
  height: 42px;
  width: auto;
  object-fit: contain;
}

.mobile-close-drawer {
  display: none;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-close-drawer:hover {
  background: rgba(255, 255, 255, 0.2);
}

.admin-brand-sub {
  display: block;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 20px;
  flex: 1;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.admin-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.admin-link.active {
  background: var(--rose-gradient);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(216, 90, 127, 0.3);
}

.admin-foot {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 16px;
  margin-top: 16px;
}

.admin-user {
  margin-bottom: 12px;
}

.admin-user-name {
  display: block;
  font-weight: 600;
  font-size: 13.5px;
  color: #fff;
}

.admin-user-mail {
  display: block;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-out {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-out:hover {
  background: rgba(239, 68, 68, 0.22);
  color: #fff;
}

.admin-site {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  transition: color 0.2s;
}

.admin-site:hover {
  color: #fff;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-content {
  padding: 28px 32px;
  flex: 1;
}

/* Backdrop */
.admin-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 12, 16, 0.65);
  backdrop-filter: blur(4px);
  z-index: 998;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE DESIGN: PANTALLAS MENORES A 900PX */
@media (max-width: 900px) {
  .admin-shell {
    flex-direction: column;
  }

  /* Barra superior visible en móvil */
  .admin-mobile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #2a2024;
    color: #fff;
    padding: 10px 16px;
    position: sticky;
    top: 0;
    z-index: 500;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    height: 58px;
  }

  .mobile-menu-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-logo {
    height: 32px;
    width: auto;
    object-fit: contain;
  }

  .mobile-brand-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #f7e1e6;
  }

  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-action-link,
  .mobile-action-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f5e9ec;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
  }

  .mobile-action-btn {
    color: #fca5a5;
  }

  /* El sidebar se convierte en un DRAWER deslizante */
  .admin-side {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    max-width: 82vw;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
    box-shadow: none;
  }

  .admin-side.drawer-open {
    transform: translateX(0);
    box-shadow: 6px 0 30px rgba(0, 0, 0, 0.45);
  }

  .mobile-close-drawer {
    display: flex;
  }

  /* Contenedor de contenido con márgenes limpios en móvil */
  .admin-content {
    padding: 16px 14px;
  }
}

@media (max-width: 480px) {
  .admin-mobile-bar {
    padding: 8px 12px;
  }

  .admin-content {
    padding: 14px 10px;
  }
}
</style>
