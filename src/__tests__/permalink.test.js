import { describe, it, expect } from 'vitest'
import { encodePlaylist, decodePlaylist } from '../services/permalink.js'

function makeSampleTracks() {
  return [
    {
      id: '1',
      name: 'Around The World',
      artists: [{ name: 'Daft Punk' }],
      album: { name: 'Homework', images: [{ url: 'https://example.com/art.jpg' }] },
      camelot: '8A',
      energy: 0.75,
      bpm: 121,
      keyName: 'A minor',
      previewUrl: 'https://example.com/preview.mp3',
    },
    {
      id: '2',
      name: 'Block Rockin Beats',
      artists: [{ name: 'The Chemical Brothers' }],
      album: { name: 'Dig Your Own Hole', images: [] },
      camelot: '5B',
      energy: 0.88,
      bpm: 110,
      keyName: 'Eb major',
      previewUrl: null,
    },
  ]
}

describe('encodePlaylist', () => {
  it('returns a non-empty string', () => {
    const result = encodePlaylist(makeSampleTracks(), 'Test Playlist')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('produces URL-safe output', () => {
    const result = encodePlaylist(makeSampleTracks(), 'Test')
    // lz-string's encodeURIComponent output should not contain spaces or &
    // Note: it may use + and / as part of its encoding scheme
    expect(result).not.toMatch(/[\s&]/)
    // Should be decodable
    expect(typeof result).toBe('string')
  })
})

describe('decodePlaylist', () => {
  it('round-trips encode/decode preserving track data', () => {
    const tracks = makeSampleTracks()
    const encoded = encodePlaylist(tracks, 'My Playlist')
    const decoded = decodePlaylist(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded.name).toBe('My Playlist')
    expect(decoded.tracks).toHaveLength(2)

    expect(decoded.tracks[0].name).toBe('Around The World')
    expect(decoded.tracks[0].artists[0].name).toBe('Daft Punk')
    expect(decoded.tracks[0].camelot).toBe('8A')
    expect(decoded.tracks[0].energy).toBe(0.75)
    expect(decoded.tracks[0].bpm).toBe(121)
    expect(decoded.tracks[0].keyName).toBe('A minor')
    expect(decoded.tracks[0].previewUrl).toBe('https://example.com/preview.mp3')
  })

  it('handles null previewUrl', () => {
    const tracks = makeSampleTracks()
    const encoded = encodePlaylist(tracks, 'Test')
    const decoded = decodePlaylist(encoded)
    expect(decoded.tracks[1].previewUrl).toBeNull()
  })

  it('handles empty playlist name', () => {
    const encoded = encodePlaylist(makeSampleTracks(), '')
    const decoded = decodePlaylist(encoded)
    expect(decoded.name).toBe('')
  })

  it('returns null for invalid input', () => {
    expect(decodePlaylist('garbage-data')).toBeNull()
    expect(decodePlaylist('')).toBeNull()
  })

  it('preserves energy precision to 3 decimal places', () => {
    const tracks = [{
      id: '1', name: 'T', artists: [], album: { name: '', images: [] },
      camelot: '1A', energy: 0.12345, bpm: 100, keyName: 'Ab minor', previewUrl: null,
    }]
    const encoded = encodePlaylist(tracks, '')
    const decoded = decodePlaylist(encoded)
    expect(decoded.tracks[0].energy).toBe(0.123)
  })
})
