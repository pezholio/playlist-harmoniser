import { useState, useCallback } from 'react'
import SortedPlaylist from './SortedPlaylist.jsx'
import CamelotWheel from './CamelotWheel.jsx'
import EnergyGraph from './EnergyGraph.jsx'
import Player from './Player.jsx'
import ExportMenu from './ExportMenu.jsx'
import { getTransitionQuality } from '../services/sorting.js'

export default function ResultsPage({ tracks, playlistName, unmatchedTracks }) {
  const [playingIndex, setPlayingIndex] = useState(-1)

  const handleTrackChange = useCallback((index) => {
    setPlayingIndex(index)
  }, [])

  const handlePlayTrack = useCallback((index) => {
    if (Player._play) {
      Player._play(index)
    }
  }, [])

  const withFeatures = tracks.filter((t) => t.camelot)
  const avgEnergy = withFeatures.length
    ? withFeatures.reduce((sum, t) => sum + (t.energy || 0), 0) / withFeatures.length
    : 0

  let smoothCount = 0
  for (let i = 1; i < tracks.length; i++) {
    if (tracks[i].camelot && tracks[i - 1].camelot) {
      const t = getTransitionQuality(tracks[i - 1], tracks[i])
      if (t.quality === 'perfect' || t.quality === 'smooth') smoothCount++
    }
  }

  const transitionTotal = Math.max(tracks.length - 1, 1)
  const smoothPercent = Math.round((smoothCount / transitionTotal) * 100)

  return (
    <>
      <div className="results-header">
        <div className="results-header-left">
          <h2 className="results-title">{playlistName || 'DJ-Ready Order'}</h2>
          <ExportMenu tracks={tracks} playlistName={playlistName} />
        </div>
        <div className="playlist-stats">
          <div className="stat">
            <span className="stat-value">{tracks.length}</span>
            <span className="stat-label">tracks</span>
          </div>
          <div className="stat">
            <span className="stat-value">{smoothPercent}%</span>
            <span className="stat-label">smooth transitions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round(avgEnergy * 100)}</span>
            <span className="stat-label">avg energy</span>
          </div>
        </div>
      </div>

      {unmatchedTracks?.length > 0 && (
        <div className="warning-message">
          <strong>{unmatchedTracks.length} track(s) couldn't be found:</strong>
          <ul>
            {unmatchedTracks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="set-preview">
        <h3>Set Preview</h3>
        <Player tracks={tracks} onTrackChange={handleTrackChange} />
      </div>

      <div className="analysis-panels">
        <CamelotWheel tracks={tracks} />
        <EnergyGraph tracks={tracks} />
      </div>

      <SortedPlaylist
        tracks={tracks}
        playingIndex={playingIndex}
        onPlayTrack={handlePlayTrack}
      />
    </>
  )
}
