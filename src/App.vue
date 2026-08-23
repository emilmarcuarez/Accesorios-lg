<script setup>
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const auth = useAuthStore()

onMounted(() => auth.init())

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
