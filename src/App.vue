<script setup>
import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import AuthPromptModal from '@/components/AuthPromptModal.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'
import { useUiStore } from '@/store/ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const favorites = useFavoritesStore()
const ui = useUiStore()

onMounted(async () => {
  await auth.init()
  await router.isReady()
  if (auth.isAuthenticated) {
    await cart.loadSaved()
    await favorites.load()
  }
  ui.hide()
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
  () => window.scrollTo({ top: 0 }),
)
</script>

<template>
  <LoadingOverlay />
  <SiteHeader />
  <router-view />
  <SiteFooter />
  <CartDrawer />
  <AuthPromptModal />
</template>
