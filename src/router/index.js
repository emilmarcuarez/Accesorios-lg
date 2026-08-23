import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

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
  {
    path: '/privacidad',
    name: 'privacy',
    component: () => import('@/views/PrivacyPolicyView.vue'),
  },
  {
    path: '/terminos',
    name: 'terms',
    component: () => import('@/views/TermsView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/cuenta',
    name: 'account',
    component: () => import('@/views/AccountView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin-login',
    name: 'admin-login',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminView.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'productos',
        name: 'admin-products',
        component: () => import('@/views/admin/AdminProducts.vue'),
        meta: { title: 'Productos' },
      },
      {
        path: 'categorias',
        name: 'admin-categories',
        component: () => import('@/views/admin/AdminCategories.vue'),
        meta: { title: 'Categorías' },
      },
      {
        path: 'cupones',
        name: 'admin-coupons',
        component: () => import('@/views/admin/AdminCoupons.vue'),
        meta: { title: 'Cupones' },
      },
      {
        path: 'descuentos',
        name: 'admin-discounts',
        component: () => import('@/views/admin/AdminDiscounts.vue'),
        meta: { title: 'Descuentos' },
      },
      {
        path: 'pedidos',
        name: 'admin-orders',
        component: () => import('@/views/admin/AdminOrders.vue'),
        meta: { title: 'Pedidos / Ventas' },
      },
    ],
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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    if (auth.isAuthenticated) return { name: 'admin-login', query: { denied: '1' } }
    return { name: 'admin-login' }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return auth.isAdmin ? { name: 'admin-dashboard' } : { name: 'account' }
  }
  return true
})

export default router
