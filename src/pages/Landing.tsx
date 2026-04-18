import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useSession } from '../hooks/useSession';

const steps = [
  {
    n: '01',
    title: 'Start a drop',
    body: "Tell us who it's for, their Venmo handle, and the day you want it to land.",
  },
  {
    n: '02',
    title: 'Invite the group',
    body: 'Paste in emails. Everyone gets a warm invite and picks an amount — quietly.',
  },
  {
    n: '03',
    title: 'Everyone sends at once',
    body: 'On drop day, one tap sends a Venmo. Their phone lights up with love.',
  },
];

export function LandingPage(): React.ReactElement {
  const session = useSession();
  const startHref = session ? '/new' : '/login?mode=signUp';
  const returnHref = session ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-gradient-to-b from-drop-50 via-white to-white text-ink-900">
      <section className="relative max-w-6xl mx-auto px-5 pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-drop-600 bg-drop-50 border border-drop-100 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-drop-400 animate-pulse" />
            Rally the group. Surprise the one.
          </div>
          <h1 className="font-display text-[2.5rem] sm:text-6xl md:text-7xl leading-[1.02] text-ink-900 break-words">
            A little surprise
            <br />
            <span className="italic text-drop-500">from everyone they love.</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-ink-500 max-w-2xl leading-relaxed">
            Someone you know is having a rough week. Drop helps you line up a bunch of small Venmos
            from their friends and family, all landing on the same morning. They wake up to it —
            and have no idea it was planned.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Link to={startHref} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">Start a drop</Button>
            </Link>
            <Link to={returnHref} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-drop-200 text-drop-700 hover:bg-drop-50">
                I've got one going
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-600">
            Free. No fees. We never touch the money — Venmo does the moving.
          </p>
        </motion.div>
      </section>

      <section className="relative max-w-6xl mx-auto px-5 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-3xl bg-white border border-drop-100 shadow-sm p-6"
            >
              <div className="text-drop-500 font-display text-2xl">{s.n}</div>
              <div className="mt-2 text-ink-900 text-xl font-semibold">{s.title}</div>
              <p className="mt-2 text-ink-500 leading-relaxed text-sm">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-5 pb-20 sm:pb-28">
        <div className="rounded-3xl bg-white border border-drop-100 shadow-sm p-6 sm:p-8 md:p-12">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink-900 max-w-2xl leading-tight">
            Picture their phone that morning.
          </h2>
          <p className="mt-4 text-ink-500 max-w-2xl text-base sm:text-lg leading-relaxed">
            Ping. Ping. Ping. Twenty little Venmos from twenty people who love them. No fundraiser
            page, no big ask — just a quiet reminder that their people showed up.
          </p>
          <div className="mt-8">
            <Link to={startHref} className="block sm:inline-block">
              <Button size="lg" className="w-full sm:w-auto">Start a drop</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
