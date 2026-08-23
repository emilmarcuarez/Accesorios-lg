import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getFavorites, setFavorites } from '@/lib/db'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    ids: [],
    popupOpen: false,
  }),
  getters: {
    count: (state) => state.ids.length,
    isFav: (state) => (id) => state.ids.includes(id),
  },
  actions: {
    async load() {
      const auth = useAuthStore()
      if (!supabase || !auth.isAuthenticated) return
      const { data } = await getFavorites(auth.user.id)
      this.ids = data?.product_ids || []
    },
    async toggle(productId) {
      const auth = useAuthStore()
      if (!supabase || !auth.isAuthenticated) {
        this.popupOpen = true
        return
      }
      if (this.ids.includes(productId)) {
        this.ids = this.ids.filter((id) => id !== productId)
      } else {
        this.ids.push(productId)
      }
      await setFavorites(auth.user.id, this.ids)
    },
    closePopup() {
      this.popupOpen = false
    },
  },
})
