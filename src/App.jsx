import { useState, useEffect, useCallback } from 'react'
import PlaylistInput from './components/PlaylistInput.jsx'
import ResultsPage from './components/ResultsPage.jsx'
import { matchTracks, searchTrack } from './services/itunesApi.js'
import { analyzeAllTracks } from './services/audioAnalysis.js'
import { enrichTracksWithAnalysis, sortForDJSet } from './services/sorting.js'
import { scrapePlaylist } from './services/playlistScraper.js'
import { decodePlaylist } from './services/permalink.js'

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((hash) => {
    window.location.hash = hash
  }, [])

  return [route, navigate]
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ph_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ph_theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return [theme, toggle]
}

export default function App() {
  const [route, navigate] = useHashRoute()
  const [theme, toggleTheme] = useTheme()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [sortedTracks, setSortedTracks] = useState(null)
  const [playlistName, setPlaylistName] = useState('')
  const [unmatchedTracks, setUnmatchedTracks] = useState([])

  // Handle permalink routes on load and navigation
  useEffect(() => {
    if (route.startsWith('#/p/')) {
      const compressed = route.slice(4) // strip '#/p/'
      const result = decodePlaylist(compressed)
      if (result) {
        setSortedTracks(result.tracks)
        setPlaylistName(result.name)
        setUnmatchedTracks([])
      }
    }
  }, [route])

  // Shared analysis pipeline
  const analyzeAndSort = async (tracks) => {
    const withPreviews = tracks.filter((t) => t.previewUrl)
    if (withPreviews.length === 0) {
      throw new Error('No audio previews available for these tracks. Cannot analyze.')
    }

    setStatus('Analyzing audio...')
    const analysisResults = await analyzeAllTracks(tracks, (done, total) => {
      setStatus(`Analyzing audio... (${done}/${total})`)
    })

    setStatus('Sorting for optimal DJ order...')
    const enriched = enrichTracksWithAnalysis(analysisResults)
    const sorted = sortForDJSet(enriched)
    setSortedTracks(sorted)
    setStatus('')
    navigate('#/results')
  }

  // Flow 1: Manual track list
  const handleAnalyze = async (trackStrings) => {
    setError(null)
    setLoading(true)
    setSortedTracks(null)
    setUnmatchedTracks([])
    setPlaylistName('')

    try {
      setStatus('Searching for tracks...')
      const { matched, unmatched } = await matchTracks(trackStrings, (done, total) => {
        setStatus(`Searching for tracks... (${done}/${total})`)
      })
      setUnmatchedTracks(unmatched)

      if (matched.length === 0) {
        throw new Error('No tracks could be found. Check your track list format (Artist - Title).')
      }

      await analyzeAndSort(matched)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Flow 2: Playlist URL
  const handleScrapeUrl = async (url) => {
    setError(null)
    setLoading(true)
    setSortedTracks(null)
    setUnmatchedTracks([])
    setPlaylistName('')

    try {
      setStatus('Fetching playlist...')
      const playlist = await scrapePlaylist(url)
      setPlaylistName(playlist.name)

      if (!playlist.tracks.length) {
        throw new Error('No tracks found in playlist')
      }

      const tracks = []
      const unmatched = []

      for (let i = 0; i < playlist.tracks.length; i++) {
        const t = playlist.tracks[i]
        setStatus(`Matching tracks... (${i + 1}/${playlist.tracks.length})`)

        // Always search Deezer for artwork and metadata
        try {
          const result = await searchTrack(t.searchQuery)
          if (result) {
            // Prefer the scraped preview URL (e.g. from Spotify) if available
            if (t.previewUrl) result.previewUrl = t.previewUrl
            tracks.push(result)
          } else if (t.previewUrl) {
            // Deezer didn't find it, but we have a preview from scraping
            tracks.push({
              id: `scraped-${i}`,
              name: t.name,
              artists: [{ name: t.artist }],
              album: { name: '', images: [] },
              previewUrl: t.previewUrl,
            })
          } else {
            unmatched.push(t.searchQuery)
          }
        } catch {
          if (t.previewUrl) {
            tracks.push({
              id: `scraped-${i}`,
              name: t.name,
              artists: [{ name: t.artist }],
              album: { name: '', images: [] },
              previewUrl: t.previewUrl,
            })
          } else {
            unmatched.push(t.searchQuery)
          }
        }

        // Rate limit delay for Deezer
        if (i < playlist.tracks.length - 1) {
          await new Promise((r) => setTimeout(r, 150))
        }
      }

      setUnmatchedTracks(unmatched)

      if (tracks.length === 0) {
        throw new Error('Could not find audio previews for any tracks')
      }

      await analyzeAndSort(tracks)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToInput = () => {
    navigate('#/')
  }

  const isResultsPage = (route === '#/results' || route.startsWith('#/p/')) && sortedTracks

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {isResultsPage && (
            <button className="btn btn-ghost btn-back" onClick={handleBackToInput}>
              ← Back
            </button>
          )}
          <h1>Playlist Harmonizer</h1>
          <span className="header-tag">No login required</span>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="app-main">
        {isResultsPage ? (
          <ResultsPage
            tracks={sortedTracks}
            playlistName={playlistName}
            unmatchedTracks={unmatchedTracks}
          />
        ) : (
          <>
            <div className="intro">
              <p>
                Paste a playlist URL from <strong>Spotify</strong>,{' '}
                <strong>Apple Music</strong>, or <strong>Tidal</strong> — or a
                manual track list — and get a DJ-friendly order based on harmonic
                compatibility (Camelot system) and energy flow.
              </p>
            </div>

            <PlaylistInput
              onAnalyze={handleAnalyze}
              onScrapeUrl={handleScrapeUrl}
              loading={loading}
            />

            {error && <div className="error-message">{error}</div>}

            {loading && (
              <div className="loading">
                <div className="spinner" />
                <p>{status}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
