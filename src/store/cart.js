import { defineStore } from 'pinia'
import { STORE } from '@/config'
import { formatPrice, formatNumber } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { insertOrder, listCoupons } from '@/lib/db'

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
      state.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    itemsDiscountTotal() {
      return Math.max(0, this.regularSubtotal - this.subtotal)
    },
    discountAmount: (state) =>
      state.coupon ? (state.subtotal * state.coupon.discount) / 100 : 0,
    totalSavings() {
      return this.itemsDiscountTotal + this.discountAmount
    },
    total() {
      return Math.max(0, this.subtotal - this.discountAmount)
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
    async add(product) {
      const originalPrice =
        product.originalPrice || product.oldPrice || product.price
      const discount = product.discount || 0
      const existing = this.items.find((item) => item.id === product.id)
      if (existing) {
        existing.qty += 1
        existing.originalPrice = originalPrice
        existing.price = product.price
        existing.discount = discount
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          category: product.category,
          categoryName: product.categoryName,
          image: product.image,
          originalPrice: originalPrice,
          price: product.price,
          discount: discount,
          qty: 1,
        })
      }
      this.drawerOpen = true
      this.save()
    },
    async increase(id) {
      const item = this.items.find((item) => item.id === id)
      if (item) item.qty += 1
      this.save()
    },
    async decrease(id) {
      const item = this.items.find((item) => item.id === id)
      if (!item) return
      item.qty -= 1
      if (item.qty <= 0) this.remove(id)
      else this.save()
    },
    async remove(id) {
      this.items = this.items.filter((item) => item.id !== id)
      this.save()
    },
    toggleDrawer(value) {
      this.drawerOpen = value ?? !this.drawerOpen
    },
    async clear() {
      this.items = []
      this.save()
    },
    async save() {
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
      const { data } = await listCoupons()
      const found = (data || []).find(
        (c) => c.active && c.code.toUpperCase() === clean,
      )
      if (!found) return { error: 'Cupón inválido o inactivo' }
      this.coupon = { code: found.code, discount: found.discount }
      return { ok: true }
    },
    removeCoupon() {
      this.coupon = null
    },
    buildMessage() {
      const divider = '--------------------------------'
      const itemsLines = this.items.map((item, index) => {
        const hasDisc = (Number(item.discount) || 0) > 0
        const origPrice = Number(item.originalPrice) || Number(item.price)
        const discLine = hasDisc
          ? `    Descuento: -${item.discount}% (Reg: ${formatPrice(origPrice)})\n`
          : ''
        return [
          `${index + 1}) *${item.name}*`,
          `    Cantidad: ${item.qty}`,
          discLine + `    Precio unitario: ${formatPrice(item.price)}`,
          `    Subtotal: ${formatPrice(item.price * item.qty)}`,
        ].join('\n')
      })

      const savingsLines =
        this.totalSavings > 0
          ? [
              `*Ahorro total:* ${this.formattedTotalSavings}`,
              divider,
            ]
          : []

      const couponLines = this.coupon
        ? [
            `Cupón: ${this.coupon.code} (-${this.coupon.discount}%)`,
            `Descuento cupón: -${formatPrice(this.discountAmount)}`,
            divider,
          ]
        : []

      const header = [
        `*${STORE.name} Accesorios*`,
        '_Nuevo pedido / Solicitud de compra_',
        divider,
        `Fecha: ${new Date().toLocaleDateString('es-VE')}`,
        divider,
      ]

      const subtotalRegularLine =
        this.itemsDiscountTotal > 0
          ? [`Subtotal regular: ${this.formattedRegularSubtotal}`]
          : []

      const footer = [
        divider,
        ...subtotalRegularLine,
        ...couponLines,
        ...savingsLines,
        `*TOTAL A PAGAR: ${this.formattedTotal}*`,
        divider,
        '_Gracias por confiar en nosotros_',
      ]

      return [...header, ...itemsLines, ...footer].join('\n')
    },
    whatsappUrl() {
      return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(this.buildMessage())}`
    },
    async checkout() {
      const auth = useAuthStore()
      if (supabase && auth.isAuthenticated) {
        await insertOrder(
          {
            user_id: auth.user.id,
            customer_name: auth.fullName,
            customer_phone: auth.profile?.phone,
            subtotal: this.total,
            status: 'pendiente',
          },
          this.items,
        )
      }
      window.open(this.whatsappUrl(), '_blank')
    },
    receiptHtml(customOrder = null) {
      const auth = useAuthStore()
      const isCustom = Boolean(customOrder)
      const items = isCustom ? customOrder.order_items || [] : this.items
      const orderId = isCustom
        ? `#${String(customOrder.id).padStart(4, '0')}`
        : `#FAC-${Date.now().toString().slice(-6)}`
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
      const couponDisc = isCustom ? 0 : this.discountAmount
      const totalSavings = isCustom ? itemsDiscount : this.totalSavings
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
        align-items: flex-start;
        border-bottom: 2px solid #fce8ed;
        padding-bottom: 24px;
        margin-bottom: 28px;
      }
      .brand {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 32px;
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
        margin-top: 6px;
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
        <div>
          <div class="brand">${STORE.name}</div>
          <span class="brand-sub">Accesorios &amp; Joyería Fina</span>
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
                  <span>Cupón ${this.coupon?.code || ''} (-${this.coupon?.discount || 0}%)</span>
                  <span>-${formatPrice(couponDisc)}</span>
                </div>`
              : ''
          }
          <div class="tot-row grand-total">
            <span>Total a pagar</span>
            <span class="amount">${formatPrice(finalTotal)}</span>
          </div>
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
