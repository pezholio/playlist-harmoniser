import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCached, setCache } from '../services/cache.js'

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns undefined for cache miss', () => {
    expect(getCached('test', 'missing')).toBeUndefined()
  })

  it('stores and retrieves a string value', () => {
    setCache('test', 'key1', 'hello')
    expect(getCached('test', 'key1')).toBe('hello')
  })

  it('stores and retrieves an object', () => {
    const data = { key: 'A', bpm: 128 }
    setCache('test', 'key2', data)
    expect(getCached('test', 'key2')).toEqual(data)
  })

  it('stores and retrieves null', () => {
    setCache('test', 'key3', null)
    expect(getCached('test', 'key3')).toBeNull()
  })

  it('uses namespace to isolate keys', () => {
    setCache('ns1', 'key', 'value1')
    setCache('ns2', 'key', 'value2')
    expect(getCached('ns1', 'key')).toBe('value1')
    expect(getCached('ns2', 'key')).toBe('value2')
  })

  it('expires entries after 7 days', () => {
    setCache('test', 'old', 'data')

    // Manually set the timestamp to 8 days ago
    const storageKey = Object.keys(localStorage).find((k) => k.includes('old'))
    const entry = JSON.parse(localStorage.getItem(storageKey))
    entry.ts = Date.now() - 8 * 24 * 60 * 60 * 1000
    localStorage.setItem(storageKey, JSON.stringify(entry))

    expect(getCached('test', 'old')).toBeUndefined()
  })

  it('does not expire entries within 7 days', () => {
    setCache('test', 'recent', 'data')

    const storageKey = Object.keys(localStorage).find((k) => k.includes('recent'))
    const entry = JSON.parse(localStorage.getItem(storageKey))
    entry.ts = Date.now() - 6 * 24 * 60 * 60 * 1000
    localStorage.setItem(storageKey, JSON.stringify(entry))

    expect(getCached('test', 'recent')).toBe('data')
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ph_v1_test_corrupt', 'not-json')
    expect(getCached('test', 'corrupt')).toBeUndefined()
  })
})
