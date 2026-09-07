import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    ready: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.profile?.role === 'admin',
    fullName: (state) =>
      [state.profile?.name, state.profile?.lastname].filter(Boolean).join(' ') || null,
  },
  actions: {
    async init() {
      if (!supabase) {
        this.ready = true
        return
      }
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user ?? null
      if (this.user) await this.fetchProfile()
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
        if (this.user) this.fetchProfile()
        else {
          this.user = null
          this.profile = null
        }
      })
      this.ready = true
    },
    async fetchProfile() {
      if (!supabase || !this.user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()
      this.profile = data
    },
    async signUp({ name, lastname, phone, email, password, saveCarts, notifications }) {
      if (!supabase) return { error: 'Supabase no configurado' }
      this.loading = true

      const cleanEmail = (email || '').trim().toLowerCase()
      const cleanPhone = (phone || '').trim()

      // Verificar si el teléfono ya está registrado en profiles
      if (cleanPhone) {
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .maybeSingle()
          if (existingProfile) {
            this.loading = false
            return { error: 'Este número de teléfono ya está registrado con otra cuenta.' }
          }
        } catch (e) {
          console.warn('Error verificando teléfono:', e)
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name, lastname, phone: cleanPhone, save_carts: saveCarts, notifications: notifications },
        },
      })

      if (error) {
        this.loading = false
        const msg = error.message || ''
        const lower = msg.toLowerCase()
        if (lower.includes('already registered') || lower.includes('already in use') || lower.includes('unique constraint')) {
          return { error: 'Este correo electrónico ya se encuentra registrado. Por favor inicia sesión.' }
        }
        if (lower.includes('confirmation email')) {
          return { error: 'Debes desactivar "Confirm email" en Supabase: Ve a Authentication > Providers > Email y desmarca "Confirm email".' }
        }
        return { error: msg }
      }

      // Supabase con email enumeration protection retorna user pero identities = []
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        this.loading = false
        return { error: 'Este correo electrónico ya se encuentra registrado. Por favor inicia sesión.' }
      }

      if (data.user) {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            name,
            lastname,
            phone: cleanPhone,
            save_carts: saveCarts,
            notifications: notifications,
          },
          { onConflict: 'id' },
        )
      }

      this.loading = false
      this.user = data.user
      if (this.user) await this.fetchProfile()
      return { user: data.user, session: data.session }
    },
    async signIn(email, password) {
      if (!supabase) return { error: 'Supabase no configurado' }
      this.loading = true
      const { data, error } = await supabase.auth.signInWithPassword({ email: (email || '').trim().toLowerCase(), password })
      this.loading = false
      if (error) {
        const msg = error.message || ''
        if (msg.toLowerCase().includes('invalid login credentials')) {
          return { error: 'Correo o contraseña incorrectos.' }
        }
        if (msg.toLowerCase().includes('email not confirmed')) {
          return { error: 'El correo no ha sido confirmado. En Supabase desactiva "Confirm email" en Authentication > Providers > Email.' }
        }
        return { error: msg }
      }
      this.user = data.user
      await this.fetchProfile()
      return { user: data.user }
    },
    async signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },
    async updateProfile(patch) {
      if (!supabase || !this.user) return
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', this.user.id)
      if (!error) this.fetchProfile()
    },
    async resetPassword(email) {
      if (!supabase) return { error: 'Supabase no configurado' }
      const cleanEmail = (email || '').trim().toLowerCase()
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        const msg = error.message || ''
        const lower = msg.toLowerCase()
        if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
          return { error: 'Límite de envíos alcanzado por hora en Supabase. Espera unos minutos o configura un SMTP en Supabase.' }
        }
        if (lower.includes('confirmation email') || lower.includes('error sending')) {
          return { error: 'Error al enviar correo desde Supabase. Asegúrate de configurar un Custom SMTP (como Resend o Gmail) en Supabase.' }
        }
        return { error: msg }
      }
      return { ok: true }
    },
    async updatePassword(password) {
      if (!supabase) return { error: 'Supabase no configurado' }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: error.message }
      return { ok: true }
    },
  },
})
