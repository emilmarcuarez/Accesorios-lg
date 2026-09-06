import { defineStore } from 'pinia'
import { getSetting, setSetting } from '@/lib/db'

// Fallback por defecto en caso de no haber conexión
const DEFAULT_RATE = 813.74

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    rate: Number(localStorage.getItem('detallitos_bcv_rate')) || DEFAULT_RATE,
    rateDate: localStorage.getItem('detallitos_bcv_date') || '',
    rateTime: localStorage.getItem('detallitos_bcv_time') || '',
    changePercentage: null,
    manualRate: null,
    autoUpdate: true,
    apiKey: '',
    loading: false,
    error: null,
    lastFetched: Number(localStorage.getItem('detallitos_bcv_last_fetched')) || 0,
    initialized: false,
  }),

  getters: {
    // Tasa efectiva a aplicar (si el admin fijó una tasa manual y desactivó auto, usa la manual)
    effectiveRate: (state) => {
      if (!state.autoUpdate && state.manualRate && state.manualRate > 0) {
        return Number(state.manualRate)
      }
      return Number(state.rate) > 0 ? Number(state.rate) : DEFAULT_RATE
    },

    // Formato con prefijo: "Bs. 813,74"
    formattedRate() {
      return `Bs. ${this.formatNumber(this.effectiveRate)}`
    },

    // Formato para mostrar: "1 USD = Bs. 813,74"
    rateText() {
      return `1 USD = ${this.formattedRate}`
    },

    // Fecha legible de la tasa
    formattedDate: (state) => {
      if (!state.rateDate) return 'Hoy'
      try {
        const [year, month, day] = state.rateDate.split('-')
        if (year && month && day) {
          return `${day}/${month}/${year}`
        }
      } catch {}
      return state.rateDate
    },
  },

  actions: {
    formatNumber(num) {
      const val = Number(num) || 0
      return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val)
    },

    // Convierte un monto en USD a Bs. numérico
    toBs(usdAmount) {
      const usd = Number(usdAmount) || 0
      return Math.round(usd * this.effectiveRate * 100) / 100
    },

    // Retorna sólo el número formateado en Bs. (ej: "8.137,40")
    formatBsNum(usdAmount) {
      return this.formatNumber(this.toBs(usdAmount))
    },

    // Retorna formateado con símbolo (ej: "Bs. 8.137,40")
    formatBs(usdAmount) {
      return `Bs. ${this.formatBsNum(usdAmount)}`
    },

    // Inicializa la configuración desde la BD (settings) y busca la tasa si es necesario
    async init() {
      if (this.initialized) return
      this.initialized = true

      try {
        const { data } = await getSetting('currency_config')
        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data
          if (parsed.apiKey) this.apiKey = parsed.apiKey
          if (parsed.manualRate !== undefined) this.manualRate = parsed.manualRate
          if (parsed.autoUpdate !== undefined) this.autoUpdate = parsed.autoUpdate
          if (parsed.savedRate) this.rate = Number(parsed.savedRate)
          if (parsed.savedDate) this.rateDate = parsed.savedDate
        }
      } catch (err) {
        console.warn('No se pudo cargar la configuración de moneda de la BD:', err)
      }

      await this.fetchRate()
    },

    // Consulta la tasa de cambio en vivo
    async fetchRate(force = false) {
      const now = Date.now()
      // Caché de 15 minutos en el cliente salvo que se fuerce
      if (!force && this.rate && this.lastFetched && now - this.lastFetched < 15 * 60 * 1000) {
        return { rate: this.effectiveRate, cached: true }
      }

      this.loading = true
      this.error = null

      let fetchedRate = null
      let fetchedDate = null
      let fetchedChange = null

      // 1. Intentar API oficial de DolarVZLA (CDN gratuito, rápido, CORS abierto)
      try {
        const headers = {}
        if (this.apiKey) {
          headers['x-dolarvzla-key'] = this.apiKey
        }

        const res = await fetch('https://rates.dolarvzla.com/bcv/current.json', {
          headers,
          cache: 'no-cache',
        })

        if (res.ok) {
          const json = await res.json()
          if (json?.current?.usd) {
            fetchedRate = Number(json.current.usd)
            fetchedDate = json.current.date || ''
            fetchedChange = json.changePercentage?.usd || null
          }
        }
      } catch (e) {
        console.warn('Fallo al conectar con rates.dolarvzla.com:', e)
      }

      // 2. Si DolarVZLA CDN falló y tenemos API Key, probar api.dolarvzla.com
      if (!fetchedRate && this.apiKey) {
        try {
          const res = await fetch('https://api.dolarvzla.com/public/exchange-rate', {
            headers: { 'x-dolarvzla-key': this.apiKey },
            cache: 'no-cache',
          })
          if (res.ok) {
            const json = await res.json()
            const val = json?.usd || json?.rate || json?.bcv
            if (val) {
              fetchedRate = Number(val)
              fetchedDate = json?.date || ''
            }
          }
        } catch (e) {
          console.warn('Fallo al conectar con api.dolarvzla.com:', e)
        }
      }

      // 3. Respaldo secundario: dolarapi.com
      if (!fetchedRate) {
        try {
          const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
            cache: 'no-cache',
          })
          if (res.ok) {
            const json = await res.json()
            if (json?.promedio) {
              fetchedRate = Number(json.promedio)
              fetchedDate = json.fechaActualizacion ? json.fechaActualizacion.split('T')[0] : ''
            }
          }
        } catch (e) {
          console.warn('Fallo al conectar con respaldo dolarapi.com:', e)
        }
      }

      this.loading = false

      if (fetchedRate && fetchedRate > 0) {
        this.rate = fetchedRate
        this.rateDate = fetchedDate || new Date().toISOString().split('T')[0]
        this.rateTime = new Date().toLocaleTimeString('es-VE')
        this.changePercentage = fetchedChange
        this.lastFetched = now

        try {
          localStorage.setItem('detallitos_bcv_rate', String(this.rate))
          localStorage.setItem('detallitos_bcv_date', this.rateDate)
          localStorage.setItem('detallitos_bcv_time', this.rateTime)
          localStorage.setItem('detallitos_bcv_last_fetched', String(now))
        } catch {}

        // Guardar silenciosamente en la BD para que otros visitantes tengan la tasa fresca
        try {
          setSetting('currency_config', JSON.stringify({
            apiKey: this.apiKey,
            manualRate: this.manualRate,
            autoUpdate: this.autoUpdate,
            savedRate: this.rate,
            savedDate: this.rateDate,
            lastFetched: now,
          })).catch(() => {})
        } catch {}

        return { rate: this.rate, ok: true }
      } else {
        this.error = 'No se pudo sincronizar la tasa en este momento. Se utilizará la tasa guardada.'
        return { rate: this.effectiveRate, ok: false, error: this.error }
      }
    },

    // Guardar ajustes desde el panel de administración
    async saveConfig(newConfig) {
      if (newConfig.apiKey !== undefined) this.apiKey = newConfig.apiKey
      if (newConfig.manualRate !== undefined) this.manualRate = Number(newConfig.manualRate) || null
      if (newConfig.autoUpdate !== undefined) this.autoUpdate = Boolean(newConfig.autoUpdate)

      const payload = {
        apiKey: this.apiKey,
        manualRate: this.manualRate,
        autoUpdate: this.autoUpdate,
        savedRate: this.rate,
        savedDate: this.rateDate,
        lastFetched: this.lastFetched,
      }

      await setSetting('currency_config', JSON.stringify(payload))
      return { ok: true }
    },
  },
})
