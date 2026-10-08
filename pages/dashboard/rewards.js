import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import { useUser, Title, card, Empty } from '../../components/ui/kit'

export default function Rewards() {
  const user = useUser()
  const [levels, setLevels] = useState([])
  const [xp, setXp] = useState(0)
  const [levelId, setLevelId] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('player_levels').select('*').order('xp_required', { ascending: true }),
      supabase.from('profiles').select('total_xp, player_level_id').eq('id', user.id).single(),
    ]).then(([{ data: l }, { data: p }]) => { setLevels(l || []); setXp(p?.total_xp || 0); setLevelId(p?.player_level_id) })
  }, [user])

  const next = levels.find(l => l.xp_required > xp)
  return (
    <PlayerLayout>
      <Head><title>Rewards & VIP — Casinoze Room</title></Head>
      <Title sub="Earn XP as you play and climb the VIP levels">Rewards & VIP</Title>
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Your XP</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24' }}>{xp.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{next ? `${(next.xp_required - xp).toLocaleString()} XP to reach ${next.name}` : levels.length ? "You've reached the top level 👑" : ''}</div>
      </div>
      {levels.length === 0 ? <Empty icon="⭐" text="Levels are coming soon" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(210px,100%),1fr))', gap: 14 }}>
          {levels.map(l => {
            const reached = xp >= l.xp_required, current = l.id === levelId
            const c = l.badge_color || '#fbbf24'
            return (
              <div key={l.id} style={{ ...card, borderColor: current ? c : 'rgba(251,191,36,.14)', opacity: reached ? 1 : .55, boxShadow: current ? `0 0 24px ${c}33` : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${c}`, background: `${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{reached ? '⭐' : '🔒'}</div>
                <div style={{ fontWeight: 800, color: c }}>{l.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>{l.xp_required.toLocaleString()} XP{current ? ' · Current' : ''}</div>
              </div>
            )
          })}
        </div>
      )}
    </PlayerLayout>
  )
}
