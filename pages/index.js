import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Logo from '../components/ui/Logo'
import { FAQS } from '../lib/siteContent'
import { GAME_CATALOG } from '../lib/gameCatalog'

// ─── GAME DATA with real brand colors & SVG logos ──────────────────────────
const GAMES = GAME_CATALOG   // the 23 games live in lib/gameCatalog.js

// ═══════════════════════════════════════════════════════════════════
//  EDIT HERE. Only put things in this block that are TRUE for your business.
//  Anything left empty ('' / null / []) is simply hidden on the page.
// ═══════════════════════════════════════════════════════════════════
const SITE = {
  signupBonus: '',      // e.g. '100% first-deposit bonus'  → shows in the top bar and the hero badge
  playersOnline: null,  // a REAL number, e.g. 312            → shows "312 PLAYERS ONLINE" in the top bar
  heroBanner: '',       // e.g. '/images/banners/hero.jpg'  (file in public/images/banners/) — '' keeps the default background
  reviews: [],          // REAL player reviews, e.g. [{ name:'Jay G.', tag:'Fire Kirin', stars:5, text:'…' }]
                        // (the Reviews section and its menu link are hidden while this is empty)
}

const STEPS = [
  { num:'01', icon:'👤', title:'Register Free',  sub:'Create Account', desc:'Create your account. Your wallet is set up for you.', color:'#fbbf24' },
  { num:'02', icon:'💳', title:'Add Money',      sub:'Upload & Review', desc:'Choose a payment method and upload your payment proof. Our team reviews it and adds the funds to your wallet.', color:'#f59e0b' },
  { num:'03', icon:'🎮', title:'Load & Play',    sub:'Enjoy the Game', desc:'Load credits from your wallet into your game room. Our team processes the load, then you play.', color:'#10b981' },
]

// Only facts that come from this page itself
const STATS = [
  { val:GAMES.length, suffix:'', label:'Game Rooms' },
  { val:1,            suffix:'', label:'Wallet for Every Game' },
]

const TESTIMONIALS = SITE.reviews

const PARTICLES = Array.from({length:30},(_,i)=>({
  id:i, symbol:['♠','♥','♦','♣','🎰','💎','🃏','⭐','🎲','👑'][i%10],
  x:Math.random()*100, dur:10+Math.random()*16, delay:Math.random()*12,
  size:12+Math.random()*18, opacity:0.03+Math.random()*0.08,
}))

// ─── HOOKS ─────────────────────────────────────────────────────────────────
function useCountUp(target,duration=2000){
  const [count,setCount]=useState(0)
  const [started,setStarted]=useState(false)
  const ref=useRef()
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setStarted(true)},{threshold:.4})
    if(ref.current)obs.observe(ref.current)
    return()=>obs.disconnect()
  },[])
  useEffect(()=>{
    if(!started)return
    const num=parseInt(target)||0
    const steps=60,interval=duration/steps,inc=num/steps
    let cur=0
    const t=setInterval(()=>{cur+=inc;if(cur>=num){setCount(num);clearInterval(t)}else setCount(Math.floor(cur))},interval)
    return()=>clearInterval(t)
  },[started,target,duration])
  return[count,ref]
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
function StatCard({val,suffix,label}){
  const[count,ref]=useCountUp(val)
  return(
    <div ref={ref} style={{textAlign:'center',padding:'28px 36px',borderRight:'1px solid rgba(255,255,255,.06)',flex:1,minWidth:120}}>
      <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:36,fontWeight:900,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1,marginBottom:8}}>{count}{suffix}</div>
      <div style={{fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.35)',fontWeight:700}}>{label}</div>
    </div>
  )
}

function LiveBar(){
  const items=[
    SITE.playersOnline ? ['#10b981',`🟢 ${Number(SITE.playersOnline).toLocaleString()} PLAYERS ONLINE`] : null,
    SITE.signupBonus   ? ['#fbbf24',`💎 ${String(SITE.signupBonus).toUpperCase()}`] : null,
    ['#fbbf24',`🎮 ${GAMES.length} GAME ROOMS`],
    ['#10b981','👛 ONE WALLET FOR EVERY GAME'],
    ['rgba(255,255,255,.6)','18+ · PLAY RESPONSIBLY'],
  ].filter(Boolean)
  return(
    <div style={{background:'rgba(5,5,5,.97)',borderBottom:'1px solid rgba(251,191,36,.2)',height:36,display:'flex',alignItems:'center',overflow:'hidden',position:'fixed',top:0,left:0,right:0,zIndex:101}}>
      <div style={{display:'flex',alignItems:'center',gap:40,animation:'marquee 30s linear infinite',whiteSpace:'nowrap',width:'max-content'}}>
        {[...Array(3)].map((_,rep)=>(
          <span key={rep} style={{display:'inline-flex',alignItems:'center',gap:32}}>
            {items.map(([c,t],i)=>(
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:32}}>
                <span style={{color:c,fontSize:12,fontWeight:800,letterSpacing:'.06em'}}>{t}</span>
                <span style={{color:'rgba(255,255,255,.2)',fontSize:12}}>✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function GameCard({game,index}){
  const[failed,setFailed]=useState(false)
  return(
    <Link href="/auth/register" className="gtile" aria-label={`${game.name} — join to play`}
      style={{'--i':index,'--g1':game.tint[0],'--g2':game.tint[1],'--accent':game.accent,'--glow':game.accent+'66'}}>
      {game.bonus>0&&<span className="gtile-badge gtile-bonus">{game.bonus}%</span>}
      {game.hot&&<span className="gtile-badge gtile-hot">🔥 HOT</span>}
      <div className="gtile-art">
        {failed
          ?<span style={{fontSize:42}}>🎮</span>
          :<img src={game.src} alt={game.name} loading={index<12?'eager':'lazy'} onError={()=>setFailed(true)}/>}
      </div>
      <div className="gtile-bar"><span className="gtile-play">▶</span><span className="gtile-name">{game.name}</span></div>
    </Link>
  )
}

function TestiCard({t}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:'rgba(255,255,255,.03)',border:`1px solid rgba(251,191,36,${hov?.5:.15})`,
      borderRadius:20,padding:'28px 24px',backdropFilter:'blur(10px)',
      transition:'all .3s',transform:hov?'translateY(-4px)':'none',
      boxShadow:hov?'0 16px 48px rgba(251,191,36,.15)':'none',
    }}>
      <div style={{color:'#f59e0b',fontSize:14,marginBottom:12}}>{'★'.repeat(t.stars)}</div>
      <p style={{color:'rgba(255,255,255,.6)',fontSize:14,lineHeight:1.8,marginBottom:20,fontStyle:'italic'}}>"{t.text}"</p>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#fbbf24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#fff'}}>{t.name[0]}</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>{t.name}</div>
          <div style={{fontSize:11,color:'#fbbf24',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>{t.tag}</div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({q,a}){
  const[open,setOpen]=useState(false)
  return(
    <div style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
      <button onClick={()=>setOpen(p=>!p)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 0',background:'none',border:'none',cursor:'pointer',color:'#fff',textAlign:'left'}}>
        <span style={{fontSize:15,fontWeight:600}}>{q}</span>
        <span style={{color:'#fbbf24',fontSize:22,fontWeight:300,transform:open?'rotate(45deg)':'none',transition:'transform .2s',flexShrink:0,marginLeft:16}}>+</span>
      </button>
      {open&&<div style={{color:'rgba(255,255,255,.5)',fontSize:14,lineHeight:1.8,paddingBottom:20}}>{a}</div>}
    </div>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function Home(){
  const[scrollY,setScrollY]=useState(0)
  const[mousePos,setMousePos]=useState({x:0,y:0})
  const[gameFilter,setGameFilter]=useState('all')

  useEffect(()=>{
    const onScroll=()=>setScrollY(window.scrollY)
    const onMouse=e=>setMousePos({x:e.clientX/window.innerWidth,y:e.clientY/window.innerHeight})
    window.addEventListener('scroll',onScroll,{passive:true})
    window.addEventListener('mousemove',onMouse,{passive:true})
    return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('mousemove',onMouse)}
  },[])

  const px=(mousePos.x-.5)*28, py=(mousePos.y-.5)*28
  const filteredGames=gameFilter==='hot'?GAMES.filter(g=>g.hot):GAMES

  return(
    <>
      <Head>
        <title>Casinoze Room — #1 Fish Game Room Platform</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <meta name="description" content="One account and one wallet for every game room. Add money, load credits and play."/>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{scroll-behavior:smooth}
          body{background:var(--bg-gradient);background-attachment:fixed;color:#fff;font-family:'Outfit',sans-serif;overflow-x:hidden}
          ::-webkit-scrollbar{width:4px}
          ::-webkit-scrollbar-track{background:#0b1220}
          ::-webkit-scrollbar-thumb{background:linear-gradient(#f59e0b,#f59e0b);border-radius:2px}
          #cz-cur{position:fixed;width:10px;height:10px;background:#f59e0b;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:screen}
          #cz-ring{position:fixed;width:32px;height:32px;border:1.5px solid rgba(251,191,36,.55);border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%)}
          @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}
          @keyframes floatUp{0%{transform:translateY(110vh) rotate(0deg);opacity:0}5%{opacity:1}95%{opacity:1}100%{transform:translateY(-15vh) rotate(540deg);opacity:0}}
          @keyframes shimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
          @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,.35),0 0 60px rgba(251,191,36,.1)}50%{box-shadow:0 0 40px rgba(251,191,36,.65),0 0 100px rgba(251,191,36,.25)}}
          @keyframes logoNeon{0%,100%{text-shadow:0 0 8px #fbbf24,0 0 24px #f59e0b}50%{text-shadow:0 0 18px #fcd34d,0 0 50px #fbbf24,0 0 80px #d97706}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.5}}
          @keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
          @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
          .fade1{animation:fadeUp .8s .1s both}
          .fade2{animation:fadeUp .8s .25s both}
          .fade3{animation:fadeUp .8s .4s both}
          .fade4{animation:fadeUp .8s .55s both}
          .fade5{animation:fadeUp .8s .7s both}
          .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:15px 40px;background:linear-gradient(135deg,#f59e0b,#fbbf24,#fcd34d);color:#050505;font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;border-radius:14px;text-decoration:none;letter-spacing:.04em;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 0 28px rgba(245,158,11,.4),0 4px 16px rgba(0,0,0,.4);position:relative;overflow:hidden}
          .btn-gold::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-100%);transition:transform .45s}
          .btn-gold:hover::after{transform:translateX(100%)}
          .btn-gold:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 0 50px rgba(245,158,11,.6),0 8px 28px rgba(0,0,0,.5)}
          .btn-outline{display:inline-flex;align-items:center;gap:8px;padding:14px 36px;background:rgba(255,255,255,.04);border:1.5px solid rgba(251,191,36,.45);color:#fff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;border-radius:14px;text-decoration:none;letter-spacing:.04em;cursor:pointer;transition:all .2s;backdrop-filter:blur(12px)}
          .btn-outline:hover{background:rgba(251,191,36,.18);border-color:rgba(251,191,36,.85);transform:translateY(-3px);box-shadow:0 0 28px rgba(251,191,36,.3)}
          .section-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:5px 16px;border-radius:99px;margin-bottom:16px}
          .game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(190px,46%),1fr));gap:18px;padding-top:14px}
          .gtile{position:relative;display:block;text-decoration:none;color:#fff;border-radius:18px;overflow:hidden;cursor:pointer;
            background:linear-gradient(165deg,var(--g1) 0%,var(--g2) 62%,#0a1222 100%);border:1px solid rgba(255,255,255,.09);
            box-shadow:0 6px 20px rgba(0,0,0,.4);animation:tileIn .55s ease backwards;animation-delay:calc(var(--i)*45ms);
            transition:transform .3s cubic-bezier(.2,.9,.3,1.35),box-shadow .3s,border-color .3s;will-change:transform;-webkit-tap-highlight-color:transparent}
          .gtile::after{content:'';position:absolute;top:0;left:-70%;width:45%;height:100%;pointer-events:none;
            background:linear-gradient(105deg,transparent,rgba(255,255,255,.26),transparent);transform:skewX(-18deg);transition:left .75s ease}
          .gtile-art{aspect-ratio:1/1.02;display:flex;align-items:center;justify-content:center;padding:20px 16px 8px}
          .gtile-art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 16px rgba(0,0,0,.55));transition:transform .4s cubic-bezier(.2,.9,.3,1.35)}
          .gtile-bar{display:flex;align-items:center;gap:8px;padding:13px 14px;background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.62));
            border-top:1px solid rgba(255,255,255,.08);font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.85)}
          .gtile-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .gtile-play{font-size:9px;color:var(--accent);transition:transform .3s;flex-shrink:0}
          .gtile-badge{position:absolute;top:0;z-index:2;font-size:10px;font-weight:800;padding:4px 9px;color:#fff}
          .gtile-bonus{right:0;background:#e5484d;border-bottom-left-radius:10px}
          .gtile-hot{left:0;background:linear-gradient(135deg,#ef4444,#f97316);border-bottom-right-radius:10px}
          .gtile:hover,.gtile:focus-visible,.gtile:active{transform:translateY(-12px) scale(1.07);z-index:5;border-color:var(--accent);outline:none;
            box-shadow:0 28px 50px rgba(0,0,0,.65),0 0 0 1px var(--accent),0 0 40px var(--glow)}
          .gtile:hover::after,.gtile:focus-visible::after,.gtile:active::after{left:135%}
          .gtile:hover .gtile-art img,.gtile:focus-visible .gtile-art img,.gtile:active .gtile-art img{animation:gfloat 2.2s ease-in-out infinite}
          .gtile:hover .gtile-play{transform:translateX(3px)}
          @keyframes tileIn{from{opacity:0;transform:translateY(22px) scale(.96)}to{opacity:1;transform:none}}
          @keyframes gfloat{0%,100%{transform:scale(1.13) translateY(0) rotate(-1deg)}50%{transform:scale(1.17) translateY(-6px) rotate(1deg)}}
          @media(prefers-reduced-motion:reduce){.gtile{animation:none}.gtile:hover,.gtile:active{transform:none}.gtile:hover .gtile-art img{animation:none}}
          @media(max-width:768px){
            .game-grid{grid-template-columns:repeat(2,1fr);gap:12px}
            .gtile-bar{font-size:11px;padding:11px 10px}
            .hero-btns{flex-direction:column;align-items:center}
            .stats-bar>div{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.06)}
            .about-grid{grid-template-columns:1fr!important}
            .contact-grid{grid-template-columns:1fr!important}
            .nav-anchors{display:none!important}
            .site-nav{padding:8px 14px!important}
            .nav-links{gap:0!important}
            .nav-logo .logo-mark{height:40px!important;width:40px!important}
            .nav-logo .logo-text>span:first-child{font-size:16px!important}
            .nav-logo .logo-text>span:last-child{font-size:11px!important}
            .nav-btns{gap:8px!important}
            .nav-btns a{padding:8px 14px!important;font-size:12px!important}
            .about-grid{padding:56px 20px!important;gap:32px!important}
            .contact-grid{gap:32px!important}
          }
          @media(max-width:420px){
            .nav-logo .logo-text{display:none}
          }
        `}</style>
      </Head>

      {/* Custom cursor */}
      <div id="cz-cur"/>
      <div id="cz-ring"/>
      <script dangerouslySetInnerHTML={{__html:`const C=document.getElementById('cz-cur'),R=document.getElementById('cz-ring');let mx=0,my=0,rx=0,ry=0;document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;C.style.left=mx+'px';C.style.top=my+'px'});(function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;R.style.left=rx+'px';R.style.top=ry+'px';requestAnimationFrame(loop)})()`}}/>

      {/* Floating particles */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        {PARTICLES.map(p=>(
          <div key={p.id} style={{position:'absolute',left:`${p.x}%`,bottom:'-10%',fontSize:p.size,opacity:p.opacity,userSelect:'none',animation:`floatUp ${p.dur}s ${p.delay}s infinite linear`}}>{p.symbol}</div>
        ))}
      </div>

      {/* Parallax BG orbs */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:`calc(15% + ${py*1.4}px)`,left:`calc(10% + ${px*1.4}px)`,width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,.16) 0%,transparent 70%)',filter:'blur(50px)',transition:'top .15s,left .15s'}}/>
        <div style={{position:'absolute',top:`calc(55% + ${py*-.9}px)`,right:`calc(8% + ${px*-.9}px)`,width:450,height:450,borderRadius:'50%',background:'radial-gradient(circle,rgba(245,158,11,.09) 0%,transparent 70%)',filter:'blur(60px)',transition:'top .15s,right .15s'}}/>
        <div style={{position:'absolute',bottom:'20%',left:'40%',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,.07) 0%,transparent 70%)',filter:'blur(55px)'}}/>
      </div>

      {/* ── LIVE TICKER ── */}
      <LiveBar/>

      {/* ── NAV ── */}
      <nav className="site-nav" style={{position:'fixed',top:36,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:scrollY>40?'rgba(5,5,5,.94)':'transparent',backdropFilter:scrollY>40?'blur(24px)':'none',borderBottom:scrollY>40?'1px solid rgba(251,191,36,.18)':'none',transition:'all .4s'}}>
        <div className="nav-logo" style={{display:'flex',alignItems:'center',gap:12}}>
          <Logo variant="full" height={66} />
        </div>
        <div className="nav-links" style={{display:'flex',alignItems:'center',gap:32}}>
          <div className="nav-anchors" style={{display:'flex',gap:28}}>
            {[['Games','#games'],['How It Works','#how'],...(TESTIMONIALS.length?[['Reviews','#reviews']]:[]),['FAQ','#faq']].map(([label,href])=>(
              <a key={label} href={href} style={{color:'rgba(255,255,255,.6)',textDecoration:'none',fontSize:14,fontWeight:600,letterSpacing:'.03em',transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.6)'}>{label}</a>
            ))}
          </div>
          <div className="nav-btns" style={{display:'flex',gap:10}}>
            <Link href="/auth/login" className="btn-outline" style={{padding:'9px 22px',fontSize:13}}>Login</Link>
            <Link href="/auth/register" className="btn-gold" style={{padding:'9px 22px',fontSize:13}}>🎲 Join Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'160px 24px 100px',textAlign:'center',position:'relative',zIndex:2,overflow:'hidden'}}>
        {/* Hero background image — dark fantasy wizard/dragon from Pixabay (free) */}
        <div style={{position:'absolute',inset:0,zIndex:0}}>
          <img
            src={SITE.heroBanner||"https://cdn.pixabay.com/photo/2023/09/11/08/15/ai-generated-8246488_1280.jpg"}
            alt=""
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',opacity:SITE.heroBanner?.5:.18,filter:SITE.heroBanner?'none':'saturate(1.4) hue-rotate(210deg)'}}
            onError={e=>e.target.style.display='none'}
          />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(7,9,15,.4) 0%,rgba(7,9,15,.3) 40%,rgba(7,9,15,.9) 80%,#050505 100%)'}}/>
          {/* Teal/purple scanline glow like highrollers */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:180,background:'linear-gradient(to top,rgba(0,200,200,.08),transparent)'}}/>
        </div>

        {/* Content */}
        <div style={{position:'relative',zIndex:1}}>
          {SITE.signupBonus && (
          <div className="fade1" style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.35)',borderRadius:99,padding:'6px 20px',fontSize:12,fontWeight:800,color:'#fbbf24',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:20}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#10b981',display:'inline-block',animation:'pulseDot 1.5s infinite'}}/>
            🎁 {SITE.signupBonus}
          </div>
          )}

          <h1 className="fade2" style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(34px,7vw,90px)',fontWeight:900,lineHeight:1.05,marginBottom:12,letterSpacing:'-.01em'}}>
            Play Smart.
          </h1>
          <h1 className="fade3" style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(34px,7vw,90px)',fontWeight:900,lineHeight:1.05,marginBottom:32,background:'linear-gradient(90deg,#fbbf24,#ec4899,#f59e0b,#fbbf24)',backgroundSize:'300% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shimmer 4s linear infinite'}}>
            Win Bigger.
          </h1>

          <p className="fade4" style={{color:'rgba(255,255,255,.55)',fontSize:18,maxWidth:560,margin:'0 auto 48px',lineHeight:1.85,fontWeight:400}}>
            One account and one wallet unlock <strong style={{color:'#fff',fontWeight:700}}>{GAMES.length} game rooms</strong>. Add money, load credits into your game, and play.
          </p>

          <div className="fade5 hero-btns" style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:80}}>
            <Link href="/auth/register" className="btn-gold" style={{fontSize:16,padding:'17px 52px'}}>🎲 Start Playing — Free</Link>
            <Link href="/auth/login" className="btn-outline" style={{fontSize:16,padding:'16px 44px'}}>Login to Account</Link>
          </div>

          {/* Stats bar */}
          <div className="stats-bar" style={{display:'flex',flexWrap:'wrap',justifyContent:'center',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:22,overflow:'hidden',animation:'glow 5s infinite',backdropFilter:'blur(12px)'}}>
            {STATS.map((s,i)=><StatCard key={i} {...s}/>)}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(0,200,200,.5),rgba(251,191,36,.4),transparent)',margin:'0 8%'}}/>

      {/* ── TRENDING GAMES STRIP ── */}
      <div style={{padding:'28px 0',overflow:'hidden',background:'rgba(0,0,0,.3)',borderTop:'1px solid rgba(255,255,255,.04)',borderBottom:'1px solid rgba(255,255,255,.04)',position:'relative',zIndex:2}}>
        <div style={{fontSize:13,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',textAlign:'center',marginBottom:16}}>
          🔥 Trending Social Games Right Now
        </div>
        <div style={{display:'flex',gap:14,animation:'marquee 20s linear infinite',whiteSpace:'nowrap',width:'max-content',paddingLeft:24}}>
          {[...GAMES,...GAMES].map((g,i)=>(
            <div key={i} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 20px',borderRadius:99,background:`rgba(0,0,0,.5)`,border:`1px solid ${g.accent}44`,cursor:'pointer',transition:'all .2s',flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',color:g.accent}}>{g.name}</span>
              {g.hot&&<span style={{fontSize:9,background:'#ef4444',color:'#fff',padding:'1px 5px',borderRadius:99,fontWeight:700}}>HOT</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── GAMES SECTION ── */}
      <section id="games" style={{padding:'100px 24px',position:'relative',zIndex:2}}>
        <div style={{maxWidth:1260,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="section-tag" style={{background:'rgba(245,158,11,.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.3)'}}>Epic Arcade Games</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(26px,4.5vw,54px)',fontWeight:700,marginBottom:14}}>Play & Level Up Gaming</h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:16,marginBottom:32,fontWeight:400}}>One wallet. Every game room.</p>
            {GAMES.some(g=>g.hot)&&(
            <div style={{display:'inline-flex',gap:0,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:4}}>
              {[['all','All Games'],['hot','🔥 Hot Games']].map(([key,label])=>(
                <button key={key} onClick={()=>setGameFilter(key)} style={{padding:'9px 28px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,background:gameFilter===key?'linear-gradient(135deg,#f59e0b,#fbbf24)':'transparent',color:gameFilter===key?'#fff':'rgba(255,255,255,.5)',transition:'all .2s'}}>{label}</button>
              ))}
            </div>
            )}
          </div>
          <div className="game-grid">
            {filteredGames.map((g,i)=><GameCard key={g.name} game={g} index={i}/>)}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(245,158,11,.3),rgba(251,191,36,.5),transparent)',margin:'0 8%'}}/>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{padding:'100px 24px',position:'relative',zIndex:2,background:'radial-gradient(ellipse 70% 50% at 50% 50%,rgba(245,158,11,.07) 0%,transparent 70%)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:64}}>
            <div className="section-tag" style={{background:'rgba(251,191,36,.12)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.3)'}}>How It Works</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(24px,4.5vw,52px)',fontWeight:700,marginBottom:14}}>Create Your Free Account &<br/>Start Your Adventure!</h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:16}}>Three simple steps. That's all it takes to start playing.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(280px,100%),1fr))',gap:24,position:'relative'}}>
            <div style={{position:'absolute',top:56,left:'16%',right:'16%',height:1,background:'linear-gradient(90deg,rgba(251,191,36,.5),rgba(245,158,11,.5),rgba(16,185,129,.5))',zIndex:0}}/>
            {STEPS.map((s,i)=>(
              <div key={i} style={{position:'relative',zIndex:1,background:'rgba(255,255,255,.03)',border:`1px solid ${s.color}33`,borderRadius:24,padding:'44px 28px 32px',textAlign:'center',transition:'all .3s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color+'99';e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.boxShadow=`0 24px 60px rgba(0,0,0,.4),0 0 40px ${s.color}22`}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=s.color+'33';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}
              >
                <div style={{position:'absolute',top:-22,left:'50%',transform:'translateX(-50%)',width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${s.color},${s.color}bb)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700,color:'#fff',boxShadow:`0 0 20px ${s.color}55`}}>{i+1}</div>
                <div style={{width:72,height:72,borderRadius:20,margin:'0 auto 20px',background:`linear-gradient(135deg,${s.color}22,${s.color}0a)`,border:`1px solid ${s.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>{s.icon}</div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:s.color,marginBottom:8}}>{s.sub}</div>
                <h3 style={{fontFamily:"'Cinzel',serif",fontSize:20,fontWeight:700,marginBottom:14,color:'#fff'}}>{s.title}</h3>
                <p style={{color:'rgba(255,255,255,.45)',fontSize:14,lineHeight:1.8}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION with real image ── */}
      <section style={{position:'relative',zIndex:2,overflow:'hidden',background:'linear-gradient(135deg,rgba(245,158,11,.1),rgba(245,158,11,.04))',borderTop:'1px solid rgba(251,191,36,.12)',borderBottom:'1px solid rgba(251,191,36,.12)'}}>
        <div className="about-grid" style={{maxWidth:1100,margin:'0 auto',padding:'90px 24px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center'}}>
          {/* Left: image */}
          <div style={{position:'relative',borderRadius:24,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.7)',border:'1px solid rgba(251,191,36,.25)'}}>
            <img
              src="https://cdn.pixabay.com/photo/2023/07/25/10/09/wizard-8149654_1280.jpg"
              alt="Elite Gaming"
              style={{width:'100%',height:380,objectFit:'cover',objectPosition:'center',filter:'saturate(1.3) hue-rotate(200deg) brightness(.85)'}}
              onError={e=>{e.target.parentElement.style.background='linear-gradient(135deg,#1a0050,#0a0030)';e.target.style.display='none'}}
            />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(7,9,15,.8) 100%)'}}/>
            {/* Stats overlay */}
            <div style={{position:'absolute',bottom:24,left:24,right:24,display:'flex',gap:24}}>
              <div style={{background:'rgba(0,0,0,.7)',backdropFilter:'blur(12px)',border:'1px solid rgba(251,191,36,.3)',borderRadius:14,padding:'14px 20px',flex:1,textAlign:'center'}}>
                <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:28,fontWeight:900,color:'#fbbf24',lineHeight:1}}>{GAMES.length}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.45)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginTop:4}}>Game Rooms</div>
              </div>
            </div>
          </div>
          {/* Right: text */}
          <div>
            <div className="section-tag" style={{background:'rgba(251,191,36,.1)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.3)'}}>About Casinoze Room</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(22px,3.5vw,42px)',fontWeight:700,marginBottom:20,lineHeight:1.3}}>Forging Legends in<br/>the Gaming Universe</h2>
            <p style={{color:'rgba(255,255,255,.5)',fontSize:15,lineHeight:1.9,marginBottom:16}}>
              <strong style={{color:'#fbbf24'}}>Casinoze Room</strong> gives you one account and one wallet for a whole range of game rooms. Add money, load credits into the game you choose, and manage everything from one dashboard.
            </p>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:14,lineHeight:1.9,marginBottom:28}}>
              From classic fish games to modern sweepstakes rooms, everything is managed from your dashboard: deposits, game accounts, loads, redemptions and withdrawals.
            </p>
            <div style={{display:'flex',gap:16}}>
              <Link href="/auth/register" className="btn-gold" style={{fontSize:14,padding:'13px 32px'}}>🎲 Get Started</Link>
              <Link href="#games" className="btn-outline" style={{fontSize:14,padding:'12px 28px'}}>Browse Games</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER with background image ── */}
      <section style={{position:'relative',zIndex:2,overflow:'hidden',minHeight:320,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {/* Background image */}
        <img
          src="https://cdn.pixabay.com/photo/2023/09/04/05/19/ai-generated-8232508_1280.jpg"
          alt=""
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',opacity:.22,filter:'saturate(1.5) hue-rotate(220deg)'}}
          onError={e=>e.target.style.display='none'}
        />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(7,9,15,.7),rgba(7,9,15,.5),rgba(7,9,15,.7))'}}/>
        <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'80px 24px',maxWidth:700}}>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(24px,4vw,50px)',fontWeight:700,marginBottom:16,lineHeight:1.3}}>
            Join Our Elite Community<br/>of Players & Achievers!
          </h2>
          <p style={{color:'rgba(255,255,255,.55)',fontSize:16,marginBottom:40,lineHeight:1.8}}>
            To create the ultimate game room experience, we've packed in features that keep every session thrilling and seamless.
          </p>
          <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/auth/register" className="btn-gold" style={{fontSize:16,padding:'17px 52px'}}>🎲 Play Game Now</Link>
            <Link href="#games" className="btn-outline" style={{fontSize:16,padding:'16px 44px'}}>Browse Games</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (only shown when SITE.reviews has real reviews) ── */}
      {TESTIMONIALS.length>0 && (
      <section id="reviews" style={{padding:'90px 24px',position:'relative',zIndex:2}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="section-tag" style={{background:'rgba(245,158,11,.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.3)'}}>★ Customer Feedback</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(24px,4vw,48px)',fontWeight:700,marginBottom:12}}>What Players Say</h2>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:15}}>Feedback from our players.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))',gap:20}}>
            {TESTIMONIALS.map((t,i)=><TestiCard key={i} t={t}/>)}
          </div>
        </div>
      </section>
      )}

      {/* ── CONTACT + FAQ ── */}
      <section id="faq" style={{padding:'80px 24px 100px',position:'relative',zIndex:2,borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div className="contact-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60}}>
            {/* Contact */}
            <div>
              <div className="section-tag" style={{background:'rgba(16,185,129,.1)',color:'#10b981',border:'1px solid rgba(16,185,129,.3)'}}>Contact Us</div>
              <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(22px,3vw,38px)',fontWeight:700,marginBottom:12}}>Get in Touch</h2>
              <p style={{color:'rgba(255,255,255,.4)',fontSize:14,lineHeight:1.8,marginBottom:28}}>Have questions or need support? Our team is here anytime. Just send us a message.</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[['First Name','text'],['Last Name','text'],['Email','email'],['Phone','tel']].map(([label,type])=>(
                  <input key={label} type={type} placeholder={label} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'13px 18px',color:'#fff',fontFamily:"'Outfit',sans-serif",fontSize:14,outline:'none',transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor='rgba(251,191,36,.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}/>
                ))}
                <textarea placeholder="Your message..." rows={4} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'13px 18px',color:'#fff',fontFamily:"'Outfit',sans-serif",fontSize:14,outline:'none',resize:'vertical',transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor='rgba(251,191,36,.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}/>
                <button className="btn-gold" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:15}}>Send Message</button>
              </div>
            </div>
            {/* FAQ */}
            <div>
              <div className="section-tag" style={{background:'rgba(251,191,36,.1)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.3)'}}>FAQ</div>
              <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(22px,3vw,38px)',fontWeight:700,marginBottom:12}}>Frequently Asked Questions</h2>
              <p style={{color:'rgba(255,255,255,.4)',fontSize:14,lineHeight:1.8,marginBottom:28}}>Everything you need to know about Casinoze Room.</p>
              {FAQS.map((f,i)=><FaqItem key={i} q={f.q} a={f.a}/>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{padding:'80px 24px',textAlign:'center',position:'relative',zIndex:2,background:'linear-gradient(180deg,transparent,rgba(245,158,11,.08),transparent)'}}>
        <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(22px,4vw,46px)',fontWeight:700,marginBottom:16}}>
          Start Your Journey by Creating<br/>Your Free Account Today!
        </h2>
        <p style={{color:'rgba(255,255,255,.4)',fontSize:16,maxWidth:480,margin:'0 auto 36px',lineHeight:1.8}}>Create your free account and pick your game room.</p>
        <Link href="/auth/register" className="btn-gold" style={{fontSize:17,padding:'18px 64px'}}>🎰 Play Game Now</Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:'1px solid rgba(255,255,255,.06)',padding:'44px 48px 28px',position:'relative',zIndex:2}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:32,marginBottom:32}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <Logo variant="full" height={52} />
              </div>
              <p style={{color:'rgba(255,255,255,.25)',fontSize:13,maxWidth:260,lineHeight:1.7}}>One wallet. {GAMES.length} game rooms.</p>
            </div>
            <div style={{display:'flex',gap:60}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'.12em',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:16}}>Platform</div>
                {[['Games','#games'],['How It Works','#how'],['Register','/auth/register'],['Login','/auth/login']].map(([l,h])=>(<div key={l} style={{marginBottom:10}}><a href={h} style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none',fontWeight:500,transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='#fbbf24'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>{l}</a></div>))}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'.12em',color:'rgba(255,255,255,.3)',textTransform:'uppercase',marginBottom:16}}>Legal</div>
                {[['Terms of Service','/terms'],['Privacy Policy','/privacy'],['FAQ','/faq'],['About','/about'],['Support','/dashboard/support']].map(([l,h])=>(<div key={l} style={{marginBottom:10}}><a href={h} style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none',fontWeight:500,transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='#f59e0b'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.4)'}>{l}</a></div>))}
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.06)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <div style={{color:'rgba(255,255,255,.18)',fontSize:12}}>© {new Date().getFullYear()} Casinoze Room. All rights reserved.</div>
            <div style={{color:'rgba(255,255,255,.18)',fontSize:12}}>Play responsibly. 18+</div>
          </div>
        </div>
      </footer>
    </>
  )
}
