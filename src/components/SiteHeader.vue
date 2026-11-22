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

    <transition name="fade">
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false" @touchmove.prevent></div>
    </transition>
    <transition name="slide">
      <aside v-if="menuOpen" class="drawer">
        <div class="drawer-head">
          <div class="brand">
            <img src="/img/logo.png" class="brand-logo" alt="Detallitos" />
          </div>
          <button class="drawer-close-btn" aria-label="Cerrar" @click="menuOpen = false">
            <AppIcon name="close" :size="20" />
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
            <span>{{ link.label }}</span>
            <AppIcon name="chevronRight" :size="15" class="drawer-link-arrow" />
          </button>
        </nav>
        <div class="drawer-user-section">
          <button class="drawer-user-btn btn-account" @click="goAccount">
            <AppIcon name="user" :size="17" />
            <span>{{ auth.isAuthenticated ? (auth.fullName || 'Mi Cuenta') : 'Mi Cuenta / Iniciar Sesión' }}</span>
          </button>
          <button class="drawer-user-btn btn-favorites" @click="goFavorites">
            <AppIcon name="heart" :size="17" />
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
  height: 14px;
  background: rgba(255, 255, 255, 0.45);
  display: inline-block;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .promo-sep {
    display: none !important;
  }
  .promo-inner {
    flex-direction: column;
    gap: 6px;
    padding: 2px 12px;
  }
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
  background: rgba(17, 17, 17, 0.55);
  backdrop-filter: blur(2px);
  z-index: 60;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 310px;
  max-width: 85%;
  background: var(--white);
  z-index: 70;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0f0f2;
}

.drawer-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 0;
  background: #f4f4f5;
  color: #111111;
  border: 1px solid #e4e4e7;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  background: #111111;
  color: #ffffff;
  border-color: #111111;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.drawer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 15px 4px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #18181b;
  border: none;
  border-bottom: 1px solid #f2f2f4;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-link:hover {
  color: #000000;
  padding-left: 6px;
}

.drawer-link-arrow {
  color: #a1a1aa;
  transition: transform 0.2s ease, color 0.2s ease;
}

.drawer-link:hover .drawer-link-arrow {
  color: #111111;
  transform: translateX(3px);
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
    border-bottom: 1px solid #eeeff2;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
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
    min-width: 0;
    background: #f7f7f8;
    border: 1px solid #e4e4e7;
    border-radius: 0;
    padding: 8px 12px;
  }
  .search-mobile:focus-within {
    border-color: #111111;
    box-shadow: 0 0 0 1px #111111;
    background: #ffffff;
  }
  .search-mobile input {
    min-width: 0;
  }
  .brand-mobile {
    flex: 0 0 auto;
  }
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mobile-bar .icon-btn {
    border-radius: 0;
  }
}

.drawer-rate-box {
  margin: 18px 0 0;
  padding: 12px 14px;
  background: #ffffff;
  border: 1.5px solid #111111;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-rate-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #666666;
}

.drawer-rate-sub {
  font-size: 13.5px;
  font-weight: 700;
  color: #111111;
  letter-spacing: 0.02em;
}

.drawer-user-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px 16px;
  border-radius: 0;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s ease;
}

.drawer-user-btn.btn-account {
  background: #111111;
  color: #ffffff;
  border: 1.5px solid #111111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.drawer-user-btn.btn-account:hover {
  background: #27272a;
  border-color: #27272a;
  transform: translateY(-1px);
}

.drawer-user-btn.btn-favorites {
  background: #ffffff;
  color: #111111;
  border: 1.5px solid #111111;
}

.drawer-user-btn.btn-favorites:hover {
  background: #111111;
  color: #ffffff;
  transform: translateY(-1px);
}

/* Indicador de Tasa BCV en barra negra */
.rate-promo-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 3px 10px;
  border-radius: 0;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  letter-spacing: 0.02em;
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

@media (min-width: 901px) {
  .mobile-rate-strip {
    display: none;
  }
}
</style>
