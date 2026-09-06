export default async function handler(req, res) {
  const url = req.query.src
  if (!url || !/^https?:\/\//.test(url)) {
    res.status(400).end('src inválida')
    return
  }
  try {
    const r = await fetch(url)
    if (!r.ok) {
      res.status(r.status).end('error')
      return
    }
    const buf = await r.arrayBuffer()
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(Buffer.from(buf))
  } catch {
    res.status(500).end('error')
  }
}
