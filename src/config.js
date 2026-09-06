import { reactive } from 'vue'

export const DEFAULT_STORE = {
  name: 'Detallitos',
  tagline: 'Accesorios',
  whatsapp: '584147675878',
  email: 'hola@detallitosaccesorios.com',
  instagram: '@detallitoslg',
  facebook: 'https://facebook.com',
  tiktok: 'https://tiktok.com',
  coupon: 'BIENVENIDA',
  freeShipping: 60,
  address: 'Puerto Ordaz, Venezuela',
  currency: { code: 'USD', locale: 'es-VE', symbol: '$' },
}

export const STORE = reactive({ ...DEFAULT_STORE })

export function updateStoreConfig(patch) {
  if (!patch) return
  Object.assign(STORE, patch)
}
