// Shared by the admin APIs (validation) and the admin screens (forms). No secrets in here.

export const STAFF_ROLES = ['super_admin', 'finance', 'game_ops', 'support', 'kyc_agent', 'risk', 'reporting', 'marketing']

// Read-only lists
export const BROWSE = {
  wallets:      { table: 'wallets',            roles: ['super_admin', 'finance'],              order: 'cash_balance_cents' },
  transactions: { table: 'ledger',             roles: ['super_admin', 'finance', 'reporting'], order: 'created_at' },
  adjustments:  { table: 'wallet_adjustments', roles: ['super_admin', 'finance'],              order: 'created_at' },
  audit:        { table: 'audit_logs',         roles: ['super_admin'],                         order: 'created_at', byAction: true },
}

// Editable configuration tables. type: text | slug | color | int | pct | usd (stored as cents) | bool | json
export const MANAGE = {
  game_panels: {
    table: 'game_panels', roles: ['super_admin'], title: 'Game Panels', sub: 'The games players can request. Changes show on the site straight away.', sort: 'sort_order', name: r => r.name,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug (lowercase, no spaces)', type: 'slug', required: true },
      { key: 'logo_url', label: 'Logo path (e.g. /images/games/firekirin.png)', type: 'text' },
      { key: 'accent_color', label: 'Accent color', type: 'color' },
      { key: 'default_bonus_pct', label: 'Bonus %', type: 'pct' },
      { key: 'min_load_cents', label: 'Minimum load ($)', type: 'usd' },
      { key: 'sort_order', label: 'Sort order', type: 'int' },
      { key: 'is_active', label: 'Active (visible to players)', type: 'bool' },
    ],
  },
  payment_methods: {
    table: 'payment_methods', roles: ['super_admin', 'finance'], title: 'Payment Methods', sub: 'How players pay you. The payment details are shown to players on the Add Money page.', sort: 'sort_order', name: r => r.name,
    fields: [
      { key: 'name', label: 'Name (e.g. Cash App)', type: 'text', required: true },
      { key: 'type', label: 'Type (e.g. cashapp, crypto, bank)', type: 'text', required: true },
      { key: 'min_deposit_cents', label: 'Minimum deposit ($)', type: 'usd' },
      { key: 'max_deposit_cents', label: 'Maximum deposit ($)', type: 'usd' },
      { key: 'default_bonus_pct', label: 'Bonus %', type: 'pct' },
      { key: 'account_details', label: 'Payment details (JSON, e.g. {"handle": "$YourTag"})', type: 'json' },
      { key: 'sort_order', label: 'Sort order', type: 'int' },
      { key: 'is_active', label: 'Active (visible to players)', type: 'bool' },
    ],
  },
  player_levels: {
    table: 'player_levels', roles: ['super_admin', 'marketing'], title: 'Player Levels', sub: 'VIP levels. Players move up automatically as they earn XP.', sort: 'xp_required', name: r => r.name,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'xp_required', label: 'XP required', type: 'int', required: true },
      { key: 'badge_color', label: 'Badge color', type: 'color' },
    ],
  },
}

// Validates + normalizes the fields for one record. Unknown keys are dropped.
export function cleanFields(kind, input, { creating = false } = {}) {
  const cfg = MANAGE[kind]
  const out = {}
  for (const f of cfg.fields) {
    if (!(f.key in (input || {}))) { if (creating && f.required) return { error: `${f.label} is required` }; continue }
    let v = input[f.key]
    const bad = (m) => ({ error: `${f.label}: ${m}` })
    if (f.type === 'bool') { if (typeof v !== 'boolean') return bad('must be on or off'); out[f.key] = v; continue }
    if (v === '' || v === null || v === undefined) { if (f.required) return bad('is required'); out[f.key] = null; continue }
    if (f.type === 'text') out[f.key] = String(v).trim().slice(0, 300)
    else if (f.type === 'slug') { v = String(v).trim().toLowerCase(); if (!/^[a-z0-9-]{2,40}$/.test(v)) return bad('use 2–40 lowercase letters, numbers or dashes'); out[f.key] = v }
    else if (f.type === 'color') { v = String(v).trim(); if (!/^#[0-9a-fA-F]{6}$/.test(v)) return bad('use a color like #fbbf24'); out[f.key] = v }
    else if (f.type === 'int' || f.type === 'usd') { v = Number(v); if (!Number.isInteger(v) || v < 0 || v > 1e9) return bad('must be a whole number, 0 or more'); out[f.key] = v }
    else if (f.type === 'pct') { v = Number(v); if (!Number.isFinite(v) || v < 0 || v > 100) return bad('must be between 0 and 100'); out[f.key] = v }
    else if (f.type === 'json') {
      try { v = typeof v === 'string' ? JSON.parse(v) : v } catch { return bad('is not valid JSON') }
      if (!v || typeof v !== 'object' || Array.isArray(v)) return bad('must be a JSON object like {"key": "value"}')
      out[f.key] = v
    }
    if (f.required && out[f.key] === '') return bad('is required')
  }
  return { values: out }
}
