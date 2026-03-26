import { toCamelot, harmonicDistance } from './camelot.js'
import { keyToNumber, scaleToMode } from './audioAnalysis.js'

// Enrich tracks with Camelot codes from audio analysis results
export function enrichTracksWithAnalysis(analysisResults) {
  return analysisResults.map(({ track, analysis }) => {
    if (!analysis || analysis.key == null) {
      return { ...track, camelot: null, energy: null, bpm: null }
    }

    const keyNum = keyToNumber(analysis.key)
    const mode = scaleToMode(analysis.scale)

    return {
      ...track,
      camelot: toCamelot(keyNum, mode),
      energy: analysis.energy,
      bpm: analysis.bpm || null,
      keyName: `${analysis.key} ${analysis.scale}`,
    }
  })
}

// Calculate a transition score between two tracks
// Lower score = better transition
function transitionScore(current, next) {
  if (!current || !next) return 100

  // Harmonic compatibility (0-4, weighted heavily)
  const harmonic = harmonicDistance(current.camelot, next.camelot)
  const harmonicWeight = harmonic * 10

  // Energy difference (0-1, should flow smoothly)
  const energyDiff =
    current.energy != null && next.energy != null
      ? Math.abs(current.energy - next.energy)
      : 0.5
  const energyWeight = energyDiff * 5

  // BPM difference (smoother if within ~10 BPM or double/half time)
  let bpmWeight = 0
  if (current.bpm && next.bpm) {
    const bpmDiff = Math.abs(current.bpm - next.bpm)
    const halfTimeDiff = Math.abs(current.bpm - next.bpm * 2)
    const doubleTimeDiff = Math.abs(current.bpm * 2 - next.bpm)
    const minBpmDiff = Math.min(bpmDiff, halfTimeDiff, doubleTimeDiff)
    bpmWeight = Math.min(minBpmDiff / 20, 3) // cap at 3
  }

  return harmonicWeight + energyWeight + bpmWeight
}

// Sort tracks for DJ-friendly order using nearest-neighbor approach
export function sortForDJSet(tracks) {
  if (tracks.length <= 1) return tracks

  // Filter tracks that have audio features
  const withFeatures = tracks.filter((t) => t.camelot && t.energy != null)
  const withoutFeatures = tracks.filter((t) => !t.camelot || t.energy == null)

  if (withFeatures.length === 0) return tracks

  // Start with the lowest energy track (warm-up)
  const sorted = []
  const remaining = [...withFeatures]

  remaining.sort((a, b) => a.energy - b.energy)
  sorted.push(remaining.shift())

  // Greedy nearest-neighbor: always pick the best next transition
  while (remaining.length > 0) {
    const current = sorted[sorted.length - 1]
    let bestIdx = 0
    let bestScore = Infinity

    const targetEnergy = current.energy + 0.03

    for (let i = 0; i < remaining.length; i++) {
      let score = transitionScore(current, remaining[i])

      const energyDirection = remaining[i].energy - targetEnergy
      if (energyDirection >= 0 && energyDirection < 0.15) {
        score -= 1
      }

      if (score < bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    sorted.push(remaining.splice(bestIdx, 1)[0])
  }

  return [...sorted, ...withoutFeatures]
}

// Get a summary of the transition quality
export function getTransitionQuality(track1, track2) {
  const harmonic = harmonicDistance(track1.camelot, track2.camelot)
  const energyDiff =
    track1.energy != null && track2.energy != null
      ? Math.abs(track1.energy - track2.energy)
      : null

  let quality
  if (harmonic === 0) quality = 'perfect'
  else if (harmonic === 1) quality = 'smooth'
  else if (harmonic === 2) quality = 'decent'
  else quality = 'clash'

  return {
    quality,
    harmonic,
    energyDiff,
    energyDirection:
      track2.energy > track1.energy ? 'up' : track2.energy < track1.energy ? 'down' : 'same',
  }
}
