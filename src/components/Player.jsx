import { useState, useEffect, useCallback, useRef } from 'react'
import { findYouTubeVideoId } from '../services/youtube.js'

export default function Player({ tracks, onTrackChange }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoId, setVideoId] = useState(null)
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef(null)

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

  // Notify parent of track changes
  useEffect(() => {
    onTrackChange?.(isPlaying ? currentIndex : -1)
  }, [currentIndex, isPlaying, onTrackChange])

  // Look up YouTube video ID when track changes
  useEffect(() => {
    if (!currentTrack || !isPlaying) {
      setVideoId(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setVideoId(null)

    findYouTubeVideoId(currentTrack).then((id) => {
      if (cancelled) return
      setVideoId(id)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [currentIndex, isPlaying, currentTrack])

  const playTrackAtIndex = useCallback((index) => {
    if (index < 0 || index >= tracks.length) return
    if (index === currentIndex && isPlaying) {
      setIsPlaying(false)
    } else {
      setCurrentIndex(index)
      setIsPlaying(true)
    }
  }, [tracks.length, currentIndex, isPlaying])

  // Expose for external use
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
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }

  const albumArt = currentTrack?.album?.images?.[2]?.url || currentTrack?.album?.images?.[0]?.url
  const artists = currentTrack?.artists?.map((a) => a.name).join(', ')

  return (
    <div className="player">
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
          {albumArt && <img className="player-art" src={albumArt} alt="" />}
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
          <span className="player-position">
            {currentIndex + 1} / {tracks.length}
          </span>
        )}
      </div>

      {isPlaying && loading && (
        <div className="player-loading">Finding track on YouTube...</div>
      )}

      {isPlaying && videoId && (
        <div className="player-youtube">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="YouTube player"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="player-iframe"
          />
        </div>
      )}

      {isPlaying && !loading && !videoId && currentTrack && (
        <div className="player-loading">Could not find this track on YouTube</div>
      )}
    </div>
  )
}
