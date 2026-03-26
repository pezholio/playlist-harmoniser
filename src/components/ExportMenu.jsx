import { useState } from 'react'
import { buildPermalink } from '../services/permalink.js'

function formatTrackList(tracks) {
  return tracks
    .map((t) => {
      const artist = t.artists?.map((a) => a.name).join(', ') || ''
      return artist ? `${artist} - ${t.name}` : t.name
    })
    .join('\n')
}

export default function ExportMenu({ tracks, playlistName }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const trackList = formatTrackList(tracks)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackList)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareLink = async () => {
    const link = buildPermalink(tracks, playlistName)
    await navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([trackList], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${playlistName || 'playlist'} - DJ Order.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSoundiiz = () => {
    window.open('https://soundiiz.com/webapp/converter', '_blank')
  }

  return (
    <div className="export-menu-wrapper">
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setOpen(!open)}
      >
        Share / Export
      </button>

      {open && (
        <>
          <div className="export-backdrop" onClick={() => setOpen(false)} />
          <div className="export-menu">
            <button className="export-option" onClick={handleShareLink}>
              <span className="export-option-icon">🔗</span>
              <div>
                <div className="export-option-title">
                  {linkCopied ? 'Link copied!' : 'Copy shareable link'}
                </div>
                <div className="export-option-desc">
                  Anyone with the link can see this sorted playlist
                </div>
              </div>
            </button>

            <button className="export-option" onClick={handleCopy}>
              <span className="export-option-icon">📋</span>
              <div>
                <div className="export-option-title">
                  {copied ? 'Copied!' : 'Copy track list'}
                </div>
                <div className="export-option-desc">
                  Paste into any app or service
                </div>
              </div>
            </button>

            <button className="export-option" onClick={handleDownload}>
              <span className="export-option-icon">📄</span>
              <div>
                <div className="export-option-title">Download as text file</div>
                <div className="export-option-desc">
                  Save the sorted track list
                </div>
              </div>
            </button>

            <button className="export-option" onClick={handleSoundiiz}>
              <span className="export-option-icon">🔄</span>
              <div>
                <div className="export-option-title">
                  Export via Soundiiz
                </div>
                <div className="export-option-desc">
                  Push to Spotify, Apple Music, Tidal, YouTube Music & more
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
