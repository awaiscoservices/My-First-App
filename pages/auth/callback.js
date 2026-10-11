/**
 * /auth/callback
 * Handles OAuth redirect from Supabase (Google sign-in).
 * Exchanges the code for a session, then redirects based on role.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      // Supabase automatically handles the code exchange on page load.
      // We just need to wait for the session to be established.
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // If still no session after a short wait, try once more
        await new Promise(r => setTimeout(r, 1000));
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (!s2) { router.replace('/login'); return; }
      }

      const userId = session?.user?.id;
      if (!userId) { router.replace('/login'); return; }

      // Check role and handle referral if coming from Google
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role && profile.role !== 'player') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    };

    handle();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#04000d',
      fontFamily: 'Outfit, sans-serif',
      color: '#fff',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid rgba(168,85,247,0.3)',
        borderTopColor: '#a855f7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Signing you in…</p>
    </div>
  );
}
