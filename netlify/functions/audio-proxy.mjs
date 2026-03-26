export default async (req) => {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    const response = await fetch(url, {
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
