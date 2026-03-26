import { useState } from 'react'
import { detectService } from '../services/playlistScraper.js'

export default function PlaylistInput({ onAnalyze, onScrapeUrl, loading }) {
  const [activeTab, setActiveTab] = useState('url')
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [tracks, setTracks] = useState('')

  const handleUrlSubmit = () => {
    if (playlistUrl.trim()) onScrapeUrl(playlistUrl.trim())
  }

  const handleManualSubmit = () => {
    const lines = tracks
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length > 0) onAnalyze(lines)
  }

  const detectedService = playlistUrl.trim() ? detectService(playlistUrl.trim()) : null
  const serviceLabels = { spotify: 'Spotify', apple: 'Apple Music', tidal: 'Tidal' }

  return (
    <div className="playlist-input">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          Playlist URL
        </button>
        <button
          className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manual Track List
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'url' ? (
          <div className="input-group">
            <label>Paste a playlist URL from Spotify, Apple Music, or Tidal</label>
            <div className="input-row">
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or https://music.apple.com/... or https://tidal.com/..."
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                disabled={loading}
              />
              <button
                className="btn btn-primary"
                onClick={handleUrlSubmit}
                disabled={loading || !playlistUrl.trim()}
              >
                {loading ? 'Loading...' : 'Load'}
              </button>
            </div>
            {detectedService && (
              <span className="service-badge">{serviceLabels[detectedService]} detected</span>
            )}
            {playlistUrl.trim() && !detectedService && (
              <span className="service-badge service-badge-warn">Unrecognised URL</span>
            )}
          </div>
        ) : (
          <div className="input-group">
            <label>
              Paste your track list (one per line, <code>Artist - Title</code>)
            </label>
            <textarea
              value={tracks}
              onChange={(e) => setTracks(e.target.value)}
              placeholder={`Daft Punk - Around The World\nThe Chemical Brothers - Block Rockin' Beats\nFatboy Slim - Right Here Right Now`}
              rows={10}
              disabled={loading}
            />
            <div className="input-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={handleManualSubmit}
                disabled={loading || !tracks.trim()}
              >
                {loading ? 'Analyzing...' : 'Analyze & Sort'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
