import React, { useState } from 'react';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, UserPlus, LogIn, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const [tab, setTab]         = useState<Tab>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [name, setName]       = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const reset = (t: Tab) => {
    setTab(t); setError(''); setSuccess(''); setEmail(''); setPass(''); setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (tab === 'signup') {
        if (!name.trim()) { setError('Full name is required.'); setLoading(false); return; }
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpErr) throw signUpErr;
        setSuccess('Account created! Check your email to confirm your address, then sign in.');
        setTab('signin');
        setPass('');
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
        // Root listens to onAuthStateChange — it will re-render App automatically
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mesh" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      {/* ── Decorative orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,79,.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(116,198,157,.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{
            width: '52px', height: '52px', borderRadius: '16px', marginBottom: '1rem',
            background: 'linear-gradient(135deg,#065F46,#6EE7B7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.6rem', fontWeight: 400, color: 'var(--text1)', marginBottom: '.25rem' }}>
            Sage Wealth
          </h1>
          <p style={{ fontSize: '.875rem', color: 'var(--text3)' }}>
            {tab === 'signin' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: '#fff',
          border: 'none',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 12px 40px rgba(0,0,0,.08)',
        }}>

          {/* ── Tabs ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.375rem',
            background: 'var(--bg2)', borderRadius: '12px', padding: '.3rem',
            marginBottom: '1.5rem',
          }}>
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                id={`auth-tab-${t}`}
                onClick={() => reset(t)}
                style={{
                  padding: '.55rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontWeight: 600,
                  transition: 'all .2s',
                  background: tab === t ? 'rgba(45,106,79,.1)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text3)',
                  boxShadow: tab === t ? 'inset 0 0 0 1px rgba(45,106,79,.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.375rem',
                }}
              >
                {t === 'signin' ? <LogIn size={14} /> : <UserPlus size={14} />}
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Name (sign-up only) */}
            {tab === 'signup' && (
              <div>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input
                    id="auth-name"
                    className="input-field"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  id="auth-email"
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  id="auth-password"
                  className="input-field"
                  type={showPw ? 'text' : 'password'}
                  placeholder={tab === 'signup' ? 'Min 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPass(e.target.value)}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{
                    position: 'absolute', right: '.625rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text3)', display: 'flex', padding: '.125rem',
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontSize: '.8125rem', color: '#ef4444',
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                borderRadius: '8px', padding: '.625rem .875rem',
                display: 'flex', alignItems: 'flex-start', gap: '.375rem',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                fontSize: '.8125rem', color: '#10b981',
                background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)',
                borderRadius: '8px', padding: '.625rem .875rem',
                display: 'flex', alignItems: 'flex-start', gap: '.375rem',
              }}>
                <span>✅</span> {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '.8rem', fontSize: '.9375rem', marginTop: '.25rem', opacity: loading ? .7 : 1 }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {tab === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                : tab === 'signin'
                  ? <><LogIn size={16} /> Sign In</>
                  : <><UserPlus size={16} /> Create Account</>
              }
            </button>
          </form>

          {/* ── Footer link ── */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.8rem', color: 'var(--text3)' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => reset(tab === 'signin' ? 'signup' : 'signin')}
              style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: '.8rem' }}
            >
              {tab === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* ── Demo-mode note ── */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.75rem', color: 'var(--text3)', lineHeight: 1.6 }}>
          No Supabase? The app runs in{' '}
          <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>LocalStorage demo mode</span>{' '}
          automatically — no login needed.
        </p>
      </div>

      {/* Spin keyframe reuse */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
