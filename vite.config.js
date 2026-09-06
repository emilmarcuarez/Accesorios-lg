import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function imageProxy() {
  return {
    name: 'image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/img', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const src = url.searchParams.get('src')
        if (!src) {
          res.statusCode = 400
          res.end('src required')
          return
        }
        try {
          const r = await fetch(src)
          if (!r.ok) {
            res.statusCode = r.status
            res.end('error')
            return
          }
          const buf = await r.arrayBuffer()
          res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(Buffer.from(buf))
        } catch {
          res.statusCode = 500
          res.end('error')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), imageProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
