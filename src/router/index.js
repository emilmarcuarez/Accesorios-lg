import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/tienda', name: 'shop', component: () => import('@/views/ShopView.vue') },
  {
    path: '/tienda/:category',
    name: 'category',
    component: () => import('@/views/ShopView.vue'),
  },
  {
    path: '/producto/:id',
    name: 'product',
    component: () => import('@/views/ProductView.vue'),
  },
  {
    path: '/categorias',
    name: 'categories',
    component: () => import('@/views/CategoriesView.vue'),
  },
  {
    path: '/nosotros',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    path: '/contactos',
    name: 'contact',
    component: () => import('@/views/ContactView.vue'),
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router
