import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })
  try {
    const { path = 'user', method = 'GET', body } = await req.json()
  const token = Deno.env.get('GITHUB_TOKEN')
    if (!token) return json({ error: 'missing GITHUB_TOKEN' }, 500)
    const base = 'https://api.github.com'
    const url = base.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '')
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const txt = await res.text()
    return new Response(txt, {
      status: res.status,
      headers: { ...cors(), 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
