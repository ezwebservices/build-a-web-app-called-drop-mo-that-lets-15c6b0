import { useEffect, useState } from 'react';
import { countdown } from '../lib/utils';

export function Countdown({ toIso }: { toIso: string }): React.ReactElement {
  const [c, setC] = useState(() => countdown(toIso));
  useEffect(() => {
    const t = window.setInterval(() => setC(countdown(toIso)), 1000);
    return () => window.clearInterval(t);
  }, [toIso]);

  const items: Array<{ label: string; value: number }> = [
    { label: 'days', value: c.days },
    { label: 'hours', value: c.hours },
    { label: 'min', value: c.minutes },
    { label: 'sec', value: c.seconds },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {items.map((i) => (
        <div key={i.label} className="flex-1 text-center rounded-2xl bg-ink-800/70 border border-ink-700 px-2 py-3 sm:px-3 sm:py-4">
          <div className="text-white font-display text-2xl sm:text-3xl md:text-4xl tabular-nums">
            {String(i.value).padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-ink-300 mt-1">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
