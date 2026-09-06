import { defineStore } from 'pinia'
import { getSetting, setSetting } from '@/lib/db'
import { STORE, DEFAULT_STORE, updateStoreConfig } from '@/config'

export const DEFAULT_HERO = {
  badge: 'Colección Exclusiva 2025',
  eyebrow: 'Pequeños detalles,',
  title: 'grandes',
  titleAccent: 'recuerdos',
  text: 'Accesorios que cuentan tu historia y realzan tu esencia.',
  buttonText: 'Descubre la colección',
  buttonLink: '/tienda',
  image: 'https://emilmarpatricia.x02.me/i/TQQNS.png',
}

export const DEFAULT_BANNERS = {
  banner1: {
    title: 'Para ti,\ncon amor',
    text: 'Detalles que te hacen brillar todos los días.',
    buttonText: 'Nuestra alegría para ti',
    buttonLink: '/tienda',
    image: '/img/mujer.png',
  },
  banner2: {
    title: 'El regalo\nperfecto',
    text: 'Sorprende a quien más amas con algo inolvidable.',
    buttonText: 'Ver opciones de regalo',
    buttonLink: '/tienda/personalizados',
    image: '/img/regalo.png',
  },
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    lowStock: 5,
    hero: { ...DEFAULT_HERO },
    banners: {
      banner1: { ...DEFAULT_BANNERS.banner1 },
      banner2: { ...DEFAULT_BANNERS.banner2 },
    },
    storeInfo: { ...DEFAULT_STORE },
    loaded: false,
  }),
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      const [stockRes, bannersRes, storeRes, heroRes] = await Promise.all([
        getSetting('low_stock_threshold'),
        getSetting('home_promo_banners'),
        getSetting('store_info'),
        getSetting('home_hero'),
      ])

      if (stockRes.data !== null && stockRes.data !== undefined && stockRes.data !== '') {
        this.lowStock = Number(stockRes.data) || 5
      }

      if (heroRes?.data) {
        try {
          const parsed = typeof heroRes.data === 'string' ? JSON.parse(heroRes.data) : heroRes.data
          this.hero = { ...DEFAULT_HERO, ...parsed }
        } catch {
          this.hero = { ...DEFAULT_HERO }
        }
      }

      if (bannersRes.data) {
        try {
          const parsed = typeof bannersRes.data === 'string' ? JSON.parse(bannersRes.data) : bannersRes.data
          this.banners = {
            banner1: { ...DEFAULT_BANNERS.banner1, ...(parsed?.banner1 || {}) },
            banner2: { ...DEFAULT_BANNERS.banner2, ...(parsed?.banner2 || {}) },
          }
        } catch {
          this.banners = {
            banner1: { ...DEFAULT_BANNERS.banner1 },
            banner2: { ...DEFAULT_BANNERS.banner2 },
          }
        }
      }

      if (storeRes.data) {
        try {
          const parsedStore = typeof storeRes.data === 'string' ? JSON.parse(storeRes.data) : storeRes.data
          this.storeInfo = { ...DEFAULT_STORE, ...parsedStore }
          updateStoreConfig(this.storeInfo)
        } catch {
          this.storeInfo = { ...DEFAULT_STORE }
          updateStoreConfig(this.storeInfo)
        }
      }

      this.loaded = true
    },
    async saveStoreInfo(info) {
      this.storeInfo = { ...this.storeInfo, ...info }
      updateStoreConfig(this.storeInfo)
      return await setSetting('store_info', JSON.stringify(this.storeInfo))
    },
    async saveLowStock(threshold) {
      this.lowStock = Number(threshold) || 5
      return await setSetting('low_stock_threshold', String(this.lowStock))
    },
    async saveHero(newHero) {
      this.hero = { ...this.hero, ...newHero }
      return await setSetting('home_hero', JSON.stringify(this.hero))
    },
    async saveBanners(newBanners) {
      this.banners = {
        banner1: { ...this.banners.banner1, ...newBanners.banner1 },
        banner2: { ...this.banners.banner2, ...newBanners.banner2 },
      }
      return await setSetting('home_promo_banners', JSON.stringify(this.banners))
    },
  },
})
