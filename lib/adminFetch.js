// Browser-side helper for the admin screens. NEVER throws: always returns { ok, data } or { ok:false, error }.
// This is what stops a page from sitting on "Loading…" forever when the server sends back an error page.
import { supabase } from './supabase'

export async function adminFetch(url, { method = 'GET', body } = {}) {
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    if (res.ok && data) return { ok: true, data }
    if (data && data.error) return { ok: false, status: res.status, error: data.error }
    if (res.status === 404) return { ok: false, status: 404, error: 'This server route was not found (404). The latest files may not be deployed yet — check that the newest Vercel deployment finished.' }
    return { ok: false, status: res.status, error: `The server returned an error (${res.status}). The usual cause is a missing SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables (then redeploy).` }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your internet connection and try again.' }
  }
}
