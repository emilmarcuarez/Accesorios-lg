<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { useFavoritesStore } from '@/store/favorites'
import { useSettingsStore } from '@/store/settings'
import { useCurrencyStore } from '@/store/currency'
import AppIcon from '@/components/AppIcon.vue'
import { STORE } from '@/config'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const settings = useSettingsStore()
const currency = useCurrencyStore()
const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)
const query = ref('')

const isShopPage = computed(() => {
  return route.path === '/tienda' || route.path.startsWith('/tienda/')
})

watch(menuOpen, (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
  } else if (!cart.drawerOpen) {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''
  }
})

onMounted(() => {
  settings.fetch()
  currency.init()
})

const topBarVisible = computed(() => settings.topBar?.enabled !== false)
const topBarText1 = computed(() => {
  if (settings.topBar?.text1 !== undefined && settings.topBar?.text1 !== null && settings.topBar?.text1 !== '') {
    return settings.topBar.text1
  }
  return `Envío GRATIS en compras superiores a ${formatPrice(STORE.freeShipping)}`
})
const topBarText2 = computed(() => {
  if (settings.topBar?.text2 !== undefined && settings.topBar?.text2 !== null) {
    return settings.topBar.text2
  }
  return `10% OFF en tu primera compra con el código: ${STORE.coupon}`
})

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Tienda', to: '/tienda' },
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

function goAccount() {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login' })
    return
  }
  router.push(auth.isAdmin ? '/admin/dashboard' : '/cuenta')
}

function goFavorites() {
  router.push('/favoritos')
}
</script>

<template>
  <div class="header-wrap">
    <div v-if="topBarVisible && (topBarText1 || topBarText2 || currency.effectiveRate)" class="promo-bar">
      <div class="container promo-inner">
        <p v-if="topBarText1">{{ topBarText1 }}</p>
        <span v-if="topBarText1 && topBarText2" class="promo-sep"></span>
        <p v-if="topBarText2">{{ topBarText2 }}</p>
        <span v-if="(topBarText1 || topBarText2) && currency.effectiveRate" class="promo-sep"></span>
        <div v-if="currency.effectiveRate" class="rate-promo-pill" title="Tasa oficial BCV actualizada en tiempo real vía DolarVZLA">
          <span class="rate-live-dot"></span>
          <span>Tasa BCV: <strong>{{ currency.formattedRate }}</strong></span>
        </div>
      </div>
    </div>

    <header class="header">
      <div class="container-fluid header-inner">
        <router-link to="/" class="brand" @click="menuOpen = false">
          <img src="/img/logo.png" class="brand-logo" alt="Detallitos" />
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

        <form v-if="!isShopPage" class="search" @submit.prevent="submitSearch">
          <AppIcon name="search" :size="18" />
          <input v-model="query" type="text" placeholder="Buscar..." />
        </form>
        <div v-else class="search-spacer"></div>

        <div v-if="currency.effectiveRate" class="header-rate-badge" title="Tasa oficial BCV del día (DolarVZLA)">
          <span class="rate-live-dot"></span>
          <span class="rate-tag-text">Tasa BCV</span>
          <strong class="rate-val-text">{{ currency.formattedRate }}</strong>
        </div>

        <div class="actions">
          <button class="action-btn" aria-label="Cuenta" @click="goAccount">
            <AppIcon name="user" :size="20" />
            <span class="action-label">Cuenta</span>
          </button>
          <button class="action-btn" aria-label="Favoritos" @click="goFavorites">
            <AppIcon name="heart" :size="20" :filled="false" />
            <span class="action-label">Favoritos</span>
            <span v-if="favorites.count" class="badge">{{ favorites.count }}</span>
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
          <img src="/img/logo.png" class="brand-logo" alt="Detallitos" />
        </router-link>
        <form v-if="!isShopPage" class="search search-mobile" @submit.prevent="submitSearch">
          <AppIcon name="search" :size="18" />
          <input v-model="query" type="text" placeholder="Buscar..." />
        </form>
        <div v-else class="mobile-spacer"></div>
        <div class="mobile-actions">
          <button class="icon-btn" aria-label="Cuenta" @click="goAccount">
            <AppIcon name="user" :size="21" />
          </button>
          <button class="icon-btn" aria-label="Carrito" @click="cart.toggleDrawer(true)">
            <AppIcon name="bag" :size="21" />
            <span v-if="cart.count" class="badge">{{ cart.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tira de tasa móvil -->
    <div v-if="currency.effectiveRate" class="mobile-rate-strip">
      <span class="rate-live-dot"></span>
      <span>Tasa BCV del momento: <strong>{{ currency.formattedRate }}</strong></span>
    </div>

    <transition name="fade">
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false" @touchmove.prevent></div>
    </transition>
    <transition name="slide">
      <aside v-if="menuOpen" class="drawer">
        <div class="drawer-head">
          <div class="brand">
            <img src="/img/logo.png" class="brand-logo" alt="Detallitos" />
          </div>
          <button class="icon-btn" aria-label="Cerrar" @click="menuOpen = false">
            <AppIcon name="close" :size="22" />
          </button>
        </div>

        <div v-if="currency.effectiveRate" class="drawer-rate-box">
          <span class="rate-live-dot"></span>
          <div>
            <div class="drawer-rate-title">Tasa Oficial BCV</div>
            <div class="drawer-rate-sub">{{ currency.rateText }}</div>
          </div>
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
        <div class="drawer-user-section">
          <button class="drawer-user-btn" @click="goAccount">
            <AppIcon name="user" :size="18" />
            <span>{{ auth.isAuthenticated ? (auth.fullName || 'Mi Cuenta') : 'Mi Cuenta / Iniciar Sesión' }}</span>
          </button>
          <button class="drawer-user-btn" @click="goFavorites">
            <AppIcon name="heart" :size="18" />
            <span>Favoritos {{ favorites.count ? `(${favorites.count})` : '' }}</span>
          </button>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.promo-bar {
  background: #111111;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.header-wrap {
  background: #ffffff;
  width: 100%;
}

.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #ffffff;
  width: 100%;
  border-bottom: 1px solid rgba(234, 169, 187, 0.25);
  box-shadow: 0 2px 12px rgba(180, 90, 112, 0.04);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: clamp(20px, 2.5vw, 40px);
  padding-top: 16px;
  padding-bottom: 16px;
  background: #ffffff;
}

.brand {
  display: flex;
  align-items: center;
  line-height: 1;
}

.brand-logo {
  height: 76px;
  width: auto;
  object-fit: contain;
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
  gap: clamp(16px, 1.8vw, 30px);
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
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(234, 169, 187, 0.45);
  border-radius: 2px;
  padding: 10px 18px;
  margin-left: auto;
  color: var(--ink-400);
  transition: all 0.2s ease;
}

.search:focus-within {
  border-color: #111111;
  box-shadow: 0 0 0 1px #111111;
  background: #ffffff;
}

.search input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 13.5px;
  color: var(--ink-700);
}

.search-spacer {
  margin-left: auto;
}

.mobile-spacer {
  flex: 1;
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
    background: #ffffff;
    border-bottom: 1px solid rgba(234, 169, 187, 0.25);
  }
  .mobile-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .brand-mobile .brand-logo {
    height: 36px;
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
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.drawer-user-section {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-user-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--rose-50);
  color: var(--rose-600);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--rose-200);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-user-btn:hover {
  background: var(--rose-100);
  transform: translateX(3px);
}

/* Indicadores de Tasa BCV */
.rate-promo-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.rate-promo-pill strong {
  text-decoration: none !important;
  font-weight: 700;
}

.rate-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35);
  animation: pulse-rate-dot 2s infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes pulse-rate-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.header-rate-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff5f7;
  border: 1px solid var(--rose-200, #f3c6d2);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  line-height: 1;
}

.rate-tag-text {
  color: var(--rose-600);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.rate-val-text {
  color: var(--ink-900);
  font-weight: 700;
  font-size: 13px;
}

.mobile-rate-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: #fff5f7;
  border-bottom: 1px solid rgba(234, 169, 187, 0.35);
  padding: 6px 12px;
  font-size: 12px;
  color: var(--ink-700);
  text-align: center;
}

.mobile-rate-strip strong {
  color: var(--rose-600);
  font-weight: 700;
}

.drawer-rate-box {
  margin: 12px 20px 0;
  padding: 10px 14px;
  background: #fff5f7;
  border: 1px solid var(--rose-200, #f3c6d2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-rate-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: var(--rose-600);
}

.drawer-rate-sub {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-900);
}

@media (min-width: 901px) {
  .mobile-rate-strip {
    display: none;
  }
}
</style>
