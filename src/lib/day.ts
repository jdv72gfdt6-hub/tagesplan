import { addDays, weekday } from './dates';
import type { ColorName, Habit, Task } from './types';

export const pkey = (habitId: string, date: string) => `${habitId}|${date}`;

/** Ein Eintrag in der Tagesansicht – Aufgabe oder Gewohnheit. */
export interface DayItem {
  kind: 'task' | 'habit';
  id: string;
  title: string;
  time: number | null;
  duration: number;
  color: ColorName;
  done: boolean;
  value: number;
  goal: number;
  unit: string;
  top3: boolean;
  carriedFrom: string | null;
  note: string;
  createdAt: string;
}

interface Data {
  tasks: Record<string, Task>;
  habits: Record<string, Habit>;
  progress: Record<string, number>;
}

export const habitOn = (h: Habit, date: string) =>
  !h.archived && date >= h.activeFrom && h.days.includes(weekday(date));

export function itemsForDay(s: Data, date: string): DayItem[] {
  const out: DayItem[] = [];
  for (const t of Object.values(s.tasks)) {
    if (t.date !== date) continue;
    out.push({
      kind: 'task', id: t.id, title: t.title, time: t.time, duration: t.duration, color: t.color,
      done: t.done, value: t.done ? 1 : 0, goal: 1, unit: '', top3: t.top3,
      carriedFrom: t.carriedFrom, note: t.note, createdAt: t.createdAt,
    });
  }
  for (const h of Object.values(s.habits)) {
    if (!habitOn(h, date)) continue;
    const value = s.progress[pkey(h.id, date)] ?? 0;
    out.push({
      kind: 'habit', id: h.id, title: h.title, time: h.time, duration: h.duration, color: h.color,
      done: value >= h.goal, value, goal: h.goal, unit: h.unit, top3: false,
      carriedFrom: null, note: h.note, createdAt: h.createdAt,
    });
  }
  return out.sort(
    (a, b) =>
      (a.time ?? -1) - (b.time ?? -1) ||
      (a.kind === b.kind ? 0 : a.kind === 'habit' ? -1 : 1) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export function dayStats(s: Data, date: string) {
  const items = itemsForDay(s, date);
  return { done: items.filter(i => i.done).length, total: items.length };
}

/** Erfüllte geplante Tage am Stück bis heute. Heute zählt erst mit, wenn erledigt. */
export function streak(h: Habit, progress: Record<string, number>, today: string) {
  const done = (d: string) => (progress[pkey(h.id, d)] ?? 0) >= h.goal;
  let d = today;
  if (h.days.includes(weekday(d)) && !done(d)) d = addDays(d, -1);
  let n = 0;
  for (let i = 0; i < 4000 && d >= h.activeFrom; i++, d = addDays(d, -1)) {
    if (!h.days.includes(weekday(d))) continue;
    if (!done(d)) break;
    n++;
  }
  return n;
}

/** Längste Serie erfüllter geplanter Tage seit „aktiv ab“ (höchstens 10 Jahre zurück). */
export function longestStreak(h: Habit, progress: Record<string, number>, today: string) {
  let best = 0;
  let run = 0;
  const limit = addDays(today, -3660);
  for (let d = h.activeFrom < limit ? limit : h.activeFrom; d <= today; d = addDays(d, 1)) {
    if (!h.days.includes(weekday(d))) continue;
    if ((progress[pkey(h.id, d)] ?? 0) >= h.goal) best = Math.max(best, ++run);
    else if (d !== today) run = 0;
  }
  return best;
}

/** Geplante und erfüllte Tage einer Gewohnheit in einem Zeitraum. Heute zählt erst mit, wenn erfüllt. */
export function habitRange(h: Habit, progress: Record<string, number>, days: string[], today: string) {
  const ok = (d: string) => (progress[pkey(h.id, d)] ?? 0) >= h.goal;
  const planned = days.filter(
    d => d >= h.activeFrom && h.days.includes(weekday(d)) && (d < today || (d === today && ok(d))),
  );
  return { planned: planned.length, done: planned.filter(ok).length };
}

export interface Block {
  item: DayItem;
  start: number;
  col: number;
  cols: number;
}

/** Mindesthöhe eines Blocks in Minuten, damit kurze Einträge antippbar bleiben. */
export const MIN_BLOCK = 22;

/** Ordnet überlappende Blöcke nebeneinander an (wie im Kalender). */
export function layoutBlocks(items: DayItem[]): Block[] {
  const sorted = items
    .filter(i => i.time != null)
    .sort((a, b) => a.time! - b.time! || b.duration - a.duration);
  const out: Block[] = [];
  let cluster: Block[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const b of cluster) b.cols = colEnds.length;
    out.push(...cluster);
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };
  for (const item of sorted) {
    const start = item.time!;
    const end = start + Math.max(item.duration, MIN_BLOCK);
    if (cluster.length && start >= clusterEnd) flush();
    let col = colEnds.findIndex(e => e <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else colEnds[col] = end;
    cluster.push({ item, start, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return out;
}
