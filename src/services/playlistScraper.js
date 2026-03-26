// Extracts track lists from Spotify, Apple Music, and Tidal playlist URLs
// All fetches go through our server-side proxy to avoid CORS

// Detect which service a URL belongs to
export function detectService(url) {
  if (/open\.spotify\.com\/playlist\//.test(url) || /spotify:playlist:/.test(url)) {
    return 'spotify'
  }
  if (/music\.apple\.com\/.*\/playlist\//.test(url)) {
    return 'apple'
  }
  if (/tidal\.com\/.*playlist\//.test(url) || /listen\.tidal\.com\/playlist\//.test(url)) {
    return 'tidal'
  }
  return null
}

// Extract playlist ID from URL
function extractSpotifyId(url) {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/)
  return match?.[1] || null
}

function extractAppleMusicUrl(url) {
  // Apple Music URLs: https://music.apple.com/{country}/playlist/{name}/{id}
  return url
}

function extractTidalId(url) {
  const match = url.match(/playlist\/([0-9a-zA-Z-]+)/)
  return match?.[1] || null
}

// ─── Spotify ───────────────────────────────────────────────

async function scrapeSpotify(url) {
  const playlistId = extractSpotifyId(url)
  if (!playlistId) throw new Error('Invalid Spotify playlist URL')

  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`
  const response = await fetch(`/api/audio-proxy?url=${encodeURIComponent(embedUrl)}`)

  if (!response.ok) throw new Error(`Failed to fetch Spotify embed: ${response.status}`)

  const html = await response.text()

  // Extract the __NEXT_DATA__ JSON from the embed page
  const scriptMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!scriptMatch) throw new Error('Could not find track data in Spotify embed page')

  const nextData = JSON.parse(scriptMatch[1])
  const trackList = nextData?.props?.pageProps?.state?.data?.entity?.trackList

  if (!trackList || trackList.length === 0) {
    throw new Error('No tracks found in Spotify playlist')
  }

  const playlistName = nextData?.props?.pageProps?.state?.data?.entity?.name || 'Spotify Playlist'

  return {
    name: playlistName,
    tracks: trackList.map((t) => ({
      name: t.title,
      artist: t.subtitle,
      previewUrl: t.audioPreview?.url || null,
      searchQuery: `${t.subtitle} - ${t.title}`,
    })),
  }
}

// ─── Apple Music ───────────────────────────────────────────

async function scrapeAppleMusic(url) {
  const response = await fetch(`/api/audio-proxy?url=${encodeURIComponent(url)}`)

  if (!response.ok) throw new Error(`Failed to fetch Apple Music page: ${response.status}`)

  const html = await response.text()

  // Method 1: JSON-LD MusicPlaylist (curated playlists)
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
  if (ldMatch) {
    try {
      const ldData = JSON.parse(ldMatch[1])
      let playlist = null
      if (ldData['@type'] === 'MusicPlaylist') {
        playlist = ldData
      } else if (Array.isArray(ldData['@graph'])) {
        playlist = ldData['@graph'].find((item) => item['@type'] === 'MusicPlaylist')
      }

      if (playlist?.track?.length) {
        return {
          name: playlist.name || 'Apple Music Playlist',
          tracks: playlist.track.map((t) => ({
            name: t.name,
            artist: t.byArtist?.name || '',
            previewUrl: null,
            searchQuery: t.byArtist?.name ? `${t.byArtist.name} - ${t.name}` : t.name,
          })),
        }
      }
    } catch {}
  }

  // Method 2: Embedded JSON data (user-created playlists)
  // Apple embeds a large JSON blob in a <script> tag with track data
  // Tracks are in sections[].items[] with title, subtitleLinks, duration etc.
  try {
    // Find the JSON data blob — it's typically in a script tag containing "track-lockup"
    const jsonMatch = html.match(/<script[^>]*id="[^"]*serialized-server-data[^"]*"[^>]*>([\s\S]*?)<\/script>/)
      || html.match(/<script[^>]*>\s*(\{[\s\S]*?"track-lockup"[\s\S]*?\})\s*<\/script>/)

    // Also try finding track data by looking for the sections/items pattern
    let tracks = []
    let playlistName = 'Apple Music Playlist'

    // Extract playlist name from og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)
    if (titleMatch) playlistName = titleMatch[1]

    // Look for track-lockup items in any script tag
    const allScripts = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)
    for (const [, scriptContent] of allScripts) {
      if (!scriptContent.includes('track-lockup')) continue

      // Try to parse — might be JSON or might be encoded
      let data = null
      try {
        // Sometimes it's a JSON array with base64-encoded entries
        const parsed = JSON.parse(scriptContent)
        if (Array.isArray(parsed)) {
          // Apple sometimes base64-encodes the data
          for (const entry of parsed) {
            const decoded = typeof entry.data === 'string'
              ? JSON.parse(atob(entry.data))
              : entry
            const found = extractAppleMusicTracks(decoded)
            if (found.length) { tracks = found; break }
          }
        } else {
          tracks = extractAppleMusicTracks(parsed)
        }
      } catch {
        // Try finding JSON objects within the script
        const objMatch = scriptContent.match(/\{[\s\S]*"track-lockup"[\s\S]*\}/)
        if (objMatch) {
          try {
            data = JSON.parse(objMatch[0])
            tracks = extractAppleMusicTracks(data)
          } catch {}
        }
      }

      if (tracks.length) break
    }

    if (tracks.length) {
      return { name: playlistName, tracks }
    }
  } catch (e) {
    console.warn('Apple Music embedded data parse failed:', e)
  }

  throw new Error('Could not find track data on Apple Music page')
}

// Recursively extract tracks from Apple Music's embedded JSON structure
function extractAppleMusicTracks(obj) {
  const tracks = []

  function walk(node) {
    if (!node || typeof node !== 'object') return

    // Check if this is a track item
    if (node.id && typeof node.id === 'string' && node.id.includes('track-lockup') && node.title) {
      const artistName = node.subtitleLinks?.[0]?.title
        || node.artistName
        || ''
      tracks.push({
        name: node.title,
        artist: artistName,
        previewUrl: null,
        searchQuery: artistName ? `${artistName} - ${node.title}` : node.title,
      })
      return
    }

    // Recurse into arrays and objects
    if (Array.isArray(node)) {
      node.forEach(walk)
    } else {
      Object.values(node).forEach(walk)
    }
  }

  walk(obj)
  return tracks
}

// ─── Tidal ─────────────────────────────────────────────────

async function scrapeTidal(url) {
  // Tidal doesn't expose playlist track data publicly — their page is a
  // client-rendered SPA and their API requires user authentication.
  // We fetch the page to get the playlist name from Open Graph tags,
  // then ask the user to paste their track list manually.
  const response = await fetch(`/api/audio-proxy?url=${encodeURIComponent(url)}`)
  let playlistName = 'Tidal Playlist'

  if (response.ok) {
    const html = await response.text()
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)
    if (titleMatch) playlistName = titleMatch[1]
  }

  throw new Error(
    `Found Tidal playlist "${playlistName}", but Tidal doesn't expose track data publicly. ` +
    `Please copy your track list from Tidal and paste it in the Manual Track List tab (Artist - Title, one per line).`
  )
}

// ─── Main entry point ──────────────────────────────────────

export async function scrapePlaylist(url) {
  const service = detectService(url)

  switch (service) {
    case 'spotify':
      return scrapeSpotify(url)
    case 'apple':
      return scrapeAppleMusic(url)
    case 'tidal':
      return scrapeTidal(url)
    default:
      throw new Error(
        'Unrecognised URL. Paste a Spotify, Apple Music, or Tidal playlist URL.'
      )
  }
}
