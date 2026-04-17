import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { setSession } from '../lib/session';
import { Logo } from '../components/Logo';

type Mode = 'signIn' | 'signUp';

export function LoginPage(): React.ReactElement {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialMode: Mode = params.get('mode') === 'signUp' ? 'signUp' : 'signIn';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');

  const isSignUp = mode === 'signUp';

  function switchMode(next: Mode): void {
    setMode(next);
    setError('');
    const nextParams = new URLSearchParams(params);
    if (next === 'signUp') nextParams.set('mode', 'signUp');
    else nextParams.delete('mode');
    setParams(nextParams, { replace: true });
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!email.trim()) {
      setError('We need an email to send you back into your drops.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Your name shows up on the invites you send — drop it in.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSession({
      email: email.trim().toLowerCase(),
      name: (name.trim() || email.trim().split('@')[0]) as string,
    });
    nav('/dashboard');
  }

  function onGoogle(): void {
    const demoEmail = email || 'you@gmail.com';
    setSession({ email: demoEmail.toLowerCase(), name: name || 'Friend' });
    nav('/dashboard');
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-16 pb-24">
      <div className="flex justify-center mb-8">
        <Logo size={40} />
      </div>

      <div
        role="tablist"
        aria-label="Sign in or create account"
        className="flex p-1 rounded-full bg-ink-800/70 border border-ink-700 mb-6 text-sm"
      >
        <button
          role="tab"
          aria-selected={!isSignUp}
          type="button"
          onClick={() => switchMode('signIn')}
          className={`flex-1 px-4 py-2 rounded-full transition ${
            !isSignUp ? 'bg-drop-500 text-white' : 'text-ink-300 hover:text-white'
          }`}
        >
          Sign in
        </button>
        <button
          role="tab"
          aria-selected={isSignUp}
          type="button"
          onClick={() => switchMode('signUp')}
          className={`flex-1 px-4 py-2 rounded-full transition ${
            isSignUp ? 'bg-drop-500 text-white' : 'text-ink-300 hover:text-white'
          }`}
        >
          Create account
        </button>
      </div>

      <div className="rounded-2xl bg-ink-800/70 border border-ink-700 p-7">
        <h1 className="font-display text-4xl text-white">
          {isSignUp ? 'Start a drop' : 'Welcome back'}
        </h1>
        <p className="text-ink-300 mt-1 text-sm">
          {isSignUp
            ? 'Make an account so you can rally the group and pull off the surprise.'
            : "Pick up where you left off — your drops are waiting."}
        </p>
        <Button variant="outline" className="w-full mt-6" onClick={onGoogle} type="button">
          <span className="inline-block w-4 h-4 bg-white rounded-sm" />
          {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
        </Button>
        <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
          <div className="flex-1 h-px bg-ink-700" />
          or email
          <div className="flex-1 h-px bg-ink-700" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {isSignUp && (
            <Field label="Your name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jamie Rivera"
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" hint={isSignUp ? 'At least 6 characters.' : undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </Field>
          {error && <p className="text-sm text-drop-300">{error}</p>}
          <Button type="submit" className="w-full" size="lg">
            {isSignUp ? 'Create my account' : 'Sign in'}
          </Button>
        </form>
        <p className="text-sm text-ink-300 mt-6 text-center">
          {isSignUp ? (
            <>
              Already in on a drop?{' '}
              <button
                type="button"
                onClick={() => switchMode('signIn')}
                className="text-drop-300 hover:text-white underline-offset-2 hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => switchMode('signUp')}
                className="text-drop-300 hover:text-white underline-offset-2 hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </p>
        <p className="text-xs text-ink-400 mt-6">
          By {isSignUp ? 'creating an account' : 'signing in'} you agree to keep drops private from
          their recipients. Keeping the surprise is everything.
        </p>
      </div>
      <p className="text-center text-sm text-ink-300 mt-6">
        <Link to="/" className="hover:text-white">
          ← back to home
        </Link>
      </p>
    </div>
  );
}
