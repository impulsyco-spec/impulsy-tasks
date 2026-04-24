export function getLogoUrl(url) {
  if (!url) return null
  const cleanUrl = (url.startsWith('http') || url.startsWith('/') ? url : '/logos/' + url)
  return `${cleanUrl}?t=${Date.now()}`
}
