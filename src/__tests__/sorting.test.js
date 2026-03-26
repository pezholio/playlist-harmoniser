import { describe, it, expect, vi } from 'vitest'

// Mock the audioAnalysis module to avoid loading WASM
vi.mock('../services/audioAnalysis.js', () => ({
  keyToNumber: (key) => {
    const map = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
    return map[key] ?? -1
  },
  scaleToMode: (scale) => (scale === 'major' ? 1 : 0),
}))

const { enrichTracksWithAnalysis, sortForDJSet, getTransitionQuality } = await import('../services/sorting.js')

function makeTrack(id, camelot, energy, bpm = 120) {
  return { id, name: `Track ${id}`, camelot, energy, bpm, artists: [{ name: 'Artist' }] }
}

describe('enrichTracksWithAnalysis', () => {
  it('enriches tracks with Camelot codes from analysis', () => {
    const results = [
      { track: { id: '1', name: 'T1' }, analysis: { key: 'A', scale: 'minor', energy: 0.7, bpm: 128 } },
    ]
    const enriched = enrichTracksWithAnalysis(results)
    expect(enriched[0].camelot).toBe('8A') // A minor = 8A
    expect(enriched[0].energy).toBe(0.7)
    expect(enriched[0].bpm).toBe(128)
    expect(enriched[0].keyName).toBe('A minor')
  })

  it('handles missing analysis', () => {
    const results = [
      { track: { id: '1', name: 'T1' }, analysis: null },
    ]
    const enriched = enrichTracksWithAnalysis(results)
    expect(enriched[0].camelot).toBeNull()
    expect(enriched[0].energy).toBeNull()
  })

  it('handles analysis with null key', () => {
    const results = [
      { track: { id: '1', name: 'T1' }, analysis: { key: null, scale: null, energy: 0.5, bpm: 100 } },
    ]
    const enriched = enrichTracksWithAnalysis(results)
    expect(enriched[0].camelot).toBeNull()
  })
})

describe('sortForDJSet', () => {
  it('returns empty array for empty input', () => {
    expect(sortForDJSet([])).toEqual([])
  })

  it('returns single track unchanged', () => {
    const tracks = [makeTrack('1', '8A', 0.5)]
    expect(sortForDJSet(tracks)).toEqual(tracks)
  })

  it('starts with the lowest energy track', () => {
    const tracks = [
      makeTrack('high', '8A', 0.9),
      makeTrack('low', '8A', 0.2),
      makeTrack('mid', '8A', 0.5),
    ]
    const sorted = sortForDJSet(tracks)
    expect(sorted[0].id).toBe('low')
  })

  it('prefers harmonically compatible transitions', () => {
    const tracks = [
      makeTrack('start', '8A', 0.3),
      makeTrack('compatible', '8B', 0.35), // relative major — distance 1
      makeTrack('clash', '3A', 0.32),      // far away — distance 3
    ]
    const sorted = sortForDJSet(tracks)
    // After starting with lowest energy, should pick compatible over clash
    expect(sorted[0].id).toBe('start')
    expect(sorted[1].id).toBe('compatible')
  })

  it('appends tracks without features at the end', () => {
    const tracks = [
      makeTrack('1', '8A', 0.5),
      { id: 'no-features', name: 'No Features', camelot: null, energy: null },
      makeTrack('2', '8B', 0.6),
    ]
    const sorted = sortForDJSet(tracks)
    expect(sorted[sorted.length - 1].id).toBe('no-features')
  })

  it('returns original array if no tracks have features', () => {
    const tracks = [
      { id: '1', name: 'A', camelot: null, energy: null },
      { id: '2', name: 'B', camelot: null, energy: null },
    ]
    expect(sortForDJSet(tracks)).toEqual(tracks)
  })
})

describe('getTransitionQuality', () => {
  it('returns perfect for same key', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.5),
      makeTrack('2', '8A', 0.6)
    )
    expect(result.quality).toBe('perfect')
    expect(result.harmonic).toBe(0)
    expect(result.energyDirection).toBe('up')
  })

  it('returns smooth for adjacent keys', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.5),
      makeTrack('2', '9A', 0.5)
    )
    expect(result.quality).toBe('smooth')
  })

  it('returns decent for two steps away', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.5),
      makeTrack('2', '10A', 0.5)
    )
    expect(result.quality).toBe('decent')
  })

  it('returns clash for incompatible keys', () => {
    const result = getTransitionQuality(
      makeTrack('1', '1A', 0.5),
      makeTrack('2', '6A', 0.5)
    )
    expect(result.quality).toBe('clash')
  })

  it('detects energy direction down', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.8),
      makeTrack('2', '8A', 0.3)
    )
    expect(result.energyDirection).toBe('down')
  })

  it('detects energy direction same', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.5),
      makeTrack('2', '8A', 0.5)
    )
    expect(result.energyDirection).toBe('same')
  })

  it('calculates energy diff', () => {
    const result = getTransitionQuality(
      makeTrack('1', '8A', 0.3),
      makeTrack('2', '8A', 0.8)
    )
    expect(result.energyDiff).toBeCloseTo(0.5)
  })
})
