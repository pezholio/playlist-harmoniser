// Camelot Wheel mapping
// Spotify API returns key (0-11, C to B) and mode (0 = minor, 1 = major)
// We map these to Camelot codes (1A-12A for minor, 1B-12B for major)

const CAMELOT_MAP = {
  // [key, mode] -> Camelot code
  // Minor keys (A = inner wheel)
  '0,0': '5A',   // C minor
  '1,0': '12A',  // C#/Db minor
  '2,0': '7A',   // D minor
  '3,0': '2A',   // D#/Eb minor
  '4,0': '9A',   // E minor
  '5,0': '4A',   // F minor
  '6,0': '11A',  // F#/Gb minor
  '7,0': '6A',   // G minor
  '8,0': '1A',   // G#/Ab minor
  '9,0': '8A',   // A minor
  '10,0': '3A',  // A#/Bb minor
  '11,0': '10A', // B minor

  // Major keys (B = outer wheel)
  '0,1': '8B',   // C major
  '1,1': '3B',   // C#/Db major
  '2,1': '10B',  // D major
  '3,1': '5B',   // D#/Eb major
  '4,1': '12B',  // E major
  '5,1': '7B',   // F major
  '6,1': '2B',   // F#/Gb major
  '7,1': '9B',   // G major
  '8,1': '4B',   // G#/Ab major
  '9,1': '1B',   // A major
  '10,1': '6B',  // A#/Bb major
  '11,1': '11B', // B major
}

// Key names for display
const KEY_NAMES = {
  0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
  6: 'F#', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B',
}

// Convert Spotify key + mode to Camelot code
export function toCamelot(key, mode) {
  if (key === -1 || key === undefined || key === null) return null
  return CAMELOT_MAP[`${key},${mode}`] || null
}

// Parse a Camelot code into its number and letter
export function parseCamelot(code) {
  if (!code) return null
  const match = code.match(/^(\d{1,2})([AB])$/)
  if (!match) return null
  return { number: parseInt(match[1]), letter: match[2] }
}

// Get the display name for a key
export function getKeyName(key, mode) {
  if (key === -1 || key === undefined) return 'Unknown'
  const name = KEY_NAMES[key] || '?'
  return `${name} ${mode === 1 ? 'Major' : 'Minor'}`
}

// Get compatible Camelot codes for harmonic mixing
// Compatible transitions:
// 1. Same key (perfect match)
// 2. +1 or -1 on the wheel (adjacent keys)
// 3. Switch between A and B of same number (relative major/minor)
export function getCompatibleKeys(camelotCode) {
  const parsed = parseCamelot(camelotCode)
  if (!parsed) return []

  const { number, letter } = parsed
  const compatible = []

  // Same key
  compatible.push(camelotCode)

  // +1 on wheel
  const up = number === 12 ? 1 : number + 1
  compatible.push(`${up}${letter}`)

  // -1 on wheel
  const down = number === 1 ? 12 : number - 1
  compatible.push(`${down}${letter}`)

  // Relative major/minor (same number, different letter)
  const otherLetter = letter === 'A' ? 'B' : 'A'
  compatible.push(`${number}${otherLetter}`)

  return compatible
}

// Calculate harmonic compatibility score between two Camelot codes
// Returns 0-3: 0 = perfect match, 1 = adjacent, 2 = relative maj/min, 3 = incompatible
export function harmonicDistance(code1, code2) {
  if (!code1 || !code2) return 4 // unknown keys

  if (code1 === code2) return 0 // perfect match

  const p1 = parseCamelot(code1)
  const p2 = parseCamelot(code2)
  if (!p1 || !p2) return 4

  // Relative major/minor
  if (p1.number === p2.number && p1.letter !== p2.letter) return 1

  // Adjacent on wheel (same letter)
  if (p1.letter === p2.letter) {
    const diff = Math.abs(p1.number - p2.number)
    if (diff === 1 || diff === 11) return 1 // adjacent (wrapping around 12)
    if (diff === 2 || diff === 10) return 2 // two steps away
  }

  // Adjacent on wheel but different letter
  const diff = Math.abs(p1.number - p2.number)
  if (diff === 1 || diff === 11) return 2

  return 3 // incompatible
}

// Camelot wheel colors for visualization
export const CAMELOT_COLORS = {
  '1A': '#1abc9c', '1B': '#16a085',
  '2A': '#2ecc71', '2B': '#27ae60',
  '3A': '#3498db', '3B': '#2980b9',
  '4A': '#9b59b6', '4B': '#8e44ad',
  '5A': '#e74c3c', '5B': '#c0392b',
  '6A': '#e67e22', '6B': '#d35400',
  '7A': '#f1c40f', '7B': '#f39c12',
  '8A': '#1abc9c', '8B': '#16a085',
  '9A': '#2ecc71', '9B': '#27ae60',
  '10A': '#3498db', '10B': '#2980b9',
  '11A': '#9b59b6', '11B': '#8e44ad',
  '12A': '#e74c3c', '12B': '#c0392b',
}

// Full Camelot wheel order for display
export const CAMELOT_WHEEL_ORDER = [
  '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B',
  '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
]
