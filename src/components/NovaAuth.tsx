import React, { useState, type FormEvent } from 'react';
import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { login, signUp, type ApiProfile } from '../lib/novaApi';

type Props = { onAuthenticated: (profile: ApiProfile) => void; initialError?: string };

function readableError(value: unknown) {
  const code = value instanceof Error ? value.message : 'Unable to connect to NOVA.';
  if (code === 'invalid_credentials') return 'Email or password is incorrect.';
  if (code === 'email_already_registered') return 'This email is already registered. Sign in instead.';
  if (code === 'invalid_email') return 'Enter a valid email address.';
  if (code === 'invalid_password') return 'Use a password between 8 and 200 characters.';
  if (code === 'DATABASE_URL is not configured') return 'The database is not configured yet. Please try again after setup is complete.';
  if (code === 'Failed to fetch' || code.includes('API request failed')) return 'NOVA could not reach the server. Check your connection and try again.';
  return code.replaceAll('_', ' ');
}

export default function NovaAuth({ onAuthenticated, initialError = '' }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && !name.trim()) { setError('Enter your name to create an account.'); return; }
    if (!/^\\S+@\\S+\\.\\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 8 || password.length > 200) { setError('Use a password between 8 and 200 characters.'); return; }
    setBusy(true);
    try {
      const result = mode === 'signup'
        ? await signUp(name.trim(), email.trim(), password)
        : await login(email.trim(), password);
      setNotice(mode === 'signup' ? 'Account created. Opening your NOVA workspace…' : 'Signed in. Opening your NOVA workspace…');
      onAuthenticated(result.profile);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-screen">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-brand"><span className="brand-mark"><Sparkles size={19} /></span><span>NOVA</span></div>
      <span className="eyebrow">INTELLIGENT CAREER PLATFORM</span>
      <h1 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Build your next move.'}</h1>
      <p className="auth-sub">{mode === 'login' ? 'Sign in to see your career workspace, saved roles, and application progress.' : 'Create an account to personalize career matches and track opportunities.'}</p>
      {(error || initialError) && <p className="auth-error" role="alert">{error || readableError(new Error(initialError))}</p>}
      {notice && <p className="signal" role="status">{notice}</p>}
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Full name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={120} placeholder="Your name" required /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={200} placeholder="At least 8 characters" required /></label>
        <button className="apply auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="auth-switch" type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'New to NOVA? Create an account' : 'Already have an account? Sign in'}</button>
      <div className="auth-trust"><CheckCircle2 size={16} /><span>Your session is stored in a secure HttpOnly cookie. NOVA does not store your password in browser storage. Email verification and password recovery still require setup before public launch.</span></div>
      <div className="auth-trust"><LockKeyhole size={15} /><span>Only current, attributable job data is shown. NOVA does not invent vacancies or guarantee a job offer.</span></div>
    </section>
  </main>;
}
