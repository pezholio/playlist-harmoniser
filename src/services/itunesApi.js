// Uses Deezer API (via Vite proxy) for track search and preview URLs
// Deezer is free, no auth required, and provides 30-second preview URLs

import { getCached, setCache } from './cache.js'

export async function searchTrack(query) {
  const cacheKey = query.toLowerCase().trim()
  const cached = getCached('search', cacheKey)
  if (cached !== undefined) return cached

  const encoded = encodeURIComponent(query)
  const response = await fetch(`/api/deezer/search?q=${encoded}&limit=1`)

  if (!response.ok) {
    throw new Error(`Deezer search failed: ${response.status}`)
  }

  const data = await response.json()
  const result = data.data?.[0]

  if (!result) {
    setCache('search', cacheKey, null)
    return null
  }

  const track = {
    id: String(result.id),
    name: result.title,
    artists: [{ name: result.artist?.name }],
    album: {
      name: result.album?.title,
      images: [
        { url: result.album?.cover_big },
        {},
        { url: result.album?.cover_small },
      ],
    },
    previewUrl: result.preview,
    duration_ms: result.duration * 1000,
  }

  setCache('search', cacheKey, track)
  return track
}

// Match a list of track strings against Deezer
export async function matchTracks(trackStrings, onProgress) {
  const matched = []
  const unmatched = []

  for (let i = 0; i < trackStrings.length; i++) {
    const query = trackStrings[i]
    const wasCached = getCached('search', query.toLowerCase().trim()) !== undefined

    try {
      const result = await searchTrack(query)
      if (result) {
        matched.push(result)
      } else {
        unmatched.push(query)
      }
    } catch {
      unmatched.push(query)
    }

    if (onProgress) {
      onProgress(i + 1, trackStrings.length)
    }

    // Only delay for uncached requests (rate limit: ~50 req/5s)
    if (!wasCached && i < trackStrings.length - 1) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  return { matched, unmatched }
}
