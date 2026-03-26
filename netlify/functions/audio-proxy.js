const handler = async (event) => {
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
    const buffer = await response.arrayBuffer()
    const base64Body = Buffer.from(buffer).toString('base64')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
      body: base64Body,
      isBase64Encoded: true,
    }
  } catch (e) {
    return { statusCode: 502, body: 'Proxy error: ' + e.message }
  }
}

module.exports = { handler }
