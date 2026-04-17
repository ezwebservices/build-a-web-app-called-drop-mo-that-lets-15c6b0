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
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link to="/" className="focus:outline-none shrink-0">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {session ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-ink-200 hover:text-white px-3 py-2 min-h-[44px] inline-flex items-center"
              >
                Dashboard
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="hidden sm:inline-flex"
              >
                Sign out
              </Button>
              <Link to="/new">
                <Button size="sm">
                  <span className="sm:hidden">+ Drop</span>
                  <span className="hidden sm:inline">Start a drop</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-ink-200 hover:text-white px-3 py-2 min-h-[44px] inline-flex items-center"
              >
                Sign in
              </Link>
              <Link
                to="/login?mode=signUp"
                className="hidden sm:inline-flex text-sm text-ink-200 hover:text-white px-3 py-2 min-h-[44px] items-center"
              >
                Sign up
              </Link>
              <Link to="/login?mode=signUp">
                <Button size="sm">
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Start a drop</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
