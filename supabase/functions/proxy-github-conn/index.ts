import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('PM_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('PM_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...cors(), 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() })
  try {
    const { conn_id, path = 'user', method = 'GET', body } = await req.json()
    if (!conn_id) return json({ error: 'conn_id required' }, 400)

    const { data: conn, error: e1 } = await supabase
      .from('github_connections').select('id').eq('id', conn_id).single()
    if (e1 || !conn) return json({ error: 'connection not found' }, 404)

    const { data: sec, error: e2 } = await supabase
      .from('github_secrets').select('token').eq('conn_id', conn_id).single()
    if (e2 || !sec) return json({ error: 'secret not found' }, 404)

    const base = 'https://api.github.com'
    const url = base.replace(/\/$/, '') + '/' + String(path).replace(/^\//, '')
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': 'token ' + sec.token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const txt = await res.text()
    return new Response(txt, { status: res.status, headers: { ...cors(), 'Content-Type': res.headers.get('Content-Type') || 'application/json' } })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
