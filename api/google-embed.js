// GET /api/google-embed  ->  { embeddable: true | false }
// The Google card shows real results inside the page using Google's
// undocumented igu=1 setting, which turns off Google's "don't show me inside
// other sites" header. If Google ever stops honoring it, the card should open
// a new tab instead of showing a broken box. This checks the header, and the
// answer is cached for an hour so Google is asked rarely.

export async function GET() {
  let embeddable = true
  try {
    const response = await fetch('https://www.google.com/search?igu=1&q=time', {
      signal: AbortSignal.timeout(6000),
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
      },
    })
    const frameOptions = response.headers.get('x-frame-options')
    const policy = response.headers.get('content-security-policy') ?? ''
    // Only report "blocked" when Google clearly says so; a timeout or rate
    // limit on our side shouldn't switch everyone to the fallback.
    if (frameOptions || /frame-ancestors/i.test(policy)) embeddable = false
  } catch {
    // Unknown: keep showing results in the card.
  }

  return new Response(JSON.stringify({ embeddable }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  })
}
