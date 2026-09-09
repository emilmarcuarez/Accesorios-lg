export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const url = req.query?.url || req.body?.url
  if (!url) {
    return res.status(400).json({ error: 'Falta la URL de la imagen a eliminar' })
  }

  const key = process.env.VITE_X02 || process.env.X02_KEY || 'af5094f4148e430a96985bfe1e47090e'

  try {
    if (url.includes('/i/')) {
      const fileName = url.split('/i/')[1].split('?')[0]
      if (fileName) {
        // 1. Intentar DELETE a /api/user/images/:filename
        const delRes = await fetch(`https://x02.me/api/user/images/${fileName}`, {
          method: 'DELETE',
          headers: { 'x-api-key': key },
        })

        if (delRes.ok) {
          return res.status(200).json({ success: true, method: 'DELETE', fileName })
        }

        // 2. Intentar GET a /api/delete/:filename?apiKey=...
        const getRes = await fetch(`https://x02.me/api/delete/${fileName}?apiKey=${key}`)
        if (getRes.ok) {
          return res.status(200).json({ success: true, method: 'GET', fileName })
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Procesado' })
  } catch (err) {
    console.error('Error al eliminar en servidor x02:', err)
    return res.status(500).json({ error: err.message || 'Error al eliminar imagen' })
  }
}
