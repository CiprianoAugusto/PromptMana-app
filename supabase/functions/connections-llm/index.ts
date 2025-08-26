import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Use non-reserved secret names to avoid Supabase prefix restrictions
const SUPABASE_URL = Deno.env.get('PM_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('PM_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing PM_SUPABASE_URL or PM_SERVICE_ROLE_KEY env var')
}

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
    if (req.method !== 'POST') return json({ error: 'use POST' }, 405)

    const { label, provider, base_url, api_key } = await req.json()
    if (!base_url || !api_key) return json({ error: 'base_url and api_key required' }, 400)

    const { data: conn, error: e1 } = await supabase
      .from('llm_connections')
      .insert({ label, provider, base_url })
      .select('id')
      .single()
    if (e1) return json({ error: e1.message }, 500)

    const { error: e2 } = await supabase
      .from('llm_secrets')
      .insert({ conn_id: conn.id, api_key })
    if (e2) return json({ error: e2.message }, 500)

    return json({ id: conn.id }, 201)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
