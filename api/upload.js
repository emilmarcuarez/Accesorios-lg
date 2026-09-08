export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const key = process.env.VITE_X02 || process.env.X02_KEY || 'af5094f4148e430a96985bfe1e47090e'
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
    } catch { }

    if (!forwardRes.ok) {
      return res.status(forwardRes.status).json({ error: text || 'Error al subir a x02.me' })
    }

    return res.status(200).json({ url })
  } catch (err) {
    console.error('Error proxying to x02.me:', err)
    return res.status(500).json({ error: err.message || 'Error en el servidor proxy de subida' })
  }
}
