/**
 * Extrae las opciones / variantes de un producto si existen.
 * Retorna { hasOptions: boolean, options: Array<{ id, name, image, stock }> }
 */
export function parseProductOptions(val) {
  if (!val) return { hasOptions: false, options: [] }
  if (typeof val === 'object' && val !== null) {
    if (val.has_options || val.hasOptions) {
      const opts = Array.isArray(val.options) ? val.options : []
      return {
        hasOptions: true,
        options: opts.map((opt, i) => ({
          id: opt.id || `opt_${i + 1}`,
          name: opt.name || `Opción ${i + 1}`,
          image: opt.image || '',
          stock: Number(opt.stock) ?? 0,
        })),
      }
    }
    return { hasOptions: false, options: [] }
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && (parsed.has_options || parsed.hasOptions)) {
          const opts = Array.isArray(parsed.options) ? parsed.options : []
          return {
            hasOptions: true,
            options: opts.map((opt, i) => ({
              id: opt.id || `opt_${i + 1}`,
              name: opt.name || `Opción ${i + 1}`,
              image: opt.image || '',
              stock: Number(opt.stock) ?? 0,
            })),
          }
        }
      } catch {}
    }
  }
  return { hasOptions: false, options: [] }
}

/**
 * Extrae una lista de URLs de imágenes a partir del campo de imagen de un producto.
 * Soporta arrays, JSON strings, URLs individuales y objetos de variantes.
 */
export function parseProductImages(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'object' && val !== null) {
    if (Array.isArray(val.images) && val.images.length > 0) {
      return val.images.filter(Boolean)
    }
    if (Array.isArray(val.options) && val.options.length > 0) {
      return val.options.map((o) => o.image).filter(Boolean)
    }
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed.images) && parsed.images.length > 0) {
          return parsed.images.filter(Boolean)
        }
        if (Array.isArray(parsed.options) && parsed.options.length > 0) {
          return parsed.options.map((o) => o.image).filter(Boolean)
        }
      } catch {}
    }
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
 * Si recibe un array, objeto o JSON string, resuelve la primera imagen válida.
 */
export function resolveImage(url) {
  if (!url) return ''
  if (Array.isArray(url)) {
    return resolveImage(url[0])
  }
  if (typeof url === 'object' && url !== null) {
    if (url.image) return resolveImage(url.image)
    if (Array.isArray(url.images) && url.images.length > 0) return resolveImage(url.images[0])
    if (Array.isArray(url.options) && url.options.length > 0) return resolveImage(url.options[0].image)
  }
  if (typeof url === 'string') {
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.image) return resolveImage(parsed.image)
        if (Array.isArray(parsed.images) && parsed.images.length > 0) return resolveImage(parsed.images[0])
        if (Array.isArray(parsed.options) && parsed.options.length > 0) return resolveImage(parsed.options[0].image)
      } catch {}
    }
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
