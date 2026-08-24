import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loading: true,
  }),
  actions: {
    show() {
      this.loading = true
    },
    hide() {
      this.loading = false
    },
  },
})
