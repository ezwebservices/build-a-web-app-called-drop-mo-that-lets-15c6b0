import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { useSession } from '../hooks/useSession';

export function Nav(): React.ReactElement {
  const session = useSession();
  const nav = useNavigate();

  async function onSignOut(): Promise<void> {
    try {
      await signOut();
    } catch {
      // Already signed out — Hub will clear state regardless.
    }
    nav('/');
  }

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-ink-900/70 border-b border-ink-700">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="focus:outline-none">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-ink-200 hover:text-white px-3 py-1.5"
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
              <Link to="/new">
                <Button size="sm">Start a drop</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ink-200 hover:text-white px-3 py-1.5">
                Sign in
              </Link>
              <Link
                to="/login?mode=signUp"
                className="text-sm text-ink-200 hover:text-white px-3 py-1.5"
              >
                Sign up
              </Link>
              <Link to="/login?mode=signUp">
                <Button size="sm">Start a drop</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
