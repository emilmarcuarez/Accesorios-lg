<script setup>
import { useCartStore } from '@/store/cart'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
</script>

<template>
  <transition name="fade">
    <div v-if="cart.drawerOpen" class="cart-overlay" @click="cart.toggleDrawer(false)"></div>
  </transition>

  <transition name="slide-right">
    <aside v-if="cart.drawerOpen" class="cart-drawer">
      <div class="cart-head">
        <h3 class="cart-title">Tu carrito</h3>
        <button class="icon-btn" aria-label="Cerrar" @click="cart.toggleDrawer(false)">
          <AppIcon name="close" :size="22" />
        </button>
      </div>

      <div v-if="cart.items.length" class="cart-body">
        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" :style="{ objectPosition: item.pos }" />
          <div class="cart-info">
            <p class="cart-name">{{ item.name }}</p>
            <p class="cart-price">{{ formatPrice(item.price) }}</p>
            <div class="qty">
              <button class="qty-btn" aria-label="Menos" @click="cart.decrease(item.id)">
                <AppIcon name="minus" :size="14" />
              </button>
              <span class="qty-num">{{ item.qty }}</span>
              <button class="qty-btn" aria-label="Más" @click="cart.increase(item.id)">
                <AppIcon name="plus" :size="14" />
              </button>
            </div>
          </div>
          <button class="item-remove" aria-label="Quitar" @click="cart.remove(item.id)">
            <AppIcon name="trash" :size="17" />
          </button>
        </div>

        <button class="clear-link" @click="cart.clear">Vaciar carrito</button>
      </div>

      <div v-else class="cart-empty">
        <AppIcon name="bag" :size="48" />
        <p>Tu carrito está vacío</p>
        <button class="btn btn-ghost" @click="cart.toggleDrawer(false)">Seguir comprando</button>
      </div>

      <div v-if="cart.items.length" class="cart-foot">
        <div class="cart-total">
          <span>Total</span>
          <strong>{{ cart.formattedSubtotal }}</strong>
        </div>
        <button class="btn btn-primary cart-checkout" @click="cart.checkout">
          <AppIcon name="whatsapp" :size="18" />
          Finalizar compra por WhatsApp
        </button>
        <button class="btn btn-outline cart-receipt" @click="cart.printInvoice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v20L9 20.5 12 22l3-1.5L18 20.5 18 2"></path></svg>
          Descargar orden
        </button>
        <p class="cart-hint">En el mensaje de WhatsApp va el detalle completo de tu orden. También puedes descargarla aquí como PDF.</p>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(61, 42, 49, 0.45);
  z-index: 80;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 420px;
  max-width: 100%;
  background: var(--white);
  z-index: 90;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line);
}

.cart-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--ink-900);
}

.cart-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.cart-item {
  display: grid;
  grid-template-columns: 84px 1fr 28px;
  gap: 16px;
  align-items: center;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.cart-item img {
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 12px;
  background: var(--rose-50);
}

.cart-name {
  font-weight: 600;
  font-size: 14.5px;
  color: var(--ink-900);
  line-height: 1.3;
}

.cart-price {
  font-size: 14px;
  color: var(--rose-600);
  margin: 4px 0 10px;
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  padding: 3px;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-700);
  transition: background 0.2s ease;
}

.qty-btn:hover {
  background: var(--rose-100);
}

.qty-num {
  min-width: 26px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.item-remove {
  color: var(--ink-400);
  transition: color 0.2s ease;
}

.item-remove:hover {
  color: var(--rose-600);
}

.clear-link {
  display: block;
  margin: 0 auto;
  font-size: 12.5px;
  color: var(--ink-400);
  text-decoration: underline;
}

.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: var(--ink-400);
  padding: 30px;
  text-align: center;
}

.cart-foot {
  border-top: 1px solid var(--line);
  padding: 20px 24px 24px;
}

.cart-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 15px;
  color: var(--ink-700);
}

.cart-total strong {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--ink-900);
}

.cart-checkout {
  width: 100%;
  padding: 14px;
}

.cart-receipt {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  font-size: 13px;
}

.cart-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-400);
}

.fade-enter-active,
.fade-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
