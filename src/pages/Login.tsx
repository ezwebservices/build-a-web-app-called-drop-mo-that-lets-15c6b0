import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  autoSignIn,
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signUp,
} from 'aws-amplify/auth';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { isAmplifyConfigured } from '../lib/amplify';
import { useSessionState } from '../hooks/useSession';

type Mode = 'signIn' | 'signUp';
type Stage = 'form' | 'confirm';

export function LoginPage(): React.ReactElement {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialMode: Mode = params.get('mode') === 'signUp' ? 'signUp' : 'signIn';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { session, loading } = useSessionState();

  useEffect(() => {
    if (!loading && session) nav('/dashboard', { replace: true });
  }, [loading, session, nav]);

  const isSignUp = mode === 'signUp';

  function switchMode(next: Mode): void {
    setMode(next);
    setError('');
    setInfo('');
    setStage('form');
    const nextParams = new URLSearchParams(params);
    if (next === 'signUp') nextParams.set('mode', 'signUp');
    else nextParams.delete('mode');
    setParams(nextParams, { replace: true });
  }

  function requireBackend(): boolean {
    if (isAmplifyConfigured()) return true;
    setError(
      'Authentication is not configured yet. Deploy the Amplify backend (amplify_outputs.json) to sign in.'
    );
    return false;
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setInfo('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('We need an email to send you back into your drops.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!requireBackend()) return;
    setSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signUp({
          username: trimmedEmail,
          password,
          options: {
            userAttributes: {
              email: trimmedEmail,
            },
            autoSignIn: true,
          },
        });
        if (result.isSignUpComplete) {
          try {
            await autoSignIn();
          } catch {
            await signIn({ username: trimmedEmail, password });
          }
          nav('/dashboard');
        } else {
          setStage('confirm');
          setInfo('We emailed you a 6-digit code. Enter it to finish creating your account.');
        }
      } else {
        const result = await signIn({ username: trimmedEmail, password });
        if (!result.isSignedIn && result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          setStage('confirm');
          setInfo('Your account still needs a confirmation code — check your email.');
        } else {
          nav('/dashboard');
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirm(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setInfo('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!code.trim()) {
      setError('Pop in the 6-digit code we emailed you.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmSignUp({ username: trimmedEmail, confirmationCode: code.trim() });
      try {
        await autoSignIn();
      } catch {
        if (password) {
          await signIn({ username: trimmedEmail, password });
        }
      }
      nav('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend(): Promise<void> {
    setError('');
    setInfo('');
    try {
      await resendSignUpCode({ username: email.trim().toLowerCase() });
      setInfo('Sent a fresh code — check your inbox.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-10 sm:pt-16 pb-24">
      <div className="flex justify-center mb-8">
        <Logo size={40} />
      </div>

      <div
        role="tablist"
        aria-label="Sign in or create account"
        className="flex p-1 rounded-full bg-drop-50 border border-drop-100 mb-6 text-sm"
      >
        <button
          role="tab"
          aria-selected={!isSignUp}
          type="button"
          onClick={() => switchMode('signIn')}
          className={`flex-1 px-3 sm:px-4 py-2.5 min-h-[40px] rounded-full transition ${
            !isSignUp ? 'bg-drop-600 text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          Sign in
        </button>
        <button
          role="tab"
          aria-selected={isSignUp}
          type="button"
          onClick={() => switchMode('signUp')}
          className={`flex-1 px-3 sm:px-4 py-2.5 min-h-[40px] rounded-full transition ${
            isSignUp ? 'bg-drop-600 text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          Create account
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-drop-100 shadow-sm p-5 sm:p-7">
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900">
          {stage === 'confirm'
            ? 'Confirm your email'
            : isSignUp
              ? 'Start a drop'
              : 'Welcome back'}
        </h1>
        <p className="text-ink-500 mt-1 text-sm">
          {stage === 'confirm'
            ? 'We sent a 6-digit code to your inbox.'
            : isSignUp
              ? 'Make a quick account so you can set up the drop and invite people.'
              : "Pick up where you left off — your drops are waiting."}
        </p>

        {stage === 'form' ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" hint={isSignUp ? 'At least 8 characters.' : undefined}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-ink-700">{info}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting
                ? 'Working…'
                : isSignUp
                  ? 'Create my account'
                  : 'Sign in'}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="mt-6 space-y-4">
            <Field label="Confirmation code">
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-ink-700">{info}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Confirming…' : 'Confirm & continue'}
            </Button>
            <div className="flex justify-between text-xs text-ink-500">
              <button
                type="button"
                onClick={onResend}
                className="hover:text-ink-900 underline-offset-2 hover:underline"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => setStage('form')}
                className="hover:text-ink-900"
              >
                ← back
              </button>
            </div>
          </form>
        )}

        {stage === 'form' && (
          <p className="text-sm text-ink-500 mt-6 text-center">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="text-drop-700 hover:text-drop-800 underline-offset-2 hover:underline"
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
                  className="text-drop-700 hover:text-drop-800 underline-offset-2 hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        )}
        <p className="text-xs text-ink-500 mt-6">
          By {isSignUp ? 'creating an account' : 'signing in'} you agree to keep drops private from
          their recipients. That's the whole point.
        </p>
      </div>
      <p className="text-center text-sm text-ink-500 mt-6">
        <Link to="/" className="hover:text-ink-900">
          ← back to home
        </Link>
      </p>
    </div>
  );
}

function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'UserAlreadyAuthenticatedException') {
    return 'You\u2019re already signed in — head to your dashboard.';
  }
  if (name === 'UsernameExistsException') {
    return 'An account already exists for that email. Try signing in.';
  }
  if (name === 'NotAuthorizedException') {
    return 'Wrong email or password.';
  }
  if (name === 'UserNotFoundException') {
    return "We don\u2019t have an account for that email yet.";
  }
  if (name === 'CodeMismatchException') {
    return 'That code didn\u2019t match. Try again or resend.';
  }
  if (name === 'ExpiredCodeException') {
    return 'That code expired — tap "Resend code".';
  }
  if (name === 'InvalidPasswordException') {
    return 'Password doesn\u2019t meet the requirements. Try a longer mix of letters and numbers.';
  }
  return msg || 'Something went wrong. Try again.';
}
