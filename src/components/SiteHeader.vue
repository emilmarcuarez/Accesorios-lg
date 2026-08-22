<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import { STORE } from '@/config'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
const router = useRouter()
const menuOpen = ref(false)
const query = ref('')

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Tienda', to: '/tienda' },
  { label: 'Categorías', to: '/categorias' },
  { label: 'Novedades', to: '/tienda?new=1' },
  { label: 'Regalos', to: '/tienda/personalizados' },
  { label: 'Contactos', to: '/contactos' },
]

function submitSearch() {
  const value = query.value.trim()
  router.push({ path: '/tienda', query: value ? { q: value } : {} })
  query.value = ''
  menuOpen.value = false
}

function go(route, event) {
  router.push(route)
  menuOpen.value = false
}
</script>

<template>
  <div class="header-wrap">
    <div class="promo-bar">
      <div class="container promo-inner">
        <p>Envío GRATIS en compras superiores a {{ formatPrice(STORE.freeShipping) }}</p>
        <span class="promo-sep"></span>
        <p>10% OFF en tu primera compra con el código: <strong>{{ STORE.coupon }}</strong></p>
      </div>
    </div>

    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="brand" @click="menuOpen = false">
          <span class="brand-script">{{ STORE.name }}</span>
          <span class="brand-sub">Accesorios</span>
        </router-link>

        <nav class="nav">
          <router-link
            v-for="link in navLinks"
            :key="link.label"
            :to="link.to"
            class="nav-link"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <form class="search" @submit.prevent="submitSearch">
          <AppIcon name="search" :size="18" />
          <input v-model="query" type="text" placeholder="Buscar..." />
        </form>

        <div class="actions">
          <button class="action-btn" aria-label="Cuenta">
            <AppIcon name="user" :size="20" />
            <span class="action-label">Cuenta</span>
          </button>
          <button class="action-btn" aria-label="Favoritos">
            <AppIcon name="heart" :size="20" />
            <span class="action-label">Favoritos</span>
          </button>
          <button class="action-btn" aria-label="Carrito" @click="cart.toggleDrawer(true)">
            <AppIcon name="bag" :size="20" />
            <span class="action-label">Carrito</span>
            <span v-if="cart.count" class="badge">{{ cart.count }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="mobile-bar">
      <div class="container mobile-inner">
        <button class="icon-btn" aria-label="Menu" @click="menuOpen = true">
          <AppIcon name="menu" :size="22" />
        </button>
        <router-link to="/" class="brand brand-mobile" @click="menuOpen = false">
          <span class="brand-script">{{ STORE.name }}</span>
          <span class="brand-sub">Accesorios</span>
        </router-link>
        <form class="search search-mobile" @submit.prevent="submitSearch">
          <AppIcon name="search" :size="18" />
          <input v-model="query" type="text" placeholder="Buscar..." />
        </form>
        <button class="icon-btn" aria-label="Carrito" @click="cart.toggleDrawer(true)">
          <AppIcon name="bag" :size="22" />
          <span v-if="cart.count" class="badge">{{ cart.count }}</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>
    </transition>
    <transition name="slide">
      <aside v-if="menuOpen" class="drawer">
        <div class="drawer-head">
          <div class="brand">
            <span class="brand-script">{{ STORE.name }}</span>
            <span class="brand-sub">Accesorios</span>
          </div>
          <button class="icon-btn" aria-label="Cerrar" @click="menuOpen = false">
            <AppIcon name="close" :size="22" />
          </button>
        </div>
        <nav class="drawer-nav">
          <button
            v-for="link in navLinks"
            :key="link.label"
            class="drawer-link"
            @click="go(link.to)"
          >
            {{ link.label }}
          </button>
        </nav>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.promo-bar {
  background: var(--rose-gradient);
  color: var(--white);
  font-size: 12.5px;
  padding: 9px 0;
}

.promo-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  text-align: center;
}

.promo-sep {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.5);
}

.promo-inner strong {
  text-decoration: underline;
  font-weight: 600;
}

.header {
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 18px 20px;
  background: rgba(255, 253, 251, 0.9);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-script {
  font-family: var(--font-script);
  font-size: 30px;
  font-weight: 700;
  color: var(--rose-600);
  letter-spacing: 0.5px;
}

.brand-sub {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  color: var(--ink-400);
  text-transform: uppercase;
  margin-top: 2px;
}

.nav {
  display: flex;
  gap: 22px;
}

.nav-link {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink-700);
  position: relative;
  padding: 4px 0;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background: var(--rose-500);
  transition: width 0.25s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: var(--rose-600);
}

.nav-link:hover::after,
.nav-link.router-link-exact-active::after {
  width: 100%;
}

.search {
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--rose-50);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  padding: 9px 16px;
  margin-left: auto;
  color: var(--ink-400);
}

.search:focus-within {
  border-color: var(--rose-300);
  background: var(--white);
}

.search input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 13.5px;
  color: var(--ink-700);
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn,
.icon-btn {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  color: var(--ink-700);
  border-radius: 10px;
  transition: color 0.2s ease;
}

.action-btn:hover,
.icon-btn:hover {
  color: var(--rose-600);
}

.action-label {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--ink-400);
}

.badge {
  position: absolute;
  top: 2px;
  right: 4px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rose-600);
  color: var(--white);
  font-size: 10.5px;
  font-weight: 600;
  border-radius: var(--radius-full);
}

.mobile-bar {
  display: none;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(61, 42, 49, 0.4);
  z-index: 60;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 300px;
  max-width: 85%;
  background: var(--white);
  z-index: 70;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}

.drawer-link {
  text-align: left;
  padding: 16px 4px;
  font-size: 16px;
  font-weight: 500;
  color: var(--ink-700);
  border-bottom: 1px solid var(--line);
}

.fade-enter-active,
.fade-leave-active,
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

@media (max-width: 1024px) {
  .header {
    display: none;
  }
  .mobile-bar {
    display: block;
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(255, 253, 251, 0.96);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .mobile-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .brand-mobile .brand-script {
    font-size: 24px;
  }
  .brand-mobile .brand-sub {
    font-size: 9px;
    letter-spacing: 0.22em;
  }
  .search-mobile {
    display: flex;
    margin: 0;
    max-width: none;
    flex: 1;
  }
  .brand-mobile {
    flex: 0 0 auto;
  }
}
</style>
