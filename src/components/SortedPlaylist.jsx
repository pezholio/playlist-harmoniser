import TrackCard from './TrackCard.jsx'
import { getTransitionQuality } from '../services/sorting.js'

export default function SortedPlaylist({ tracks, playingIndex, onPlayTrack }) {
  if (!tracks || tracks.length === 0) return null

  return (
    <div className="sorted-playlist">
      <div className="track-list">
        {tracks.map((track, i) => {
          const transition =
            i > 0 && track.camelot && tracks[i - 1].camelot
              ? getTransitionQuality(tracks[i - 1], track)
              : null

          return (
            <TrackCard
              key={track.id + '-' + i}
              track={track}
              index={i}
              transition={transition}
              isPlaying={playingIndex === i}
              onPlay={onPlayTrack}
            />
          )
        })}
      </div>
    </div>
  )
}
