/**
 * Extrae una lista de URLs de imágenes a partir del campo de imagen de un producto.
 * Soporta arrays, strings en formato JSON ('["url1","url2"]') o URLs individuales.
 */
export function parseProductImages(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.filter(Boolean)
      } catch {}
    }
    return [trimmed]
  }
  return []
}

/**
 * Resuelve una URL de imagen a través del proxy /api/img si es necesario.
 * Si recibe un array o JSON string, resuelve la primera imagen.
 */
export function resolveImage(url) {
  if (!url) return ''
  if (Array.isArray(url)) {
    return resolveImage(url[0])
  }
  if (typeof url === 'string') {
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return resolveImage(parsed[0])
        }
      } catch {}
    }
    if (trimmed.startsWith('/')) return trimmed
    return `/api/img?src=${encodeURIComponent(trimmed)}`
  }
  return ''
}
