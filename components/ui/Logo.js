import { useState, useRef, useEffect } from 'react'

// Logo images live in /public/images/logo/ — replace those files to change the logo everywhere.
const SRC = {
  full: '/images/logo/logo.png',        // icon + "Casinoze Room" (horizontal)
  icon: '/images/logo/logo-icon.png',   // icon only (square)
}

// Shows the image; if the file isn't there yet it falls back to the old emoji badge + text.
export default function Logo({ variant = 'full', height = 40, className, style }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)

  // catches an image that already failed before React attached onError
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (!failed) {
    return (
      <img ref={ref} src={SRC[variant]} alt="Casinoze Room" className={className} onError={() => setFailed(true)}
        style={{ height, width: 'auto', display: 'block', ...style }} />
    )
  }

  const badge = (
    <span style={{ width: height, height, borderRadius: height * 0.28, flexShrink: 0, background: 'linear-gradient(135deg,#fbbf24,#b45309)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: height * 0.5, boxShadow: '0 0 16px rgba(251,191,36,.35)' }}>🎰</span>
  )
  if (variant === 'icon') return <span className={className} style={style}>{badge}</span>
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      {badge}
      <span style={{ lineHeight: 1.1, textAlign: 'left' }}>
        <span style={{ display: 'block', fontFamily: "'Cinzel', serif", fontSize: height * 0.4, fontWeight: 700, letterSpacing: '.06em', color: '#fff' }}>CASINOZE</span>
        <span style={{ display: 'block', fontFamily: "'Cinzel', serif", fontSize: height * 0.29, fontWeight: 700, letterSpacing: '.3em', color: '#fbbf24' }}>ROOM</span>
      </span>
    </span>
  )
}
