import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { dayStats, itemsForDay, type DayItem } from '../lib/day';
import { addDays, fmtDayMonth, fmtLong, fromStr, nowMinutes, relDay, WD_LONG, weekday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { useStore } from '../lib/store';
import type { AddDefaults, DetailTarget } from '../nav';
import { IconEye, IconEyeSlash, IconStack, IconStar } from '../components/Icons';
import { RoutinesSheet } from '../sheets/RoutinesSheet';
import { ItemRow } from '../components/ItemRow';
import { Page } from '../components/Page';
import { PX, Timeline } from '../components/Timeline';
import { WeekStrip } from '../components/WeekStrip';

function useLocalBool(key: string, initial: boolean) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s == null ? initial : s === '1';
    } catch {
      return initial;
    }
  });
  const set = (next: boolean) => {
    setV(next);
    try {
      localStorage.setItem(key, next ? '1' : '0');
    } catch {
      /* nur Komfort */
    }
  };
  return [v, set] as const;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  date: string;
  today: string;
  dir: number;
  setDate: (d: string) => void;
  onAdd: (d: AddDefaults) => void;
  onOpen: (t: DetailTarget) => void;
}

export function TodayView({ date, today, dir, setDate, onAdd, onOpen }: Props) {
  const { state, actions } = useStore();
  const [hideDone, setHideDone] = useLocalBool('tagesplan-hide-done', false);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const all = useMemo(() => itemsForDay(state, date), [state.tasks, state.habits, state.progress, date]);
  const items = hideDone ? all.filter(i => !i.done) : all;
  const top = items.filter(i => i.top3);
  const untimed = items.filter(i => i.time == null && !i.top3);
  const timed = useMemo(() => items.filter(i => i.time != null), [all, hideDone]);
  const tlRef = useRef<HTMLDivElement>(null);
  const scrolledOnce = useRef(false);
  const isToday = date === today;

  // Beim Öffnen zur aktuellen Uhrzeit scrollen
  useLayoutEffect(() => {
    if (!isToday || !tlRef.current) return;
    const y = tlRef.current.getBoundingClientRect().top + window.scrollY + nowMinutes() * PX - window.innerHeight * 0.4;
    window.scrollTo({ top: Math.max(0, y), behavior: scrolledOnce.current && !reducedMotion() ? 'smooth' : 'auto' });
    scrolledOnce.current = true;
  }, [isToday, state.loaded]);

  const tap = (it: DayItem) => {
    haptic();
    if (it.kind === 'task') actions.updateTask(it.id, { done: !it.done });
    else if (it.goal > 1) actions.setProgress(it.id, date, Math.min(it.goal, it.value + 1));
    else actions.setProgress(it.id, date, it.done ? 0 : 1);
  };
  const back = (it: DayItem) => {
    if (it.kind !== 'habit' || it.value <= 0) return;
    haptic();
    actions.setProgress(it.id, date, it.value - 1);
  };
  const open = (it: DayItem) => onOpen({ kind: it.kind, id: it.id, date });

  const row = (it: DayItem) => (
    <ItemRow
      key={it.kind + it.id}
      item={it}
      date={date}
      onTap={() => tap(it)}
      onLongPress={() => back(it)}
      onOpen={() => open(it)}
      onTomorrow={it.kind === 'task' ? () => { actions.updateTask(it.id, { date: addDays(date, 1) }); actions.toast('Auf morgen verschoben'); } : undefined}
      onDelete={it.kind === 'task' ? () => actions.deleteTask(it.id) : undefined}
    />
  );

  const rel = relDay(date, today);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  const title = isToday ? 'Heute' : WD_LONG[weekday(date)];
  const subtitle = isToday
    ? fmtLong(date)
    : `${rel ? rel + ' · ' : ''}${fmtDayMonth(date)}${sameYear ? '' : ' ' + fromStr(date).getFullYear()}`;

  const sw = useRef<{ x: number; y: number } | null>(null);
  const doneTop = top.filter(i => i.done).length;

  return (
    <Page
      title={title}
      subtitle={subtitle}
      right={
        <div className="capsule glass">
          <button type="button" className="press" onClick={() => setRoutinesOpen(true)} aria-label="Routine einfügen">
            <IconStack />
          </button>
          <button type="button" className="press" onClick={() => setHideDone(!hideDone)} aria-label={hideDone ? 'Erledigte zeigen' : 'Erledigte ausblenden'}>
            {hideDone ? <IconEyeSlash /> : <IconEye />}
          </button>
          <button type="button" className="press capsule-text" disabled={isToday} onClick={() => setDate(today)}>
            Heute
          </button>
        </div>
      }
    >
      <div
        className="today"
        onPointerDown={e => {
          if ((e.target as Element).closest('[data-noswipe]')) return;
          sw.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={e => {
          const s = sw.current;
          sw.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 70 && Math.abs(e.clientY - s.y) < 45) setDate(addDays(date, dx < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (sw.current = null)}
      >
        <WeekStrip date={date} today={today} onPick={setDate} stats={d => dayStats(state, d)} />

        <div key={date} className={`day${dir > 0 ? ' from-right' : dir < 0 ? ' from-left' : ''}`}>
          {top.length > 0 && (
            <section>
              <h2 className="section-title">
                <IconStar size={20} filled className="top3-star" /> Top 3
                <span className="section-count">{doneTop}/{top.length}</span>
              </h2>
              <div className="group list">{top.map(row)}</div>
            </section>
          )}

          {untimed.length > 0 && (
            <section>
              <h2 className="section-title">
                Ohne Uhrzeit
                <span className="section-count">{untimed.filter(i => i.done).length}/{untimed.length}</span>
              </h2>
              <div className="group list">{untimed.map(row)}</div>
            </section>
          )}

          {state.loaded && all.length === 0 && (
            <p className="hint center">Noch nichts geplant. Tippe auf „+“ oder auf eine freie Stelle in der Zeitleiste.</p>
          )}
          {state.loaded && all.length > 0 && items.length === 0 && <p className="hint center">Alles erledigt.</p>}

          <Timeline
            ref={tlRef}
            items={timed}
            isToday={isToday}
            onTapEmpty={min => onAdd({ kind: 'task', date, time: min })}
            onOpen={open}
            onTap={tap}
            onLongPress={back}
            onChange={(it, time, duration) => {
              if (it.kind === 'task') actions.updateTask(it.id, { time, duration });
              else actions.updateHabit(it.id, { time, duration });
            }}
          />
        </div>
      </div>
      <RoutinesSheet open={routinesOpen} date={date} onClose={() => setRoutinesOpen(false)} />
    </Page>
  );
}
