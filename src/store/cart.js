import { defineStore } from 'pinia'
import { STORE } from '@/config'
import { formatPrice, formatNumber } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useCurrencyStore } from '@/store/currency'
import {
  insertOrder,
  listCoupons,
  getCouponRules,
  getCouponUsages,
  recordCouponUsage,
  recordOrderCoupon,
  updateCoupon,
  checkAndDeactivateExpiredCoupons,
} from '@/lib/db'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    drawerOpen: false,
    coupon: null,
  }),
  getters: {
    count: (state) => state.items.reduce((sum, item) => sum + item.qty, 0),
    regularSubtotal: (state) =>
      state.items.reduce(
        (sum, item) =>
          sum + (Number(item.originalPrice) || Number(item.price)) * item.qty,
        0,
      ),
    subtotal: (state) =>
      state.items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0),
    itemsDiscountTotal() {
      return Math.max(0, this.regularSubtotal - this.subtotal)
    },
    discountAmount() {
      if (!this.coupon) return 0
      return Math.round(this.subtotal * (this.coupon.discount / 100) * 100) / 100
    },
    total() {
      return Math.max(0, this.subtotal - this.discountAmount)
    },
    totalSavings() {
      return this.itemsDiscountTotal + this.discountAmount
    },
    formattedRegularSubtotal() {
      return formatPrice(this.regularSubtotal)
    },
    formattedSubtotal: (state) => formatPrice(state.subtotal),
    formattedTotal() {
      return formatPrice(this.total)
    },
    formattedTotalSavings() {
      return formatPrice(this.totalSavings)
    },
  },
  actions: {
    toggleDrawer(open) {
      this.drawerOpen = typeof open === 'boolean' ? open : !this.drawerOpen
    },
    add(product, qty = 1) {
      const existing = this.items.find((item) => item.id === product.id)
      if (existing) {
        existing.qty = Math.min(
          existing.qty + qty,
          product.stock ?? existing.qty + qty,
        )
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          originalPrice: Number(product.oldPrice || product.price),
          discount: product.discount || 0,
          image: product.image,
          pos: product.pos || 'center center',
          stock: product.stock,
          qty: Math.min(qty, product.stock ?? qty),
        })
      }
      this.drawerOpen = true
      this.saveToSupabase()
    },
    remove(productId) {
      this.items = this.items.filter((item) => item.id !== productId)
      this.saveToSupabase()
    },
    increase(productId) {
      const item = this.items.find((i) => i.id === productId)
      if (!item) return
      if (item.stock !== undefined && item.stock !== null && item.qty >= item.stock) return
      item.qty++
      this.saveToSupabase()
    },
    decrease(productId) {
      const item = this.items.find((i) => i.id === productId)
      if (!item) return
      if (item.qty > 1) {
        item.qty--
      } else {
        this.remove(productId)
      }
      this.saveToSupabase()
    },
    clear() {
      this.items = []
      this.coupon = null
      this.clearSaved()
    },
    async saveToSupabase() {
      const auth = useAuthStore()
      if (!supabase || !auth.isAuthenticated || !auth.profile?.save_carts) return
      await supabase.from('carts').upsert(
        {
          user_id: auth.user.id,
          items: this.items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    },
    async loadSaved() {
      const auth = useAuthStore()
      if (!supabase || !auth.isAuthenticated || !auth.profile?.save_carts) return
      const { data } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', auth.user.id)
        .maybeSingle()
      if (data?.items) this.items = data.items
    },
    async clearSaved() {
      const auth = useAuthStore()
      if (!supabase || !auth.isAuthenticated) return
      await supabase.from('carts').delete().eq('user_id', auth.user.id)
      this.items = []
    },
    async applyCoupon(code) {
      const clean = (code || '').trim().toUpperCase()
      if (!clean) return { error: 'Ingresa un código' }

      await checkAndDeactivateExpiredCoupons()

      const [couponsRes, rules, usages] = await Promise.all([
        listCoupons(),
        getCouponRules(),
        getCouponUsages(),
      ])

      const found = (couponsRes.data || []).find(
        (c) => c.code.toUpperCase() === clean,
      )
      if (!found) return { error: 'Cupón no encontrado' }
      if (!found.active) return { error: 'Este cupón se encuentra inactivo o vencido' }

      const rule = rules[clean] || {}
      const now = new Date()

      if (rule.expires_at) {
        const expDate = new Date(rule.expires_at)
        if (!isNaN(expDate.getTime()) && now.getTime() > expDate.getTime()) {
          await updateCoupon(found.id, { active: false })
          return { error: 'Este cupón ha vencido y ya no está disponible' }
        }
      }

      const codeUsages = usages[clean] || {}
      const totalUsed = Object.values(codeUsages).reduce((s, v) => s + (Number(v) || 0), 0)
      if (rule.total_usage_limit && Number(rule.total_usage_limit) > 0) {
        if (totalUsed >= Number(rule.total_usage_limit)) {
          await updateCoupon(found.id, { active: false })
          return { error: 'Este cupón ha alcanzado el límite máximo de usos' }
        }
      }

      const auth = useAuthStore()
      const userKey = auth.isAuthenticated ? auth.user.id : (auth.profile?.phone || null)
      if (userKey && rule.max_uses_per_user && Number(rule.max_uses_per_user) > 0) {
        const userUsed = codeUsages[userKey] || 0
        if (userUsed >= Number(rule.max_uses_per_user)) {
          return { error: `Ya has utilizado este cupón el máximo permitido (${rule.max_uses_per_user} vez/veces)` }
        }
      }

      this.coupon = { code: found.code, discount: found.discount }
      return { ok: true }
    },
    removeCoupon() {
      this.coupon = null
    },
    buildMessage(orderCode = null) {
      const currency = useCurrencyStore()
      const rate = currency.effectiveRate
      const formattedRate = currency.formattedRate
      const divider = '--------------------------------'
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      const itemsLines = this.items.map((item, index) => {
        const hasDisc = (Number(item.discount) || 0) > 0
        const origPrice = Number(item.originalPrice) || Number(item.price)
        const unitUsd = Number(item.price)
        const lineUsd = unitUsd * item.qty
        const unitBs = currency.formatBsNum(unitUsd)
        const lineBs = currency.formatBsNum(lineUsd)

        const discLine = hasDisc
          ? `    Descuento: -${item.discount}% (Reg: ${formatPrice(origPrice)})\n`
          : ''
        const link = item.id ? `${origin}/producto/${item.id}` : ''
        const linkLine = link ? `    Ver producto: ${link}` : ''
        return [
          `${index + 1}) *${item.name}*`,
          `    Cantidad: ${item.qty}`,
          discLine + `    Precio unitario: ${formatPrice(unitUsd)} (Bs. ${unitBs})`,
          `    Subtotal: ${formatPrice(lineUsd)} (Bs. ${lineBs})`,
          linkLine,
        ].filter(Boolean).join('\n')
      })

      const totalUsd = this.total
      const totalBs = currency.formatBsNum(totalUsd)
      const savingsUsd = this.totalSavings
      const savingsBs = currency.formatBsNum(savingsUsd)

      const savingsLines =
        this.totalSavings > 0
          ? [
              `*Ahorro total:* ${this.formattedTotalSavings} (Bs. ${savingsBs})`,
              divider,
            ]
          : []

      const couponLines = this.coupon
        ? [
            `Cupón: ${this.coupon.code} (-${this.coupon.discount}%)`,
            `Descuento cupón: -${formatPrice(this.discountAmount)} (Bs. ${currency.formatBsNum(this.discountAmount)})`,
            divider,
          ]
        : []

      const codeHeader = orderCode ? `*Orden:* ${orderCode}\n` : ''

      const header = [
        `*${STORE.name} Accesorios*`,
        '_Nuevo pedido / Solicitud de compra_',
        divider,
        codeHeader + `Fecha: ${new Date().toLocaleDateString('es-VE')}`,
        `*Tasa BCV del momento:* ${formattedRate} / USD`,
        divider,
      ]

      const subtotalRegularLine =
        this.itemsDiscountTotal > 0
          ? [`Subtotal regular: ${this.formattedRegularSubtotal} (Bs. ${currency.formatBsNum(this.regularSubtotal)})`]
          : []

      const footer = [
        divider,
        ...subtotalRegularLine,
        ...couponLines,
        ...savingsLines,
        `*TOTAL A PAGAR:*`,
        `👉 *USD: ${this.formattedTotal}*`,
        `👉 *BOLÍVARES (Bs.): Bs. ${totalBs}*`,
        divider,
        `_(Monto en Bs. calculado a la tasa oficial BCV: ${formattedRate} / USD)_`,
        '_Gracias por confiar en nosotros_',
      ]

      return [...header, ...itemsLines, ...footer].join('\n')
    },
    whatsappUrl(orderCode = null) {
      return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(this.buildMessage(orderCode))}`
    },
    async checkout() {
      const auth = useAuthStore()
      let orderCode = null

      if (supabase) {
        const orderData = {
          user_id: auth.isAuthenticated ? auth.user?.id : null,
          customer_name: auth.fullName || 'Cliente Web',
          customer_phone: auth.profile?.phone || null,
          subtotal: this.total,
          status: 'pendiente',
        }
        const res = await insertOrder(orderData, this.items)

        if (res?.data?.id) {
          orderCode = `#${String(res.data.id).padStart(4, '0')}`
          try {
            localStorage.setItem('detallitos_order_seq', String(res.data.id))
          } catch {}

          if (this.coupon) {
            await recordOrderCoupon(res.data.id, {
              code: this.coupon.code,
              discount: this.coupon.discount,
              amount: this.discountAmount,
            })
            const userKey = auth.user?.id || auth.profile?.phone || 'anonymous'
            await recordCouponUsage(this.coupon.code, userKey)
          }
        }
      }

      if (!orderCode) {
        let seq = 1
        try {
          const stored = localStorage.getItem('detallitos_order_seq')
          if (stored && !isNaN(parseInt(stored, 10))) {
            seq = parseInt(stored, 10) + 1
          }
        } catch {
          seq = 1
        }
        try {
          localStorage.setItem('detallitos_order_seq', String(seq))
        } catch {}
        orderCode = `#${String(seq).padStart(4, '0')}`
      }

      window.open(this.whatsappUrl(orderCode), '_blank')
    },
    receiptHtml(customOrder = null) {
      const auth = useAuthStore()
      const isCustom = Boolean(customOrder)
      const items = isCustom ? customOrder.order_items || [] : this.items
      let fallbackSeq = '0001'
      try {
        const stored = localStorage.getItem('detallitos_order_seq')
        if (stored && !isNaN(parseInt(stored, 10))) {
          fallbackSeq = String(parseInt(stored, 10)).padStart(4, '0')
        }
      } catch {}

      const orderId = isCustom
        ? `#${String(customOrder.id).padStart(4, '0')}`
        : `#${fallbackSeq}`
      const orderDate = isCustom
        ? new Date(customOrder.created_at).toLocaleDateString('es-VE')
        : new Date().toLocaleDateString('es-VE')
      const customerName = isCustom
        ? customOrder.profiles?.name || customOrder.customer_name || 'Cliente'
        : auth.fullName || 'Cliente'
      const customerPhone = isCustom
        ? customOrder.customer_phone || ''
        : auth.profile?.phone || ''

      const regularSubtotal = isCustom
        ? items.reduce(
            (s, i) => s + (Number(i.original_price || i.price) || 0) * i.qty,
            0,
          )
        : this.regularSubtotal

      const itemsSubtotal = isCustom
        ? items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
        : this.subtotal

      const itemsDiscount = Math.max(0, regularSubtotal - itemsSubtotal)
      const couponCode = isCustom ? (customOrder.coupon_code || '') : (this.coupon?.code || '')
      const couponDiscountPct = isCustom ? (customOrder.coupon_discount || 0) : (this.coupon?.discount || 0)
      const couponDisc = isCustom ? (Number(customOrder.coupon_amount) || 0) : this.discountAmount
      const totalSavings = isCustom ? (itemsDiscount + couponDisc) : this.totalSavings
      const finalTotal = isCustom
        ? Number(customOrder.subtotal) || itemsSubtotal
        : this.total

      const rows = items
        .map((item) => {
          const name =
            item.name ||
            item.products?.name ||
            item.product_name ||
            'Accesorio LG'
          const orig = Number(
            item.originalPrice ||
              item.original_price ||
              item.products?.old_price ||
              item.products?.price ||
              item.price,
          )
          const price = Number(item.price)
          const hasDiscount = orig > price
          const discPercent =
            item.discount ||
            item.products?.discount ||
            (hasDiscount ? Math.round(((orig - price) / orig) * 100) : 0)

          return `
          <tr>
            <td class="product">
              <strong>${name}</strong>
            </td>
            <td class="amount muted">
              ${hasDiscount ? `<span class="crossed">${formatPrice(orig)}</span>` : formatPrice(orig)}
            </td>
            <td class="disc-col">
              ${
                discPercent > 0
                  ? `<span class="disc-badge">-${discPercent}%</span>`
                  : `<span class="muted">—</span>`
              }
            </td>
            <td class="amount price-col">${formatPrice(price)}</td>
            <td class="q">${item.qty}</td>
            <td class="amount line-total">${formatPrice(price * item.qty)}</td>
          </tr>`
        })
        .join('')

      const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/img/logo.png` : '/img/logo.png'

      return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Factura ${orderId} - ${STORE.name} Accesorios</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #2e2629;
        background: #fdfbfb;
        padding: 40px 20px;
        line-height: 1.5;
      }
      .wrap {
        max-width: 720px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #f1e2e6;
        border-radius: 16px;
        padding: 40px 45px;
        box-shadow: 0 4px 20px rgba(184, 80, 112, 0.06);
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #fce8ed;
        padding-bottom: 24px;
        margin-bottom: 28px;
      }
      .brand-box {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .brand-logo {
        height: 52px;
        width: auto;
        object-fit: contain;
      }
      .brand {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 30px;
        font-weight: 700;
        color: #c92a54;
        letter-spacing: -0.5px;
        line-height: 1.1;
      }
      .brand-sub {
        font-size: 11px;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        color: #9c878e;
        margin-top: 4px;
        display: block;
      }
      .invoice-meta {
        text-align: right;
      }
      .invoice-title {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #c92a54;
        margin-bottom: 4px;
      }
      .invoice-num {
        font-size: 17px;
        font-weight: 700;
        color: #2e2629;
      }
      .invoice-date {
        font-size: 13px;
        color: #7d666e;
        margin-top: 4px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        background: #fff8f9;
        border: 1px solid #fce8ed;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 28px;
        font-size: 13px;
      }
      .info-block strong {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #c92a54;
        margin-bottom: 4px;
      }
      .info-block p {
        color: #4a3a41;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
      }
      th {
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8c767e;
        padding: 12px 10px;
        border-bottom: 2px solid #fce8ed;
        white-space: nowrap;
      }
      td {
        padding: 14px 10px;
        border-bottom: 1px solid #fbf0f3;
        font-size: 13.5px;
        vertical-align: middle;
      }
      .product {
        color: #2e2629;
        max-width: 220px;
      }
      .q, .amount, .disc-col {
        text-align: right;
      }
      .disc-col {
        text-align: center;
      }
      .muted {
        color: #9c878e;
      }
      .crossed {
        text-decoration: line-through;
        color: #b09ba2;
        font-size: 12px;
      }
      .disc-badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 6px;
        background: #fff0f3;
        color: #c92a54;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid #fed7e2;
      }
      .price-col {
        font-weight: 600;
        color: #2e2629;
      }
      .line-total {
        font-weight: 700;
        color: #2e2629;
      }
      .totals-area {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      .totals-box {
        width: 320px;
        background: #fff8f9;
        border: 1px solid #fce8ed;
        border-radius: 12px;
        padding: 18px 20px;
      }
      .tot-row {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        color: #5f4c54;
        margin-bottom: 9px;
      }
      .tot-row.disc {
        color: #c92a54;
        font-weight: 600;
      }
      .tot-row.grand-total {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 2px dashed #f5cbd5;
        font-size: 17px;
        font-weight: 800;
        color: #2e2629;
        align-items: center;
      }
      .tot-row.grand-total .amount {
        font-size: 20px;
        color: #c92a54;
      }
      .savings-banner {
        background: linear-gradient(135deg, #fff0f3 0%, #ffe3ea 100%);
        border: 1px solid #fccfd8;
        border-radius: 10px;
        padding: 12px 16px;
        margin-top: 22px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #b3264b;
        font-weight: 700;
        font-size: 13.5px;
      }
      .foot-notes {
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid #fce8ed;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        font-size: 12px;
        color: #7d666e;
      }
      .foot-notes strong {
        display: block;
        color: #3d2a31;
        margin-bottom: 3px;
        font-size: 12px;
      }
      .thank-you {
        margin-top: 26px;
        text-align: center;
        font-size: 12.5px;
        color: #9c878e;
      }
      @media print {
        body { background: #fff; padding: 0; }
        .wrap { border: none; box-shadow: none; padding: 15px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="head">
        <div class="brand-box">
          <img src="${logoUrl}" class="brand-logo" alt="${STORE.name}" />
          <div>
            <div class="brand">${STORE.name}</div>
            <span class="brand-sub">Accesorios &amp; Joyería Fina</span>
          </div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">Comprobante de Compra</div>
          <div class="invoice-num">${orderId}</div>
          <div class="invoice-date">Fecha: ${orderDate}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-block">
          <strong>Emisor:</strong>
          <p>${STORE.name} Accesorios</p>
          <p>${STORE.address}</p>
          <p>WhatsApp: +${STORE.whatsapp}</p>
        </div>
        <div class="info-block">
          <strong>Cliente:</strong>
          <p>${customerName}</p>
          ${customerPhone ? `<p>Tel: ${customerPhone}</p>` : ''}
          <p>Canal: Tienda Web</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="amount">Precio Reg.</th>
            <th class="disc-col">Descuento</th>
            <th class="amount">Precio Final</th>
            <th class="q">Cant.</th>
            <th class="amount">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals-area">
        <div class="totals-box">
          <div class="tot-row">
            <span>Subtotal regular</span>
            <span>${formatPrice(regularSubtotal)}</span>
          </div>
          ${
            itemsDiscount > 0
              ? `<div class="tot-row disc">
                  <span>Descuentos en productos</span>
                  <span>-${formatPrice(itemsDiscount)}</span>
                </div>`
              : ''
          }
          ${
            couponDisc > 0
              ? `<div class="tot-row disc">
                  <span>Cupón ${couponCode} (-${couponDiscountPct}%)</span>
                  <span>-${formatPrice(couponDisc)}</span>
                </div>`
              : ''
          }
          <div class="tot-row grand-total">
            <span>Total a pagar</span>
            <span class="amount">${formatPrice(finalTotal)}</span>
          </div>
          ${
            currency.effectiveRate
              ? `<div class="tot-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #f1e2e6; font-size: 15px; font-weight: 700; color: #b83253;">
                  <span>Total en Bolívares (Bs.)</span>
                  <span>Bs. ${currency.formatBsNum(finalTotal)}</span>
                </div>
                <div style="font-size: 11px; color: #888; text-align: right; margin-top: 3px;">
                  Tasa oficial BCV aplicada: ${currency.formattedRate} / USD
                </div>`
              : ''
          }
        </div>
      </div>

      ${
        totalSavings > 0
          ? `<div class="savings-banner">
              <span>🎉</span>
              <span>¡Felicidades! Ahorraste un total de <strong>${formatPrice(totalSavings)}</strong> en esta orden gracias a nuestras promociones y descuentos.</span>
            </div>`
          : ''
      }

      <div class="foot-notes">
        <div>
          <strong>Métodos de Pago:</strong>
          <p>Pago Móvil, Zelle, Transferencias bancarias nacionales, Efectivo en USD y Euros.</p>
        </div>
        <div>
          <strong>Atención &amp; Soporte:</strong>
          <p>Escríbenos a WhatsApp (+${STORE.whatsapp}) para confirmar tu pago y coordinar tu entrega.</p>
        </div>
      </div>

      <p class="thank-you">Gracias por elegir ${STORE.name} Accesorios · Hecho con amor</p>
    </div>
  </body>
</html>`
    },
    printInvoice(customOrder = null) {
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(this.receiptHtml(customOrder))
      win.document.close()
      setTimeout(() => win.print(), 350)
    },
  },
})
