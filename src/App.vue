<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'

const route = useRoute()

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
