/**
 * Returns a /uploads/<filename>?token=<jwt> URL so the browser can
 * navigate directly to a file endpoint without needing an Authorization header.
 */
export function fileUrl(filename) {
  if (!filename) return '#'
  const token = localStorage.getItem('token') || ''
  return `/uploads/${filename}${token ? `?token=${token}` : ''}`
}
