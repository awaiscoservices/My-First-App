import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const PARTICLES = ['♠', '♥', '♦', '♣'];

function Particle({ symbol, style }) {
  return (
    <div style={{
      position: 'fixed',
      fontSize: style.size,
      color: style.color,
      left: style.left,
      top: style.top,
      opacity: style.opacity,
      animation: `floatUp ${style.duration}s linear ${style.delay}s infinite`,
      pointerEvents: 'none',
      zIndex: 0,
      userSelect: 'none',
      filter: style.glow ? `drop-shadow(0 0 6px ${style.color})` : 'none',
    }}>
      {symbol}
    </div>
  );
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [referralCode, setReferralCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Pick up referral code from URL
    if (router.query.ref) setReferralCode(router.query.ref);

    const generated = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      symbol: PARTICLES[Math.floor(Math.random() * 4)],
      style: {
        left: `${Math.random() * 100}%`,
        top: `${100 + Math.random() * 20}%`,
        size: `${Math.random() * 18 + 10}px`,
        opacity: Math.random() * 0.18 + 0.04,
        duration: Math.random() * 14 + 10,
        delay: -(Math.random() * 20),
        color: Math.random() > 0.5 ? '#a855f7' : '#f59e0b',
        glow: Math.random() > 0.65,
      },
    }));
    setParticles(generated);
  }, [router.query]);

  const setField = (key, value) => {
    setForm(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError('');
    setLoading(true);

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          referral_code: referralCode.trim() || null,
        },
      },
    });

    if (error) {
      setServerError(error.message || 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    // If email confirmation is disabled and user is immediately active:
    if (data.session) {
      router.replace('/dashboard');
      return;
    }

    // Email confirmation required
    setSuccess(true);
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: referralCode ? { ref: referralCode } : undefined,
      },
    });
    if (error) {
      setServerError(error.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${focusedField === field
      ? errors[field] ? '#ef4444' : '#a855f7'
      : errors[field] ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.2)'}`,
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: 'Outfit, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    boxShadow: focusedField === field
      ? errors[field]
        ? '0 0 0 3px rgba(239,68,68,0.15)'
        : '0 0 0 3px rgba(168,85,247,0.15), 0 0 20px rgba(168,85,247,0.1)'
      : 'none',
    caretColor: '#a855f7',
  });

  const strengthLevel = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = strengthLevel(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#84cc16', '#22c55e'];

  return (
    <>
      <Head>
        <title>Create Account — Casinoze Room</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #04000d; overflow-x: hidden; }
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px rgba(10,4,30,1) inset !important;
            -webkit-text-fill-color: #ffffff !important;
            caret-color: #a855f7 !important;
          }
          @keyframes floatUp {
            0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.15); }
            50%       { box-shadow: 0 0 40px rgba(168,85,247,0.35); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes orb-float {
            0%, 100% { transform: translateY(0) scale(1); }
            50%       { transform: translateY(-30px) scale(1.06); }
          }
          @keyframes strength-grow {
            from { width: 0; }
          }
        `}</style>
      </Head>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: '#04000d', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          top: '-200px', right: '-200px', animation: 'orb-float 9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)',
          bottom: '-150px', left: '-100px', animation: 'orb-float 12s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {particles.map(p => <Particle key={p.id} symbol={p.symbol} style={p.style} />)}

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'Outfit, sans-serif',
      }}>

        {/* Logo */}
        <div style={{ animation: 'fadeSlideUp 0.6s ease both', marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', lineHeight: 1, marginBottom: '10px', filter: 'drop-shadow(0 0 18px rgba(245,158,11,0.6))' }}>🎰</div>
          <h1 style={{
            fontFamily: 'Cinzel Decorative, serif',
            fontSize: 'clamp(18px, 4vw, 26px)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #f59e0b 60%, #fbbf24 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 3s linear infinite',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>Casinoze Room</h1>
          <div style={{ marginTop: '6px', fontSize: '11px', letterSpacing: '4px', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>
            Premium Fish Game Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: '20px',
          padding: 'clamp(28px, 5vw, 44px)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeSlideUp 0.7s ease 0.1s both, pulse-glow 4s ease-in-out infinite',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, #f59e0b, #a855f7, #f59e0b, transparent)',
          }} />

          {success ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '20px', color: '#fff', marginBottom: '12px' }}>
                Check Your Email
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                We&apos;ve sent a confirmation link to <strong style={{ color: '#a855f7' }}>{form.email}</strong>.
                Click the link to activate your account and start playing.
              </p>
              <Link href="/login" style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', textAlign: 'center' }}>
                Join the Table
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
                Create your Casinoze account and start playing
              </p>

              {serverError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
                  color: '#f87171', fontSize: '13px', textAlign: 'center',
                }}>⚠ {serverError}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setField('fullName', e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your full name"
                    style={inputStyle('fullName')}
                    autoComplete="name"
                  />
                  {errors.fullName && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>⚠ {errors.fullName}</p>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    style={inputStyle('email')}
                    autoComplete="email"
                  />
                  {errors.email && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>⚠ {errors.email}</p>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Min 8 characters"
                    style={inputStyle('password')}
                    autoComplete="new-password"
                  />
                  {form.password && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: strength >= i ? strengthColor[strength] : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: strengthColor[strength] || 'rgba(255,255,255,0.3)' }}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                  {errors.password && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>⚠ {errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setField('confirmPassword', e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Repeat your password"
                    style={inputStyle('confirmPassword')}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>⚠ {errors.confirmPassword}</p>}
                </div>

                {/* Referral Code */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
                    Referral Code <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    onFocus={() => setFocusedField('ref')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. ABC123"
                    style={{ ...inputStyle('ref'), textTransform: 'uppercase', letterSpacing: '2px' }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: loading
                      ? 'rgba(168,85,247,0.3)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%)',
                    backgroundSize: '200% auto',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    letterSpacing: '0.5px',
                    animation: loading ? 'none' : 'shimmer 3s linear infinite',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: '18px', height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }} />
                      Creating Account…
                    </>
                  ) : 'Create Account'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                {googleLoading ? (
                  <span style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
