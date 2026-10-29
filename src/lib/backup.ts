import { COLORS, DEFAULT_SETTINGS, type BackupFile, type ColorName, type Habit, type Progress, type Routine, type Task } from './types';
import { todayStr } from './dates';

const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strOrNull = (v: unknown) => (typeof v === 'string' && v ? v : null);
const color = (v: unknown): ColorName => (COLORS.includes(v as ColorName) ? (v as ColorName) : 'blue');
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);

/** Liest eine Backup-Datei und füllt fehlende Felder mit Standardwerten. */
export function parseBackup(text: string): BackupFile {
  const raw = obj(JSON.parse(text));
  if (!raw || raw.app !== 'tagesplan' || !Array.isArray(raw.tasks) || !Array.isArray(raw.habits)) {
    throw new Error('Das ist keine Tagesplan-Backup-Datei.');
  }
  const now = new Date().toISOString();
  const tasks: Task[] = raw.tasks.map(obj).filter(Boolean).map(t => ({
    id: str(t!.id) || crypto.randomUUID(),
    title: str(t!.title, 'Ohne Titel'),
    date: strOrNull(t!.date),
    time: numOrNull(t!.time),
    duration: num(t!.duration, 30),
    note: str(t!.note),
    color: color(t!.color),
    done: t!.done === true,
    doneAt: strOrNull(t!.doneAt),
    top3: t!.top3 === true,
    carriedFrom: strOrNull(t!.carriedFrom),
    createdAt: str(t!.createdAt, now),
    updatedAt: str(t!.updatedAt, now),
  }));
  const habits: Habit[] = raw.habits.map(obj).filter(Boolean).map(h => ({
    id: str(h!.id) || crypto.randomUUID(),
    title: str(h!.title, 'Ohne Titel'),
    time: numOrNull(h!.time),
    duration: num(h!.duration, 15),
    days: Array.isArray(h!.days) ? (h!.days as unknown[]).filter((d): d is number => typeof d === 'number') : [0, 1, 2, 3, 4, 5, 6],
    goal: Math.max(1, num(h!.goal, 1)),
    unit: str(h!.unit),
    color: color(h!.color),
    note: str(h!.note),
    activeFrom: str(h!.activeFrom, todayStr()),
    archived: h!.archived === true,
    createdAt: str(h!.createdAt, now),
    updatedAt: str(h!.updatedAt, now),
  }));
  const progress: Progress[] = (Array.isArray(raw.progress) ? raw.progress : [])
    .map(obj)
    .filter(Boolean)
    .map(p => ({ key: '', habitId: str(p!.habitId), date: str(p!.date), value: num(p!.value, 0) }))
    .filter(p => p.habitId && p.date && p.value > 0)
    .map(p => ({ ...p, key: `${p.habitId}|${p.date}` }));
  const routines: Routine[] = (Array.isArray(raw.routines) ? raw.routines : []).map(obj).filter(Boolean).map(r => ({
    id: str(r!.id) || crypto.randomUUID(),
    name: str(r!.name, 'Routine'),
    lines: str(r!.lines),
    color: color(r!.color),
    createdAt: str(r!.createdAt, now),
    updatedAt: str(r!.updatedAt, now),
  }));
  const s = obj(raw.settings) ?? {};
  return {
    app: 'tagesplan',
    version: 2,
    exportedAt: str(raw.exportedAt, now),
    tasks,
    habits,
    progress,
    routines,
    settings: {
      theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'auto',
      carryOver: typeof s.carryOver === 'boolean' ? s.carryOver : DEFAULT_SETTINGS.carryOver,
    },
  };
}

/** Teilen-Menü auf dem iPhone, sonst normaler Download. */
export async function shareBackup(data: BackupFile) {
  const json = JSON.stringify(data, null, 2);
  const name = `tagesplan-backup-${todayStr()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Tagesplan-Backup' });
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function reminderUrl(title: string, date: string | null, time: number | null) {
  const lines = [title];
  if (date) {
    const [y, m, d] = date.split('-');
    const hhmm = time != null ? ` ${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}` : '';
    lines.push(`${d}.${m}.${y}${hhmm}`);
  }
  return (
    'shortcuts://run-shortcut?name=' + encodeURIComponent('Tagesplan Erinnerung') +
    '&input=text&text=' + encodeURIComponent(lines.join('\n'))
  );
}
