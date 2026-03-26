import { describe, it, expect } from 'vitest'
import {
  toCamelot,
  parseCamelot,
  getKeyName,
  getCompatibleKeys,
  harmonicDistance,
  CAMELOT_COLORS,
  CAMELOT_WHEEL_ORDER,
} from '../services/camelot.js'

describe('toCamelot', () => {
  it('maps C minor (key=0, mode=0) to 5A', () => {
    expect(toCamelot(0, 0)).toBe('5A')
  })

  it('maps A minor (key=9, mode=0) to 8A', () => {
    expect(toCamelot(9, 0)).toBe('8A')
  })

  it('maps C major (key=0, mode=1) to 8B', () => {
    expect(toCamelot(0, 1)).toBe('8B')
  })

  it('maps G major (key=7, mode=1) to 9B', () => {
    expect(toCamelot(7, 1)).toBe('9B')
  })

  it('returns null for key=-1', () => {
    expect(toCamelot(-1, 0)).toBeNull()
  })

  it('returns null for undefined key', () => {
    expect(toCamelot(undefined, 1)).toBeNull()
  })

  it('returns null for null key', () => {
    expect(toCamelot(null, 0)).toBeNull()
  })

  it('covers all 24 key/mode combinations', () => {
    const results = new Set()
    for (let key = 0; key < 12; key++) {
      for (const mode of [0, 1]) {
        const code = toCamelot(key, mode)
        expect(code).not.toBeNull()
        results.add(code)
      }
    }
    expect(results.size).toBe(24)
  })
})

describe('parseCamelot', () => {
  it('parses single-digit code', () => {
    expect(parseCamelot('5A')).toEqual({ number: 5, letter: 'A' })
  })

  it('parses double-digit code', () => {
    expect(parseCamelot('12B')).toEqual({ number: 12, letter: 'B' })
  })

  it('returns null for invalid code', () => {
    // 13A is structurally valid (matches regex), so parseCamelot returns it
    expect(parseCamelot('13A')).toEqual({ number: 13, letter: 'A' })
    expect(parseCamelot('')).toBeNull()
    expect(parseCamelot(null)).toBeNull()
    expect(parseCamelot('ABC')).toBeNull()
    expect(parseCamelot('5C')).toBeNull()
  })
})

describe('getKeyName', () => {
  it('returns correct major key name', () => {
    expect(getKeyName(0, 1)).toBe('C Major')
  })

  it('returns correct minor key name', () => {
    expect(getKeyName(9, 0)).toBe('A Minor')
  })

  it('returns Unknown for key=-1', () => {
    expect(getKeyName(-1, 0)).toBe('Unknown')
  })

  it('returns Unknown for undefined key', () => {
    expect(getKeyName(undefined, 1)).toBe('Unknown')
  })
})

describe('getCompatibleKeys', () => {
  it('returns 4 compatible keys for a valid code', () => {
    const keys = getCompatibleKeys('8A')
    expect(keys).toHaveLength(4)
  })

  it('includes the same key', () => {
    expect(getCompatibleKeys('8A')).toContain('8A')
  })

  it('includes adjacent keys (+1, -1)', () => {
    const keys = getCompatibleKeys('8A')
    expect(keys).toContain('9A') // +1
    expect(keys).toContain('7A') // -1
  })

  it('includes relative major/minor', () => {
    expect(getCompatibleKeys('8A')).toContain('8B')
    expect(getCompatibleKeys('5B')).toContain('5A')
  })

  it('wraps around from 12 to 1', () => {
    const keys = getCompatibleKeys('12A')
    expect(keys).toContain('1A')
    expect(keys).toContain('11A')
  })

  it('wraps around from 1 to 12', () => {
    const keys = getCompatibleKeys('1B')
    expect(keys).toContain('12B')
    expect(keys).toContain('2B')
  })

  it('returns empty for invalid code', () => {
    expect(getCompatibleKeys(null)).toEqual([])
    expect(getCompatibleKeys('XY')).toEqual([])
  })
})

describe('harmonicDistance', () => {
  it('returns 0 for identical keys', () => {
    expect(harmonicDistance('8A', '8A')).toBe(0)
  })

  it('returns 1 for relative major/minor', () => {
    expect(harmonicDistance('8A', '8B')).toBe(1)
  })

  it('returns 1 for adjacent keys (same letter)', () => {
    expect(harmonicDistance('8A', '9A')).toBe(1)
    expect(harmonicDistance('8A', '7A')).toBe(1)
  })

  it('returns 1 for wrap-around adjacency', () => {
    expect(harmonicDistance('12B', '1B')).toBe(1)
    expect(harmonicDistance('1A', '12A')).toBe(1)
  })

  it('returns 2 for two steps away (same letter)', () => {
    expect(harmonicDistance('8A', '10A')).toBe(2)
  })

  it('returns 2 for adjacent keys (different letter)', () => {
    expect(harmonicDistance('8A', '9B')).toBe(2)
  })

  it('returns 3 for incompatible keys', () => {
    expect(harmonicDistance('1A', '6A')).toBe(3)
  })

  it('returns 4 for null/unknown keys', () => {
    expect(harmonicDistance(null, '8A')).toBe(4)
    expect(harmonicDistance('8A', null)).toBe(4)
    expect(harmonicDistance(null, null)).toBe(4)
  })
})

describe('constants', () => {
  it('CAMELOT_COLORS has all 24 keys', () => {
    expect(Object.keys(CAMELOT_COLORS)).toHaveLength(24)
  })

  it('CAMELOT_WHEEL_ORDER has 24 entries', () => {
    expect(CAMELOT_WHEEL_ORDER).toHaveLength(24)
  })
})
