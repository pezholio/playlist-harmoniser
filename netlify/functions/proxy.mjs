export default async (req) => {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlaylistHarmonizer/1.0)',
      },
    })

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, {
        status: response.status,
      })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return new Response(`Proxy error: ${e.message}`, { status: 502 })
  }
}

export const config = {
  path: '/api/audio-proxy',
}
