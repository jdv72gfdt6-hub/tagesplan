import { useState } from 'react';
import { dayStats, habitRange, longestStreak, streak } from '../lib/day';
import { WD_SHORT, addDays, fmtShort, fmtShortWd, fromStr, isoWeek, useToday, weekStart } from '../lib/dates';
import { useStore } from '../lib/store';
import { IconChart, IconCheck, IconChevronLeft, IconChevronRight, IconFlame } from '../components/Icons';
import { Empty, Page } from '../components/Page';

const R = 17;
const C = 2 * Math.PI * R;
const SHOWN_TASKS = 8;

/** Wochenrückblick: erledigte Aufgaben, Erfüllungsquote je Gewohnheit, beste Serien. */
export function ReviewView() {
  const { state } = useStore();
  const today = useToday();
  const [start, setStart] = useState(() => weekStart(today));
  const [allTasks, setAllTasks] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const end = days[6];
  const current = start === weekStart(today);

  const planned = Object.values(state.tasks).filter(t => t.date && t.date >= start && t.date <= end);
  const done = planned
    .filter(t => t.done)
    .sort((a, b) => a.date!.localeCompare(b.date!) || (a.time ?? -1) - (b.time ?? -1));

  const habits = Object.values(state.habits).filter(h => !h.archived);
  const rates = habits
    .map(h => ({ h, ...habitRange(h, state.progress, days, today) }))
    .filter(r => r.planned > 0)
    .sort((a, b) => b.done / b.planned - a.done / a.planned || a.h.title.localeCompare(b.h.title, 'de'));
  const sumPlanned = rates.reduce((n, r) => n + r.planned, 0);
  const sumDone = rates.reduce((n, r) => n + r.done, 0);
  const quote = sumPlanned ? Math.round((sumDone / sumPlanned) * 100) : null;

  const streaks = habits
    .map(h => {
      const cur = streak(h, state.progress, today);
      return { h, cur, best: Math.max(cur, longestStreak(h, state.progress, today)) };
    })
    .filter(s => s.best > 0)
    .sort((a, b) => b.best - a.best || b.cur - a.cur)
    .slice(0, 3);

  const shown = allTasks ? done : done.slice(0, SHOWN_TASKS);
  const sameYear = fromStr(start).getFullYear() === fromStr(today).getFullYear();

  return (
    <Page
      title="Rückblick"
      subtitle={`KW ${isoWeek(start)} · ${fmtShort(start)}–${fmtShort(end)}${sameYear ? '' : fromStr(end).getFullYear()}${current ? ' · diese Woche' : ''}`}
      right={
        <div className="capsule glass">
          <button type="button" className="press" onClick={() => setStart(addDays(start, -7))} aria-label="Vorige Woche">
            <IconChevronLeft />
          </button>
          <button type="button" className="press" disabled={current} onClick={() => setStart(addDays(start, 7))} aria-label="Nächste Woche">
            <IconChevronRight />
          </button>
        </div>
      }
    >
      <div className="tiles">
        <div className="tile">
          <span className="tile-label">Aufgaben erledigt</span>
          <span className="tile-value">{done.length}</span>
          <span className="tile-sub">von {planned.length} geplanten</span>
        </div>
        <div className="tile">
          <span className="tile-label">Gewohnheiten</span>
          <span className="tile-value">
            {quote ?? '–'}
            {quote != null && <small>%</small>}
          </span>
          <span className="tile-sub">{sumDone} von {sumPlanned} erfüllt</span>
        </div>
      </div>

      <div className="group pad">
        <div className="review-days">
          {days.map((d, i) => {
            const st = dayStats(state, d);
            const pct = st.total ? st.done / st.total : 0;
            return (
              <div
                key={d}
                className={`wday${d === today ? ' today' : ''}${d > today ? ' future' : ''}`}
                aria-label={`${fmtShortWd(d)}: ${st.done} von ${st.total} erledigt`}
              >
                <span className="wday-l">{WD_SHORT[i]}</span>
                <span className="wday-ring">
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <circle cx="20" cy="20" r={R} className="ring-bg" />
                    {pct > 0 && <circle cx="20" cy="20" r={R} className="ring-fg" strokeDasharray={`${pct * C} ${C}`} />}
                  </svg>
                  <span className="wday-n">{fromStr(d).getDate()}</span>
                </span>
                <span className="wday-pct">{st.total && d <= today ? `${Math.round(pct * 100)}%` : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      {rates.length > 0 && (
        <>
          <h2 className="section-title">Gewohnheiten</h2>
          <div className="group">
            {rates.map(({ h, planned: p, done: d }) => (
              <div key={h.id} className={`group-row c-${h.color}`}>
                <span className="grow">
                  {h.title}
                  <span className="row-sub">{d} von {p} {p === 1 ? 'Tag' : 'Tagen'}</span>
                  <span className="bar" aria-hidden="true"><i style={{ width: `${(d / p) * 100}%` }} /></span>
                </span>
                <span className="row-detail rate">{Math.round((d / p) * 100)}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {streaks.length > 0 && (
        <>
          <h2 className="section-title">Beste Serien</h2>
          <div className="group list-icons">
            {streaks.map(({ h, cur, best }) => (
              <div key={h.id} className="group-row">
                <span className={`round-icon c-${h.color}`} style={{ background: 'var(--c)' }}><IconFlame size={17} /></span>
                <span className="grow">
                  {h.title}
                  <span className="row-sub">Aktuell {cur === 1 ? '1 Tag' : `${cur} Tage`} am Stück</span>
                </span>
                <span className="row-detail">Rekord {best}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="section-title">
            Erledigte Aufgaben <span className="section-count">{done.length}</span>
          </h2>
          <div className="group list-icons">
            {shown.map(t => (
              <div key={t.id} className="group-row">
                <span className={`round-icon c-${t.color}`} style={{ background: 'var(--c)' }}><IconCheck size={16} /></span>
                <span className="grow">{t.title}</span>
                <span className="row-detail">{fmtShortWd(t.date!)}</span>
              </div>
            ))}
            {done.length > SHOWN_TASKS && (
              <button type="button" className="group-row action" onClick={() => setAllTasks(!allTasks)}>
                {allTasks ? 'Weniger zeigen' : `Alle ${done.length} zeigen`}
              </button>
            )}
          </div>
        </>
      )}

      {!planned.length && !rates.length && (
        <Empty icon={<IconChart size={44} />} title="Noch nichts in dieser Woche" text="Sobald du Aufgaben erledigst oder Gewohnheiten abhakst, erscheint hier dein Rückblick." />
      )}
    </Page>
  );
}
