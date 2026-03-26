import Essentia from 'essentia.js/dist/essentia.js-core.es.js'
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'
import { getCached, setCache } from './cache.js'

let essentiaInstance = null

async function getEssentia() {
  if (essentiaInstance) return essentiaInstance

  // The ES module exports an already-initialized Emscripten Module object
  const wasm = typeof EssentiaWASM === 'function'
    ? await EssentiaWASM()
    : EssentiaWASM
  essentiaInstance = new Essentia(wasm)
  console.log('Essentia initialized, algorithms:', essentiaInstance.algorithmNames?.length || 'unknown')
  return essentiaInstance
}

// Fetch and decode an audio preview URL into a Float32Array
async function fetchAudio(url) {
  // Route through our server-side proxy to avoid CORS
  const proxiedUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`
  const audioCtx = new AudioContext({ sampleRate: 44100 })

  try {
    const response = await fetch(proxiedUrl)
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    return audioBuffer.getChannelData(0)
  } finally {
    await audioCtx.close()
  }
}

// Analyze a single track's audio preview
export async function analyzeTrack(previewUrl) {
  const cached = getCached('analysis', previewUrl)
  if (cached !== undefined) return cached
  const essentia = await getEssentia()
  const audioData = await fetchAudio(previewUrl)
  const signal = essentia.arrayToVector(audioData)

  // Key detection
  let key = null
  let scale = null
  let keyStrength = 0
  try {
    const keyResult = essentia.KeyExtractor(signal)
    key = keyResult.key
    scale = keyResult.scale
    keyStrength = keyResult.strength
  } catch (e) {
    console.warn('Key extraction failed:', e)
  }

  // BPM detection via beat tracking
  let bpm = 0
  try {
    const beatResult = essentia.BeatTrackerMultiFeature(signal)
    const ticks = essentia.vectorToArray(beatResult.ticks)
    if (ticks.length >= 2) {
      const intervals = []
      for (let i = 1; i < ticks.length; i++) {
        intervals.push(ticks[i] - ticks[i - 1])
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      bpm = Math.round(60 / avgInterval)
    }
  } catch (e) {
    console.warn('BPM extraction failed:', e)
  }

  // Energy (RMS-based, normalized to 0-1)
  let energy = 0
  try {
    const energyResult = essentia.Energy(signal)
    const rms = Math.sqrt(energyResult.energy / audioData.length)
    energy = Math.min(1, rms / 0.25)
  } catch (e) {
    console.warn('Energy extraction failed:', e)
  }

  const result = { key, scale, keyStrength, bpm, energy }
  setCache('analysis', previewUrl, result)
  return result
}

// Map Essentia key names to key numbers for Camelot conversion
const KEY_TO_NUMBER = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
}

export function keyToNumber(keyName) {
  return KEY_TO_NUMBER[keyName] ?? -1
}

export function scaleToMode(scale) {
  return scale === 'major' ? 1 : 0
}

// Analyze multiple tracks with progress reporting
export async function analyzeAllTracks(tracks, onProgress) {
  const results = []

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    let analysis = null

    if (track.previewUrl) {
      try {
        analysis = await analyzeTrack(track.previewUrl)
      } catch (e) {
        console.warn(`Analysis failed for "${track.name}":`, e)
      }
    }

    results.push({ track, analysis })

    if (onProgress) {
      onProgress(i + 1, tracks.length)
    }
  }

  return results
}
