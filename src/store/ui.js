import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loading: true,
    appReady: false,
    waitingForVideo: false,
    videoReady: false,
    initialLoadDismissed: false,
  }),
  actions: {
    show() {
      if (this.initialLoadDismissed) {
        return
      }
      this.loading = true
    },
    hide() {
      if (this.waitingForVideo && !this.videoReady) {
        return
      }
      this.loading = false
      this.initialLoadDismissed = true
    },
    setWaitingForVideo(waiting) {
      if (this.initialLoadDismissed) {
        return
      }
      const shouldWait = Boolean(waiting)
      this.waitingForVideo = shouldWait
      if (shouldWait && !this.videoReady) {
        this.loading = true
      } else if (this.appReady) {
        this.loading = false
        this.initialLoadDismissed = true
      }
    },
    markAppReady() {
      this.appReady = true
      if (!this.waitingForVideo || this.videoReady) {
        this.loading = false
        this.initialLoadDismissed = true
      }
    },
    markVideoReady() {
      this.videoReady = true
      this.waitingForVideo = false
      if (this.appReady) {
        this.loading = false
        this.initialLoadDismissed = true
      }
    },
  },
})
