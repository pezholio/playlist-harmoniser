import { describe, it, expect } from 'vitest'
import { detectService } from '../services/playlistScraper.js'

describe('detectService', () => {
  describe('Spotify', () => {
    it('detects standard Spotify playlist URL', () => {
      expect(detectService('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe('spotify')
    })

    it('detects Spotify URL with query params', () => {
      expect(detectService('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123')).toBe('spotify')
    })

    it('detects Spotify URI', () => {
      expect(detectService('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')).toBe('spotify')
    })
  })

  describe('Apple Music', () => {
    it('detects standard Apple Music playlist URL', () => {
      expect(detectService('https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb')).toBe('apple')
    })

    it('detects user-created Apple Music playlist URL', () => {
      expect(detectService('https://music.apple.com/gb/playlist/for-usb/pl.u-A99Aes2xPRNk')).toBe('apple')
    })

    it('detects Apple Music URL with different country code', () => {
      expect(detectService('https://music.apple.com/de/playlist/test/pl.abc123')).toBe('apple')
    })
  })

  describe('Tidal', () => {
    it('detects standard Tidal playlist URL', () => {
      expect(detectService('https://tidal.com/playlist/b6d92b50-174d-4f8b-8bd6-c5327c20d00d')).toBe('tidal')
    })

    it('detects Tidal browse URL', () => {
      expect(detectService('https://tidal.com/browse/playlist/b6d92b50-174d-4f8b-8bd6-c5327c20d00d')).toBe('tidal')
    })

    it('detects listen.tidal.com URL', () => {
      expect(detectService('https://listen.tidal.com/playlist/b6d92b50-174d-4f8b-8bd6-c5327c20d00d')).toBe('tidal')
    })
  })

  describe('unknown', () => {
    it('returns null for YouTube URL', () => {
      expect(detectService('https://www.youtube.com/watch?v=abc123')).toBeNull()
    })

    it('returns null for random URL', () => {
      expect(detectService('https://example.com/playlist/123')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(detectService('')).toBeNull()
    })

    it('returns null for plain text', () => {
      expect(detectService('not a url')).toBeNull()
    })
  })
})
