import { Routes, Route, useLocation } from 'react-router-dom';
import { Nav } from './components/Nav';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { NewDropPage } from './pages/NewDrop';
import { DashboardPage } from './pages/Dashboard';
import { ReviewDropPage } from './pages/ReviewDrop';
import { DropDetailPage } from './pages/DropDetail';
import { PublicDropPage } from './pages/PublicDrop';
import { PledgeStatusPage } from './pages/PledgeStatus';

function App(): React.ReactElement {
  const { pathname } = useLocation();
  const isPublic = pathname.startsWith('/d/') || pathname.startsWith('/p/');

  return (
    <div className="min-h-screen flex flex-col">
      {!isPublic && <Nav />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/new" element={<NewDropPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/drops/:id" element={<DropDetailPage />} />
          <Route path="/drops/:id/review" element={<ReviewDropPage />} />
          <Route path="/d/:token" element={<PublicDropPage />} />
          <Route path="/p/:token" element={<PledgeStatusPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isPublic && <Footer />}
    </div>
  );
}

function NotFound(): React.ReactElement {
  return (
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <h1 className="font-display text-4xl sm:text-5xl text-white">404</h1>
      <p className="text-ink-300 mt-2">We couldn't find that page.</p>
    </div>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-ink-700 mt-10">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-ink-400">
        <div>© {new Date().getFullYear()} Drop — a quiet surprise from everyone they love.</div>
        <div>No fees. Ever.</div>
      </div>
    </footer>
  );
}

export default App;
