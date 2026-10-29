import { useRef } from 'react';
import { WD_SHORT, addDays, fmtLong, fromStr, weekStart } from '../lib/dates';

const R = 17;
const C = 2 * Math.PI * R;

/** Wochenstreifen Mo–So mit Fortschrittsring; wischen blättert eine Woche weiter. */
export function WeekStrip({
  date, today, onPick, stats,
}: { date: string; today: string; onPick: (d: string) => void; stats: (d: string) => { done: number; total: number } }) {
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const sw = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="week"
      data-noswipe
      onPointerDown={e => (sw.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={e => {
        const s = sw.current;
        sw.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(e.clientY - s.y) < 40) onPick(addDays(date, dx < 0 ? 7 : -7));
      }}
      onPointerCancel={() => (sw.current = null)}
    >
      {days.map((d, i) => {
        const st = stats(d);
        const pct = st.total ? st.done / st.total : 0;
        return (
          <button
            key={d} type="button"
            className={`wday${d === date ? ' sel' : ''}${d === today ? ' today' : ''}`}
            onClick={() => onPick(d)}
            aria-label={`${fmtLong(d)}${st.total ? `, ${st.done} von ${st.total} erledigt` : ''}`}
            aria-current={d === date ? 'date' : undefined}
          >
            <span className="wday-l">{WD_SHORT[i]}</span>
            <span className="wday-ring">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r={R} className="ring-bg" />
                {pct > 0 && <circle cx="20" cy="20" r={R} className="ring-fg" strokeDasharray={`${pct * C} ${C}`} />}
              </svg>
              <span className="wday-n">{fromStr(d).getDate()}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
