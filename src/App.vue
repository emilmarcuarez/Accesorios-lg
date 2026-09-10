<script setup>
import { watch, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AOS from 'aos'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import AuthPromptModal from '@/components/AuthPromptModal.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import { useUiStore } from '@/store/ui'
import { useSettingsStore } from '@/store/settings'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const favorites = useFavoritesStore()
const ui = useUiStore()
const settings = useSettingsStore()

const isAdminArea = computed(() => route.path.startsWith('/admin'))

onMounted(async () => {
  AOS.init({
    duration: 750,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
  })

  await settings.fetch()
  await auth.init()
  await router.isReady()
  if (auth.isAuthenticated) {
    await cart.loadSaved()
    await favorites.load()
  }

  // Si estamos en la portada y hay video en el hero, esperamos a que cargue bien
  const isHome = route.path === '/'
  const hasHeroVideo = Boolean(settings.hero?.video && settings.hero.video.trim())

  if (isHome && hasHeroVideo) {
    ui.setWaitingForVideo(true)
    // Timeout de seguridad de 6s para proteger la experiencia en conexiones lentas
    setTimeout(() => {
      ui.markVideoReady()
    }, 6000)
  } else {
    ui.setWaitingForVideo(false)
    ui.hide()
  }

  nextTick(() => {
    AOS.refresh()
  })
})

watch(
  () => auth.user,
  async (user) => {
    if (user) {
      await cart.loadSaved()
      await favorites.load()
    } else {
      favorites.ids = []
    }
  },
)

watch(
  () => route.fullPath,
  () => {
    window.scrollTo({ top: 0, left: 0 })
    setTimeout(() => {
      AOS.refreshHard()
    }, 120)
  },
)
</script>

<template>
  <LoadingOverlay />
  <template v-if="isAdminArea">
    <router-view />
  </template>
  <template v-else>
    <SiteHeader />
    <router-view />
    <SiteFooter />
    <CartDrawer />
    <AuthPromptModal />
  </template>
</template>
