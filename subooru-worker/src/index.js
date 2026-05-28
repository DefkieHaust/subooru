export default {
  async fetch(request) {
    const url = new URL(request.url).searchParams.get('url')
    if (!url) return new Response('Missing url', { status: 400 })

    const response = await fetch(url, {
      headers: { 'Referer': 'https://gelbooru.com/' }
    })
    if (!response.ok) {
      return new Response(await response.text(), { status: response.status })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
