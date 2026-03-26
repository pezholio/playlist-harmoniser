import { CAMELOT_COLORS } from '../services/camelot.js'

function youtubeSearchUrl(track) {
  const artists = track.artists?.map((a) => a.name).join(', ') || ''
  const query = `${artists} ${track.name}`
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`
}

export default function TrackCard({ track, index, transition, isPlaying, onPlay }) {
  const albumArt = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url
  const artists = track.artists?.map((a) => a.name).join(', ')
  const camelotColor = track.camelot ? CAMELOT_COLORS[track.camelot] : '#666'

  return (
    <div className={`track-card ${isPlaying ? 'track-card-playing' : ''}`}>
      {transition && (
        <div className={`transition-indicator transition-${transition.quality}`}>
          <span className="transition-arrow">
            {transition.quality === 'perfect'
              ? '='
              : transition.quality === 'smooth'
                ? '~'
                : transition.quality === 'decent'
                  ? '>'
                  : '!'}
          </span>
          <span className="transition-label">{transition.quality}</span>
          {transition.energyDirection && (
            <span className="transition-energy">
              Energy {transition.energyDirection === 'up' ? '↑' : transition.energyDirection === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      )}

      <div className="track-card-content">
        <button
          className="track-play-btn"
          onClick={() => onPlay?.(index)}
          title={track.previewUrl ? 'Preview this track' : 'No preview available'}
          disabled={!track.previewUrl}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {albumArt && (
          <img className="track-album-art" src={albumArt} alt="" />
        )}

        <div className="track-info">
          <div className="track-name">{track.name}</div>
          <div className="track-artist">{artists}</div>
        </div>

        <div className="track-metadata">
          {track.camelot && (
            <div className="key-info">
              <span
                className="camelot-badge"
                style={{ backgroundColor: camelotColor }}
              >
                {track.camelot}
              </span>
              {track.keyName && (
                <span className="key-name">{track.keyName}</span>
              )}
            </div>
          )}

          {track.energy != null && (
            <div className="energy-info">
              <div className="energy-bar-container">
                <div className="energy-bar">
                  <div
                    className="energy-bar-fill"
                    style={{ width: `${track.energy * 100}%` }}
                  />
                </div>
              </div>
              <span className="energy-label">{Math.round(track.energy * 100)}%</span>
            </div>
          )}

          {track.bpm && (
            <span className="bpm-badge">
              {track.bpm} BPM
            </span>
          )}

          <a
            className="yt-link"
            href={youtubeSearchUrl(track)}
            target="_blank"
            rel="noopener noreferrer"
            title="Find on YouTube Music"
          >
            YT
          </a>
        </div>
      </div>
    </div>
  )
}
