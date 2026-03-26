import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

// Encode playlist data into a compact URL-safe string
export function encodePlaylist(tracks, playlistName) {
  // Only store the fields we need to reconstruct the results page
  const minimal = {
    n: playlistName || '',
    t: tracks.map((t) => ({
      i: t.id,
      n: t.name,
      a: t.artists?.map((a) => a.name) || [],
      al: t.album?.name || '',
      ai: t.album?.images?.[0]?.url || '',
      c: t.camelot || null,
      e: t.energy != null ? Math.round(t.energy * 1000) / 1000 : null,
      b: t.bpm || null,
      k: t.keyName || null,
      p: t.previewUrl || null,
    })),
  }

  return compressToEncodedURIComponent(JSON.stringify(minimal))
}

// Decode a compressed playlist string back into track objects
export function decodePlaylist(compressed) {
  try {
    const json = decompressFromEncodedURIComponent(compressed)
    if (!json) return null

    const data = JSON.parse(json)

    const tracks = data.t.map((t) => ({
      id: t.i,
      name: t.n,
      artists: t.a.map((name) => ({ name })),
      album: {
        name: t.al,
        images: t.ai ? [{ url: t.ai }, {}, { url: t.ai }] : [],
      },
      camelot: t.c,
      energy: t.e,
      bpm: t.b,
      keyName: t.k,
      previewUrl: t.p,
    }))

    return { name: data.n, tracks }
  } catch (e) {
    console.warn('Failed to decode playlist permalink:', e)
    return null
  }
}

// Build a full permalink URL
export function buildPermalink(tracks, playlistName) {
  const encoded = encodePlaylist(tracks, playlistName)
  return `${window.location.origin}${window.location.pathname}#/p/${encoded}`
}
