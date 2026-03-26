import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to proxy audio preview URLs (avoids CORS)
function audioProxyPlugin() {
  return {
    name: 'audio-proxy',
    configureServer(server) {
      server.middlewares.use('/api/audio-proxy', async (req, res) => {
        const url = new URL(req.url, 'http://localhost').searchParams.get('url')
        if (!url) {
          res.statusCode = 400
          res.end('Missing url parameter')
          return
        }

        try {
          const response = await fetch(url)
          if (!response.ok) {
            res.statusCode = response.status
            res.end(`Upstream error: ${response.status}`)
            return
          }

          res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
          const buffer = Buffer.from(await response.arrayBuffer())
          res.end(buffer)
        } catch (e) {
          res.statusCode = 500
          res.end(`Proxy error: ${e.message}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), audioProxyPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api/deezer': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deezer/, ''),
      },
      '/api/tidal': {
        target: 'https://gqlapi.tidal.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tidal/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
