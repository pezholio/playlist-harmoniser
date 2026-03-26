import { describe, it, expect } from 'vitest'

// We can't test the full analyzeTrack (needs WASM + audio), but we can test
// the pure utility functions by importing them directly
// Since they're exported from audioAnalysis.js which imports WASM,
// we need to mock the WASM imports

import { vi } from 'vitest'

vi.mock('essentia.js/dist/essentia.js-core.es.js', () => ({ default: class {} }))
vi.mock('essentia.js/dist/essentia-wasm.es.js', () => ({ EssentiaWASM: {} }))

const { keyToNumber, scaleToMode } = await import('../services/audioAnalysis.js')

describe('keyToNumber', () => {
  it('maps C to 0', () => {
    expect(keyToNumber('C')).toBe(0)
  })

  it('maps A to 9', () => {
    expect(keyToNumber('A')).toBe(9)
  })

  it('maps sharps correctly', () => {
    expect(keyToNumber('C#')).toBe(1)
    expect(keyToNumber('F#')).toBe(6)
  })

  it('maps flats correctly', () => {
    expect(keyToNumber('Db')).toBe(1)
    expect(keyToNumber('Eb')).toBe(3)
    expect(keyToNumber('Ab')).toBe(8)
    expect(keyToNumber('Bb')).toBe(10)
  })

  it('returns -1 for unknown key', () => {
    expect(keyToNumber('X')).toBe(-1)
    expect(keyToNumber('')).toBe(-1)
  })

  it('maps all 12 chromatic notes', () => {
    const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    notes.forEach((note, i) => {
      expect(keyToNumber(note)).toBe(i)
    })
  })
})

describe('scaleToMode', () => {
  it('maps major to 1', () => {
    expect(scaleToMode('major')).toBe(1)
  })

  it('maps minor to 0', () => {
    expect(scaleToMode('minor')).toBe(0)
  })

  it('maps anything else to 0', () => {
    expect(scaleToMode('dorian')).toBe(0)
    expect(scaleToMode('')).toBe(0)
  })
})
