import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loading: true,
    waitingForVideo: false,
    videoReady: false,
  }),
  actions: {
    show() {
      this.loading = true
    },
    hide() {
      // Si estamos esperando a que cargue el video del hero, no ocultamos el spinner aún
      if (this.waitingForVideo && !this.videoReady) {
        return
      }
      this.loading = false
    },
    setWaitingForVideo(waiting) {
      this.waitingForVideo = Boolean(waiting)
      if (waiting) {
        this.videoReady = false
        this.loading = true
      }
    },
    markVideoReady() {
      this.videoReady = true
      this.waitingForVideo = false
      this.loading = false
    },
  },
})
