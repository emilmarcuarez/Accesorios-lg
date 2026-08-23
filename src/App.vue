<script setup>
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import AuthPromptModal from '@/components/AuthPromptModal.vue'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { useFavoritesStore } from '@/store/favorites'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const favorites = useFavoritesStore()

onMounted(async () => {
  await auth.init()
  if (auth.isAuthenticated) {
    await cart.loadSaved()
    await favorites.load()
  }
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
  <SiteHeader />
  <router-view />
  <SiteFooter />
  <CartDrawer />
  <AuthPromptModal />
</template>
