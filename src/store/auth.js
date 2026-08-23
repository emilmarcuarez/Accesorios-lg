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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, lastname, phone, save_carts: saveCarts, notifications: notifications },
        },
      })
      if (error) {
        this.loading = false
        return { error: error.message }
      }
      this.loading = false
      this.user = data.user
      return { user: data.user }
    },
    async signIn(email, password) {
      if (!supabase) return { error: 'Supabase no configurado' }
      this.loading = true
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      this.loading = false
      if (error) return { error: error.message }
      this.user = data.user
      await this.fetchProfile()
      return { user: data.user }
    },
    async signInWithGoogle() {
      if (!supabase) return
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
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
  },
})
