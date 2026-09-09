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

      server.middlewares.use('/api/upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)
          const key = process.env.VITE_X02 || 'af5094f4148e430a96985bfe1e47090e'
          const forwardRes = await fetch('https://x02.me/api/upload', {
            method: 'POST',
            headers: {
              'x-api-key': key,
              'content-type': req.headers['content-type'] || 'application/octet-stream',
            },
            body: buffer,
          })
          const text = await forwardRes.text()
          let url = text.trim()
          try {
            const j = JSON.parse(text)
            url = j.url || j.link || j.direct || j.data?.url || text.trim()
          } catch {}
          res.statusCode = forwardRes.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ url }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use('/api/delete', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost')
        const targetUrl = urlObj.searchParams.get('url')
        if (!targetUrl) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'url required' }))
          return
        }
        const key = process.env.VITE_X02 || 'af5094f4148e430a96985bfe1e47090e'
        try {
          if (targetUrl.includes('/i/')) {
            const fileName = targetUrl.split('/i/')[1].split('?')[0]
            if (fileName) {
              await fetch(`https://x02.me/api/user/images/${fileName}`, {
                method: 'DELETE',
                headers: { 'x-api-key': key },
              }).catch(() => {})
              await fetch(`https://x02.me/api/delete/${fileName}?apiKey=${key}`).catch(() => {})
            }
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
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
