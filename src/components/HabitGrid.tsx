import { pkey } from '../lib/day';
import { MONTHS_SHORT, WD_SHORT, addDays, fmtLong, fromStr, weekStart, weekday } from '../lib/dates';
import type { Habit } from '../lib/types';

const WEEKS = 12;

/** Raster der letzten 12 Wochen (Spalten = Wochen, Zeilen = Mo–So), wie bei GitHub. */
export function HabitGrid({ habit: h, progress, today }: { habit: Habit; progress: Record<string, number>; today: string }) {
  const start = addDays(weekStart(today), -(WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) => addDays(start, w * 7));
  const month = (d: string) => fromStr(d).getMonth();

  let planned = 0;
  let done = 0;
  const cell = (d: string) => {
    if (d > today) return { cls: 'future', label: '' };
    if (d < h.activeFrom || !h.days.includes(weekday(d))) return { cls: 'off', label: 'nicht geplant' };
    planned++;
    const v = progress[pkey(h.id, d)] ?? 0;
    if (v >= h.goal) {
      done++;
      return { cls: 'full', label: 'erfüllt' };
    }
    return v > 0 ? { cls: 'part', label: `${v} von ${h.goal}` } : { cls: 'miss', label: 'nicht erfüllt' };
  };

  const rows = Array.from({ length: 7 }, (_, r) => weeks.map(ws => ({ d: addDays(ws, r), ...cell(addDays(ws, r)) })));

  return (
    <div className="hgrid-wrap">
      <div className="hgrid" role="img" aria-label={`Letzte 12 Wochen: ${done} von ${planned} geplanten Tagen erfüllt`}>
        <span />
        {weeks.map((ws, w) => {
          // Monatsname dort, wo eine Woche in einem neuen Monat beginnt
          const show = w === 0 ? month(weeks[2]) === month(ws) : month(ws) !== month(weeks[w - 1]);
          return <span key={ws} className="hgrid-month">{show ? MONTHS_SHORT[month(ws)] : ''}</span>;
        })}
        {rows.map((cells, r) => [
          <span key={`l${r}`} className="hgrid-wd">{r % 2 === 0 ? WD_SHORT[r] : ''}</span>,
          ...cells.map(c => (
            <span key={c.d} className={`hgrid-cell ${c.cls}${c.d === today ? ' today' : ''}`} title={c.label && `${fmtLong(c.d)}: ${c.label}`} />
          )),
        ])}
      </div>
      <div className="hgrid-legend">
        <span>{done} von {planned} Tagen erfüllt</span>
        <span className="hgrid-key">
          <i className="hgrid-cell miss" /> <i className="hgrid-cell part" /> <i className="hgrid-cell full" />
        </span>
      </div>
    </div>
  );
}
