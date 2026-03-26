import { getCached, setCache } from './cache.js'

// Search YouTube for a track and return the first video ID
export async function findYouTubeVideoId(track) {
  const artist = track.artists?.map((a) => a.name).join(', ') || ''
  const query = `${artist} ${track.name}`

  const cached = getCached('yt', query)
  if (cached !== undefined) return cached

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  const response = await fetch(`/api/audio-proxy?url=${encodeURIComponent(searchUrl)}`)

  if (!response.ok) {
    console.warn('YouTube search failed:', response.status)
    return null
  }

  const html = await response.text()
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)

  const videoId = match?.[1] || null
  setCache('yt', query, videoId)
  return videoId
}
