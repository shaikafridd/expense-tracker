import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, IS_CONFIGURED } from './lib/supabaseClient';
import App from './App';
import AuthPage from './components/AuthPage';
import { Loader2, Zap } from 'lucide-react';

/**
 * Root — auth gate.
 *
 * Rendering logic:
 *  • Supabase NOT configured → skip auth, render App in demo/LocalStorage mode
 *  • Supabase IS configured + checking session → show full-page spinner
 *  • Supabase IS configured + no session → show AuthPage (sign in / sign up)
 *  • Supabase IS configured + session exists → show App (passes `user` down)
 */
export default function Root() {
  const [user, setUser]       = useState<User | null>(null);
  const [checking, setCheck]  = useState(true);   // true while initial session check runs

  useEffect(() => {
    if (!IS_CONFIGURED) {
      setCheck(false);
      return;
    }

    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheck(false);
    });

    // 2. React to sign-in / sign-out events (covers magic links, OAuth callbacks etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Demo mode (no Supabase credentials) ── */
  if (!IS_CONFIGURED) return <App user={null} />;

  /* ── Loading spinner while session is resolved ── */
  if (checking) {
    return (
      <div className="bg-mesh" style={{
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg,#065F46,#6EE7B7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={24} color="#fff" />
        </div>
        <Loader2 size={20} color="var(--text3)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Not authenticated → sign-in page ── */
  if (!user) return <AuthPage />;

  /* ── Authenticated → main app ── */
  return <App user={user} />;
}
