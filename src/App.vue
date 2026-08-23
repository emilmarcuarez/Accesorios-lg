<script setup>
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()

onMounted(async () => {
  await auth.init()
  if (auth.isAuthenticated) await cart.loadSaved()
})

watch(
  () => auth.user,
  async (user) => {
    if (user) await cart.loadSaved()
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
</template>
