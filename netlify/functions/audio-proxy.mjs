export const handler = async (event) => {
  const url = event.queryStringParameters && event.queryStringParameters.url

  if (!url) {
    return { statusCode: 400, body: 'Missing url parameter' }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlaylistHarmonizer/1.0)',
      },
    })

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: 'Upstream error: ' + response.status,
      }
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // For text-based responses (HTML, JSON), return as string
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('html')) {
      const text = await response.text()
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
        body: text,
      }
    }

    // For binary responses (audio, images), return as base64
    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
      body: base64,
      isBase64Encoded: true,
    }
  } catch (e) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: e.message, stack: e.stack }),
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
