<script setup>
import { ref } from 'vue'
import { useCartStore } from '@/store/cart'
import { useCatalogStore } from '@/store/catalog'
import AppIcon from '@/components/AppIcon.vue'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
const catalog = useCatalogStore()
const couponCode = ref('')
const couponError = ref('')

function getRemainingStock(item) {
  const prod = catalog.products.find((p) => p.id === item.id)
  const totalStock = prod ? Number(prod.stock) || 0 : (typeof item.stock === 'number' ? item.stock : 0)
  return Math.max(0, totalStock - (Number(item.qty) || 0))
}

async function applyCoupon() {
  couponError.value = ''
  const res = await cart.applyCoupon(couponCode.value)
  if (res.error) couponError.value = res.error
  else couponCode.value = ''
}
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
            <div class="cart-prices">
              <span class="cart-price">{{ formatPrice(item.price) }}</span>
              <span v-if="item.originalPrice && item.originalPrice > item.price" class="cart-old-price">
                {{ formatPrice(item.originalPrice) }}
              </span>
              <span v-if="item.discount" class="cart-item-discount">-{{ item.discount }}%</span>
            </div>

            <!-- Mostrar cuántas quedan en stock de forma dinámica -->
            <div class="cart-item-stock-row">
              <span class="cart-stock-simple">Stock: {{ getRemainingStock(item) }}</span>
            </div>

            <div class="qty">
              <button class="qty-btn" aria-label="Menos" @click="cart.decrease(item.id)">
                <AppIcon name="minus" :size="14" />
              </button>
              <span class="qty-num">{{ item.qty }}</span>
              <button
                class="qty-btn"
                :disabled="getRemainingStock(item) <= 0"
                aria-label="Más"
                :title="getRemainingStock(item) <= 0 ? 'Stock máximo alcanzado' : 'Añadir más'"
                @click="cart.increase(item.id)"
              >
                <AppIcon name="plus" :size="14" />
              </button>
            </div>
            <p v-if="getRemainingStock(item) <= 0" class="max-stock-notice">
              Máximo en stock
            </p>
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
        <div class="coupon-row">
          <input
            v-model="couponCode"
            type="text"
            placeholder="Código de cupón"
            class="coupon-input"
            @keyup.enter="applyCoupon"
          />
          <button class="btn btn-ghost coupon-apply" @click="applyCoupon">Aplicar</button>
        </div>
        <p v-if="couponError" class="coupon-error">{{ couponError }}</p>

        <div class="totals">
          <div v-if="cart.itemsDiscountTotal > 0" class="total-line">
            <span>Subtotal regular</span>
            <span>{{ cart.formattedRegularSubtotal }}</span>
          </div>
          <div v-if="cart.itemsDiscountTotal > 0" class="total-line discount">
            <span>Descuentos en productos</span>
            <span>-{{ formatPrice(cart.itemsDiscountTotal) }}</span>
          </div>
          <div v-else class="total-line">
            <span>Subtotal</span>
            <span>{{ cart.formattedSubtotal }}</span>
          </div>
          <div v-if="cart.coupon" class="total-line discount">
            <span>Cupón {{ cart.coupon.code }} (-{{ cart.coupon.discount }}%)</span>
            <button class="coupon-remove" @click="cart.removeCoupon">quitar</button>
            <span>-{{ formatPrice(cart.discountAmount) }}</span>
          </div>
          <div v-if="cart.totalSavings > 0" class="savings-pill">
            <span class="savings-label">AHORRO TOTAL:</span>
            <strong class="savings-amount">-{{ cart.formattedTotalSavings }}</strong>
          </div>
          <div class="cart-total">
            <span>Total</span>
            <strong>{{ cart.formattedTotal }}</strong>
          </div>
        </div>

        <button class="btn btn-primary cart-checkout" @click="cart.checkout">
          <AppIcon name="whatsapp" :size="18" />
          Finalizar compra por WhatsApp
        </button>
        <button class="btn btn-outline cart-receipt" @click="cart.printInvoice()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v20L9 20.5 12 22l3-1.5L18 20.5 18 2"></path></svg>
          Descargar Factura / Comprobante
        </button>
        <p class="cart-hint">Al descargar la factura obtendrás tu comprobante con el detalle de descuentos y precios finales.</p>
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
  padding: 20px 24px;
  background: #111111;
  color: #ffffff;
  border-bottom: 1px solid #222222;
}

.cart-title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffffff;
}

.cart-head .icon-btn {
  color: #ffffff;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cart-head .icon-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
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
  border-bottom: 1px solid #ebebeb;
}

.cart-item img {
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid #eeeeee;
  background: var(--rose-50);
}

.cart-name {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  color: #111111;
  line-height: 1.3;
}

.cart-prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 4px 0 10px;
}

.cart-price {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 700;
  color: #111111;
}

.cart-old-price {
  font-family: var(--font-body);
  font-size: 12px;
  color: #999999;
  text-decoration: line-through;
}

.cart-item-discount {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  background: #111111;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 2px;
  letter-spacing: 0.04em;
}

.cart-item-stock-row {
  margin: 4px 0 8px;
  display: flex;
  align-items: center;
}

.cart-stock-simple {
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 500;
  color: #888888;
  letter-spacing: 0.02em;
}

.max-stock-notice {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  color: #b45309;
  margin: 4px 0 0 0;
  line-height: 1.2;
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 2px;
  background: #ffffff;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-700);
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: var(--rose-100);
  color: var(--rose-700);
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
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
  margin: 10px auto 0;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #888888;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-link:hover {
  color: var(--rose-600);
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
  font-family: var(--font-body);
}

.cart-foot {
  border-top: 1px solid #eeeeee;
  padding: 20px 24px 24px;
  background: #ffffff;
}

.coupon-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.coupon-input {
  flex: 1;
  font-family: var(--font-body);
  border: 1px solid #dcdcdc;
  border-radius: 2px;
  padding: 10px 14px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  background: #ffffff;
  outline: none;
  text-transform: uppercase;
  transition: border-color 0.2s ease;
}

.coupon-input:focus {
  border-color: #111111;
  background: var(--white);
}

.coupon-apply {
  font-family: var(--font-body);
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 2px;
  background: #111111;
  border: 1px solid #111111;
  color: #ffffff;
  transition: all 0.2s ease;
}

.coupon-apply:hover {
  background: var(--rose-600);
  border-color: var(--rose-600);
  color: #ffffff;
}

.coupon-error {
  font-family: var(--font-body);
  color: #c0392b;
  font-size: 12px;
  margin-bottom: 8px;
}

.totals {
  margin-bottom: 14px;
}

.total-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: #666666;
  margin-bottom: 6px;
}

.total-line.discount {
  color: #1f8a4c;
}

.coupon-remove {
  font-size: 11px;
  text-decoration: underline;
  color: #999999;
  background: none;
  border: none;
  cursor: pointer;
}

.savings-pill {
  background: #111111;
  border: 1px solid #111111;
  color: #ffffff;
  font-family: var(--font-body);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 9px 14px;
  border-radius: 2px;
  margin: 10px 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.savings-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
}

.savings-amount {
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.cart-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #111111;
}

.cart-total strong {
  font-family: var(--font-body);
  font-size: 26px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.01em;
}

.cart-checkout {
  width: 100%;
  padding: 15px;
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--rose-gradient);
  color: #ffffff;
  border: 1px solid transparent;
  box-shadow: 0 4px 14px rgba(217, 109, 139, 0.35);
  transition: all 0.25s ease;
  cursor: pointer;
}

.cart-checkout:hover {
  background: #111111;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

.cart-receipt {
  width: 100%;
  margin-top: 10px;
  padding: 13px;
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 2px;
  border: 1px solid #111111;
  color: #111111;
  background: #ffffff;
  transition: all 0.25s ease;
  cursor: pointer;
}

.cart-receipt:hover {
  background: #111111;
  color: #ffffff;
  transform: translateY(-2px);
}

.cart-hint {
  margin-top: 12px;
  text-align: center;
  font-family: var(--font-body);
  font-size: 11.5px;
  color: #888888;
  line-height: 1.4;
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
