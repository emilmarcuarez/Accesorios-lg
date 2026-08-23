<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import AppIcon from '@/components/AppIcon.vue'

const auth = useAuthStore()
const router = useRouter()

const menu = [
  { name: 'dashboard', label: 'Dashboard', icon: 'home', to: '/admin/dashboard' },
  { name: 'products', label: 'Productos', icon: 'bag', to: '/admin/productos' },
  { name: 'categories', label: 'Categorías', icon: 'heart', to: '/admin/categorias' },
  { name: 'coupons', label: 'Cupones', icon: 'gift', to: '/admin/cupones' },
  { name: 'discounts', label: 'Descuentos', icon: 'truck', to: '/admin/descuentos' },
  { name: 'orders', label: 'Pedidos / Ventas', icon: 'search', to: '/admin/pedidos' },
]

async function logout() {
  await auth.signOut()
  router.push('/admin-login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <div class="admin-brand">
        <span class="brand-script">{{ 'Detallitos' }}</span>
        <span class="admin-brand-sub">Panel Admin</span>
      </div>

      <nav class="admin-nav">
        <router-link
          v-for="item in menu"
          :key="item.name"
          :to="item.to"
          class="admin-link"
          :class="{ active: $route.name === 'admin-' + item.name }"
        >
          <AppIcon :name="item.icon" :size="18" />
          {{ item.label }}
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
        <router-link to="/" class="admin-site">Ver tienda</router-link>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-top">
        <h1 class="admin-top-title">{{ $route.meta.title || 'Administración' }}</h1>
      </header>
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
}

.admin-side {
  width: 250px;
  flex-shrink: 0;
  background: #2a2024;
  color: #f5e9ec;
  display: flex;
  flex-direction: column;
  padding: 26px 18px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.admin-brand {
  padding: 0 8px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-script {
  font-family: var(--font-script);
  font-size: 30px;
  color: #f0a5b8;
}

.admin-brand-sub {
  display: block;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 22px;
  flex: 1;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
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
}

.admin-foot {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 18px;
}

.admin-user {
  margin-bottom: 12px;
}

.admin-user-name {
  display: block;
  font-weight: 600;
}

.admin-user-mail {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.admin-out {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  color: #e8b4c0;
  background: rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.admin-out:hover {
  background: rgba(255, 255, 255, 0.12);
}

.admin-site {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}

.admin-main {
  flex: 1;
  min-width: 0;
}

.admin-top {
  background: var(--white);
  border-bottom: 1px solid var(--line);
  padding: 22px 32px;
}

.admin-top-title {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-900);
}

.admin-content {
  padding: 32px;
}

@media (max-width: 900px) {
  .admin-shell {
    flex-direction: column;
  }
  .admin-side {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 16px;
  }
  .admin-brand {
    border: none;
    padding: 0 12px 0 0;
  }
  .admin-nav {
    flex-direction: row;
    margin: 0;
    flex-wrap: wrap;
  }
  .admin-link {
    padding: 8px 12px;
  }
  .admin-foot {
    border: none;
    padding: 0;
    margin-left: auto;
  }
  .admin-user,
  .admin-site {
    display: none;
  }
  .admin-content {
    padding: 20px 16px;
  }
}
</style>
