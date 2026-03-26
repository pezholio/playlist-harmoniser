const CACHE_PREFIX = 'ph_'
const CACHE_VERSION = 1

function cacheKey(namespace, key) {
  return `${CACHE_PREFIX}v${CACHE_VERSION}_${namespace}_${key}`
}

export function getCached(namespace, key) {
  try {
    const raw = localStorage.getItem(cacheKey(namespace, key))
    if (!raw) return undefined
    const entry = JSON.parse(raw)
    // Expire after 7 days
    if (Date.now() - entry.ts > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey(namespace, key))
      return undefined
    }
    return entry.data
  } catch {
    return undefined
  }
}

export function setCache(namespace, key, data) {
  try {
    localStorage.setItem(
      cacheKey(namespace, key),
      JSON.stringify({ data, ts: Date.now() })
    )
  } catch {
    // localStorage full — silently ignore
  }
}
