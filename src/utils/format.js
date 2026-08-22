import { STORE } from '@/config'

export function formatPrice(value) {
  return `${STORE.currency.symbol}${formatNumber(value)}`
}

export function formatNumber(value) {
  return new Intl.NumberFormat(STORE.currency.locale, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}
