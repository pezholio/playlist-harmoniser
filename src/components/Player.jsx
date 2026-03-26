import { useState, useEffect, useCallback, useRef } from 'react'
import { findYouTubeVideoId } from '../services/youtube.js'

const FADE_DURATION = 3000 // 3 second crossfade

// Load the YouTube IFrame API once
let apiReady = false
let apiReadyCallbacks = []

function loadYouTubeApi() {
  if (apiReady) return Promise.resolve()
  if (window.YT && window.YT.Player) {
    apiReady = true
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    apiReadyCallbacks.push(resolve)

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      window.onYouTubeIframeAPIReady = () => {
        apiReady = true
        apiReadyCallbacks.forEach((cb) => cb())
        apiReadyCallbacks = []
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

function createPlayer(containerId, videoId, onReady, onEnd) {
  return new window.YT.Player(containerId, {
    videoId,
    height: '1',
    width: '1',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      rel: 0,
    },
    events: {
      onReady,
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.ENDED && onEnd) {
          onEnd()
        }
      },
    },
  })
}

export default function Player({ tracks, onTrackChange }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [crossfading, setCrossfading] = useState(false)

  const playerARef = useRef(null)
  const playerBRef = useRef(null)
  const activeSlot = useRef('A') // which slot is currently audible
  const fadeTimer = useRef(null)
  const nextVideoIdRef = useRef(null)

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

  useEffect(() => {
    onTrackChange?.(isPlaying ? currentIndex : -1)
  }, [currentIndex, isPlaying, onTrackChange])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearInterval(fadeTimer.current)
      try { playerARef.current?.destroy() } catch {}
      try { playerBRef.current?.destroy() } catch {}
    }
  }, [])

  const getActivePlayer = useCallback(() => {
    return activeSlot.current === 'A' ? playerARef : playerBRef
  }, [])

  const getInactivePlayer = useCallback(() => {
    return activeSlot.current === 'A' ? playerBRef : playerARef
  }, [])

  const getActiveContainerId = useCallback(() => {
    return activeSlot.current === 'A' ? 'yt-player-a' : 'yt-player-b'
  }, [])

  const getInactiveContainerId = useCallback(() => {
    return activeSlot.current === 'A' ? 'yt-player-b' : 'yt-player-a'
  }, [])

  // Crossfade from active player to inactive player (which should already be loaded)
  const performCrossfade = useCallback(() => {
    const outgoing = getActivePlayer().current
    const incoming = getInactivePlayer().current

    if (!outgoing || !incoming) return

    setCrossfading(true)
    const steps = 30
    const interval = FADE_DURATION / steps
    let step = 0

    try { incoming.setVolume(0) } catch {}
    try { incoming.playVideo() } catch {}

    fadeTimer.current = setInterval(() => {
      step++
      const progress = step / steps
      // Ease-in-out curve
      const curve = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      try { outgoing.setVolume(Math.round(100 * (1 - curve))) } catch {}
      try { incoming.setVolume(Math.round(100 * curve)) } catch {}

      if (step >= steps) {
        clearInterval(fadeTimer.current)
        fadeTimer.current = null
        try { outgoing.stopVideo() } catch {}
        activeSlot.current = activeSlot.current === 'A' ? 'B' : 'A'
        setCrossfading(false)
      }
    }, interval)
  }, [getActivePlayer, getInactivePlayer])

  // Start playing a track (with crossfade if something is already playing)
  const startTrack = useCallback(async (index, shouldCrossfade = false) => {
    const track = tracks[index]
    if (!track) return

    setLoading(true)
    await loadYouTubeApi()
    const videoId = await findYouTubeVideoId(track)
    setLoading(false)

    if (!videoId) return

    if (shouldCrossfade && getActivePlayer().current) {
      // Load next track on inactive player, then crossfade
      const inactiveRef = getInactivePlayer()
      const containerId = getInactiveContainerId()

      // Destroy old inactive player if it exists
      try { inactiveRef.current?.destroy() } catch {}

      // Recreate the container div (YT.Player replaces the element)
      const container = document.getElementById(containerId)
      if (container) {
        const parent = container.parentNode
        const newDiv = document.createElement('div')
        newDiv.id = containerId
        parent.replaceChild(newDiv, container)
      }

      inactiveRef.current = createPlayer(
        containerId,
        videoId,
        () => {
          try { inactiveRef.current.setVolume(0) } catch {}
          performCrossfade()
        },
        () => {
          // When this track ends, advance to next
          if (currentIndex < tracks.length - 1) {
            const nextIdx = index + 1
            setCurrentIndex(nextIdx)
            startTrack(nextIdx, true)
          } else {
            setIsPlaying(false)
          }
        }
      )
    } else {
      // First track — just play on active slot
      const activeRef = getActivePlayer()
      const containerId = getActiveContainerId()

      try { activeRef.current?.destroy() } catch {}

      const container = document.getElementById(containerId)
      if (container) {
        const parent = container.parentNode
        const newDiv = document.createElement('div')
        newDiv.id = containerId
        parent.replaceChild(newDiv, container)
      }

      activeRef.current = createPlayer(
        containerId,
        videoId,
        (event) => {
          event.target.setVolume(100)
        },
        () => {
          if (index < tracks.length - 1) {
            const nextIdx = index + 1
            setCurrentIndex(nextIdx)
            startTrack(nextIdx, true)
          } else {
            setIsPlaying(false)
          }
        }
      )
    }
  }, [tracks, currentIndex, getActivePlayer, getInactivePlayer, getActiveContainerId, getInactiveContainerId, performCrossfade])

  const playTrackAtIndex = useCallback((index) => {
    if (index < 0 || index >= tracks.length) return
    if (index === currentIndex && isPlaying) {
      // Pause
      try { getActivePlayer().current?.pauseVideo() } catch {}
      setIsPlaying(false)
    } else {
      const shouldCrossfade = isPlaying && getActivePlayer().current
      setCurrentIndex(index)
      setIsPlaying(true)
      startTrack(index, shouldCrossfade)
    }
  }, [tracks.length, currentIndex, isPlaying, getActivePlayer, startTrack])

  Player._play = playTrackAtIndex

  const skipPrev = () => {
    if (currentIndex > 0) playTrackAtIndex(currentIndex - 1)
  }

  const skipNext = () => {
    if (currentIndex < tracks.length - 1) playTrackAtIndex(currentIndex + 1)
  }

  const togglePlay = () => {
    if (currentIndex < 0) {
      playTrackAtIndex(0)
    } else if (isPlaying) {
      try { getActivePlayer().current?.pauseVideo() } catch {}
      setIsPlaying(false)
    } else {
      try { getActivePlayer().current?.playVideo() } catch {}
      setIsPlaying(true)
    }
  }

  const albumArtSmall = currentTrack?.album?.images?.[2]?.url || currentTrack?.album?.images?.[0]?.url
  const albumArtLarge = currentTrack?.album?.images?.[0]?.url || albumArtSmall
  const artists = currentTrack?.artists?.map((a) => a.name).join(', ')

  return (
    <div className="player">
      {isPlaying && albumArtLarge && (
        <div className="player-artwork-display">
          <img
            className="player-artwork-large"
            src={albumArtLarge}
            alt=""
            key={currentTrack?.id}
          />
          <div className="player-artwork-overlay">
            <div className="player-artwork-track">
              <span className="player-artwork-title">{currentTrack?.name}</span>
              <span className="player-artwork-artist">{artists}</span>
            </div>
            {crossfading && <span className="player-crossfade-badge">Crossfading</span>}
          </div>
        </div>
      )}

      <div className="player-main">
        <div className="player-controls">
          <button className="player-btn" onClick={skipPrev} title="Previous" disabled={currentIndex <= 0}>
            ⏮
          </button>
          <button className="player-btn player-btn-play" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="player-btn" onClick={skipNext} title="Next" disabled={currentIndex >= tracks.length - 1}>
            ⏭
          </button>
        </div>

        <div className="player-track-info">
          {!isPlaying && albumArtSmall && <img className="player-art" src={albumArtSmall} alt="" />}
          <div className="player-text">
            {currentTrack ? (
              <>
                <span className="player-title">{currentTrack.name}</span>
                <span className="player-artist">{artists}</span>
              </>
            ) : (
              <span className="player-title player-idle">
                Select a track to play via YouTube
              </span>
            )}
          </div>
        </div>

        {currentIndex >= 0 && (
          <div className="player-status">
            <span className="player-position">
              {currentIndex + 1} / {tracks.length}
            </span>
          </div>
        )}
      </div>

      {isPlaying && loading && (
        <div className="player-loading">Finding track on YouTube...</div>
      )}

      {isPlaying && !loading && !currentTrack && (
        <div className="player-loading">Could not find this track on YouTube</div>
      )}

      {/* Hidden YouTube player slots for crossfading */}
      <div className="player-youtube">
        <div id="yt-player-a" />
        <div id="yt-player-b" />
      </div>
    </div>
  )
}
