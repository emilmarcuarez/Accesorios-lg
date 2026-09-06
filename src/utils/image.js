export function resolveImage(url) {
  if (!url) return ''
  if (url.startsWith('/')) return url
  return `/api/img?src=${encodeURIComponent(url)}`
}
