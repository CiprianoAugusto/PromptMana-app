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
    const { path = 'chat/completions', method = 'POST', body } = await req.json()
  const key = Deno.env.get('OPENAI_API_KEY')
  const base = Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1'
    if (!key) return json({ error: 'missing OPENAI_API_KEY' }, 500)
    const url = base.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '')
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': 'Bearer ' + key,
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
