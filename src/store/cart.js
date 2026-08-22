import { defineStore } from 'pinia'
import { STORE } from '@/config'
import { formatPrice, formatNumber } from '@/utils/format'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    drawerOpen: false,
  }),
  getters: {
    count: (state) => state.items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: (state) =>
      state.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    formattedSubtotal: (state) => formatPrice(state.subtotal),
  },
  actions: {
    add(product) {
      const existing = this.items.find((item) => item.id === product.id)
      if (existing) {
        existing.qty += 1
      } else {
        this.items.push({ ...product, qty: 1 })
      }
      this.drawerOpen = true
    },
    increase(id) {
      const item = this.items.find((item) => item.id === id)
      if (item) item.qty += 1
    },
    decrease(id) {
      const item = this.items.find((item) => item.id === id)
      if (!item) return
      item.qty -= 1
      if (item.qty <= 0) this.remove(id)
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
    toggleDrawer(value) {
      this.drawerOpen = value ?? !this.drawerOpen
    },
    clear() {
      this.items = []
    },
    buildMessage() {
      const divider = '--------------------------------'
      const itemsLines = this.items.map((item, index) => {
        return [
          `${index + 1}) ${item.name}`,
          `    Cantidad: ${item.qty}`,
          `    Precio: ${formatPrice(item.price)}`,
        ].join('\n')
      })
      const header = [
        `*${STORE.name} Accesorios*`,
        '_Nuevo pedido_',
        divider,
        `Fecha: ${new Date().toLocaleDateString('es-VE')}`,
        divider,
      ]
      const footer = [
        divider,
        `*Total: ${formatPrice(this.subtotal)}*`,
        divider,
        '_Gracias por confiar en nosotros_',
      ]
      return [...header, ...itemsLines, ...footer].join('\n')
    },
    whatsappUrl() {
      return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(this.buildMessage())}`
    },
    checkout() {
      window.open(this.whatsappUrl(), '_blank')
    },
    receiptHtml() {
      const rows = this.items
        .map(
          (item) => `
          <tr>
            <td class="product">${item.name}</td>
            <td class="q">${item.qty}</td>
            <td class="amount">${formatPrice(item.price)}</td>
            <td class="amount">${formatPrice(item.price * item.qty)}</td>
          </tr>`,
        )
        .join('')
      return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Orden ${STORE.name}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #4a3a41; margin: 0; padding: 30px; background: #fff; }
      .wrap { max-width: 640px; margin: 0 auto; }
      .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eaa9bb; padding-bottom: 20px; margin-bottom: 28px; }
      .brand { font-family: Georgia, serif; font-size: 30px; line-height: 1.1; color: #c9526f; }
      .brand small { display: block; font-size: 12px; letter-spacing: 2px; color: #9c878e; margin-top: 4px; }
      .meta { text-align: right; font-size: 13px; color: #7d666e; line-height: 1.7; }
      .meta strong { color: #3d2a31; display: block; font-size: 14px; }
      h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #3d2a31; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; font-size: 11px; letter-spacing: 0.12em; color: #9c878e; text-transform: uppercase; padding: 10px 12px; border-bottom: 2px solid #eaa9bb; white-space: nowrap; }
      td { padding: 14px 12px; border-bottom: 1px solid #f7e9ec; font-size: 14px; }
      .q, .amount { text-align: right; }
      .q { width: 70px; }
      .amount { width: 130px; white-space: nowrap; }
      .product { color: #4a3a41; }
      .total-row td { border-bottom: none; padding-top: 18px; }
      .total-label { font-size: 14px; color: #7d666e; }
      .total-amount { font-size: 20px; font-weight: 700; color: #c9526f; }
      .summary { margin-top: 26px; font-size: 13px; color: #7d666e; }
      .foot { margin-top: 40px; padding-top: 18px; border-top: 1px solid #f0dfe4; font-size: 13px; color: #9c878e; text-align: center; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="head">
        <div class="brand">${STORE.name}<small>Accesorios</small></div>
        <div class="meta">
          <strong>Orden</strong>
          ${STORE.address}
          WhatsApp: +${STORE.whatsapp}
        </div>
      </div>
      <h2>Resumen de tu orden</h2>
      <table>
        <thead>
          <tr><th>Producto</th><th class="q">Cant.</th><th class="amount">Precio</th><th class="amount">Subtotal</th></tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td class="total-label">Total</td>
            <td></td>
            <td></td>
            <td class="amount total-amount">${formatPrice(this.subtotal)}</td>
          </tr>
        </tbody>
      </table>
      <p class="summary">Fecha: ${new Date().toLocaleDateString('es-VE')} &mdash; ${this.count} artículo(s)</p>
      <p class="foot">Gracias por confiar en ${STORE.name} Accesorios</p>
    </div>
  </body>
</html>`
    },
    printInvoice() {
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(this.receiptHtml())
      win.document.close()
      setTimeout(() => win.print(), 350)
    },
  },
})
