import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as db from './db';
import { pkey } from './day';
import { DEFAULT_SETTINGS, type BackupFile, type Habit, type Progress, type Routine, type Settings, type Task } from './types';
import { todayStr } from './dates';
import { parseLine } from './parse';

export interface State {
  loaded: boolean;
  tasks: Record<string, Task>;
  habits: Record<string, Habit>;
  progress: Record<string, number>;
  routines: Record<string, Routine>;
  settings: Settings;
  toast: { id: number; text: string } | null;
}

export type NewTask = Partial<Task> & { title: string };
export type NewHabit = Partial<Habit> & { title: string };

export const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const nowIso = () => new Date().toISOString();

const byId = <T extends { id: string }>(list: T[]) =>
  Object.fromEntries(list.map(x => [x.id, x])) as Record<string, T>;

const progressList = (progress: Record<string, number>): Progress[] =>
  Object.entries(progress).map(([key, value]) => {
    const [habitId, date] = key.split('|');
    return { key, habitId, date, value };
  });

function persist(p: Promise<unknown>) {
  p.catch(err => console.error('Speichern fehlgeschlagen', err));
}

function createActions(get: () => State, set: (s: State) => void) {
  const toast = (text: string) => set({ ...get(), toast: { id: Date.now(), text } });

  const top3Count = (tasks: Record<string, Task>, date: string | null, exceptId?: string) =>
    Object.values(tasks).filter(t => t.top3 && t.date === date && t.id !== exceptId).length;

  const actions = {
    toast,
    clearToast: () => set({ ...get(), toast: null }),

    addTasks(list: NewTask[]) {
      const s = get();
      const tasks = { ...s.tasks };
      const created: Task[] = [];
      let full = false;
      for (const input of list) {
        const t: Task = {
          id: uid(), date: null, time: null, duration: 30, note: '', color: 'blue', done: false,
          doneAt: null, top3: false, carriedFrom: null, createdAt: nowIso(), updatedAt: nowIso(), ...input,
        };
        if (t.top3 && top3Count(tasks, t.date) >= 3) {
          t.top3 = false;
          full = true;
        }
        tasks[t.id] = t;
        created.push(t);
      }
      set({ ...s, tasks });
      persist(db.saveTasks(created));
      if (full) toast('Top 3 ist schon voll');
      return created;
    },

    updateTask(id: string, patch: Partial<Task>) {
      const s = get();
      const old = s.tasks[id];
      if (!old) return;
      const t: Task = { ...old, ...patch, updatedAt: nowIso() };
      if (patch.done !== undefined && patch.done !== old.done) t.doneAt = patch.done ? nowIso() : null;
      // Wer selbst umplant, braucht keinen „von gestern“-Hinweis mehr
      if (patch.date !== undefined && patch.date !== old.date && patch.carriedFrom === undefined) t.carriedFrom = null;
      let full = false;
      if (t.top3 && (!old.top3 || t.date !== old.date) && top3Count(s.tasks, t.date, id) >= 3) {
        t.top3 = false;
        full = true;
      }
      set({ ...s, tasks: { ...s.tasks, [id]: t } });
      persist(db.saveTasks([t]));
      if (full) toast('Top 3 ist schon voll – höchstens drei Aufgaben');
    },

    deleteTask(id: string) {
      const s = get();
      const tasks = { ...s.tasks };
      delete tasks[id];
      set({ ...s, tasks });
      persist(db.removeTask(id));
    },

    addHabit(input: NewHabit) {
      const s = get();
      const h: Habit = {
        id: uid(), time: null, duration: 15, days: [0, 1, 2, 3, 4, 5, 6], goal: 1, unit: '', color: 'green',
        note: '', activeFrom: todayStr(), archived: false, createdAt: nowIso(), updatedAt: nowIso(), ...input,
      };
      set({ ...s, habits: { ...s.habits, [h.id]: h } });
      persist(db.saveHabit(h));
      return h;
    },

    updateHabit(id: string, patch: Partial<Habit>) {
      const s = get();
      const old = s.habits[id];
      if (!old) return;
      const h: Habit = { ...old, ...patch, updatedAt: nowIso() };
      set({ ...s, habits: { ...s.habits, [id]: h } });
      persist(db.saveHabit(h));
    },

    deleteHabit(id: string) {
      const s = get();
      const habits = { ...s.habits };
      delete habits[id];
      const progress = Object.fromEntries(Object.entries(s.progress).filter(([k]) => !k.startsWith(id + '|')));
      set({ ...s, habits, progress });
      persist(db.removeHabit(id));
    },

    setProgress(habitId: string, date: string, value: number) {
      const s = get();
      const key = pkey(habitId, date);
      const progress = { ...s.progress };
      if (value > 0) progress[key] = value;
      else delete progress[key];
      set({ ...s, progress });
      persist(db.saveProgress({ key, habitId, date, value }));
    },

    /** Legt eine Routine an oder aktualisiert sie (mit `id`). */
    saveRoutine(input: Partial<Routine> & { name: string; lines: string }) {
      const s = get();
      const old = input.id ? s.routines[input.id] : undefined;
      const r: Routine = {
        id: uid(), color: 'teal', createdAt: nowIso(), ...old, ...input, updatedAt: nowIso(),
      } as Routine;
      set({ ...s, routines: { ...s.routines, [r.id]: r } });
      persist(db.saveRoutine(r));
      return r;
    },

    deleteRoutine(id: string) {
      const s = get();
      const routines = { ...s.routines };
      delete routines[id];
      set({ ...s, routines });
      persist(db.removeRoutine(id));
    },

    /** Fügt alle Einträge einer Routine als Aufgaben in einen Tag ein. */
    insertRoutine(id: string, date: string) {
      const r = get().routines[id];
      if (!r) return 0;
      const lines = r.lines.split('\n').map(l => l.trim()).filter(Boolean);
      const created = actions.addTasks(
        lines.map(l => {
          const p = parseLine(l, date, 'task');
          return { title: p.title, date, time: p.time ?? null, duration: p.duration ?? 15, color: r.color, top3: !!p.top3 };
        }),
      );
      return created.length;
    },

    setSettings(patch: Partial<Settings>) {
      const s = get();
      const settings = { ...s.settings, ...patch };
      set({ ...s, settings });
      persist(db.saveSettings(settings));
      try {
        localStorage.setItem('tagesplan-theme', settings.theme);
      } catch {
        /* nur Komfort fürs erste Zeichnen */
      }
    },

    /** Offene Aufgaben vergangener Tage auf heute holen. */
    carryOver(today: string) {
      const s = get();
      if (!s.settings.carryOver) return;
      let count = top3Count(s.tasks, today);
      const moved: Task[] = [];
      for (const t of Object.values(s.tasks)) {
        if (!t.date || t.date >= today || t.done) continue;
        const n: Task = { ...t, date: today, carriedFrom: t.carriedFrom ?? t.date, updatedAt: nowIso() };
        if (n.top3) {
          if (count >= 3) n.top3 = false;
          else count++;
        }
        moved.push(n);
      }
      if (!moved.length) return;
      set({ ...s, tasks: { ...s.tasks, ...byId(moved) } });
      persist(db.saveTasks(moved));
    },

    exportBackup(): BackupFile {
      const s = get();
      return {
        app: 'tagesplan',
        version: 2,
        exportedAt: nowIso(),
        tasks: Object.values(s.tasks),
        habits: Object.values(s.habits),
        progress: progressList(s.progress),
        routines: Object.values(s.routines),
        settings: s.settings,
      };
    },

    async importBackup(data: BackupFile, mode: 'replace' | 'merge') {
      const s = get();
      let tasks: Record<string, Task>;
      let habits: Record<string, Habit>;
      let progress: Record<string, number>;
      let routines: Record<string, Routine>;
      let settings = s.settings;
      if (mode === 'replace') {
        tasks = byId(data.tasks);
        habits = byId(data.habits);
        progress = Object.fromEntries(data.progress.map(p => [p.key, p.value]));
        routines = byId(data.routines);
        settings = { ...DEFAULT_SETTINGS, ...data.settings };
      } else {
        routines = { ...s.routines };
        for (const r of data.routines) if (!routines[r.id] || routines[r.id].updatedAt < r.updatedAt) routines[r.id] = r;
        tasks = { ...s.tasks };
        for (const t of data.tasks) if (!tasks[t.id] || tasks[t.id].updatedAt < t.updatedAt) tasks[t.id] = t;
        habits = { ...s.habits };
        for (const h of data.habits) if (!habits[h.id] || habits[h.id].updatedAt < h.updatedAt) habits[h.id] = h;
        progress = { ...s.progress };
        for (const p of data.progress) progress[p.key] = Math.max(progress[p.key] ?? 0, p.value);
      }
      await db.replaceAll({
        tasks: Object.values(tasks),
        habits: Object.values(habits),
        progress: progressList(progress),
        routines: Object.values(routines),
        settings,
      });
      set({ ...get(), tasks, habits, progress, routines, settings });
    },
  };
  return actions;
}

export type Actions = ReturnType<typeof createActions>;

const Ctx = createContext<{ state: State; actions: Actions } | null>(null);

const initialState: State = {
  loaded: false, tasks: {}, habits: {}, progress: {}, routines: {}, settings: DEFAULT_SETTINGS, toast: null,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);
  const actions = useMemo(
    () =>
      createActions(
        () => ref.current,
        s => {
          ref.current = s;
          setState(s);
        },
      ),
    [],
  );

  useEffect(() => {
    let alive = true;
    db.loadAll()
      .then(d => {
        if (!alive) return;
        ref.current = {
          ...ref.current,
          loaded: true,
          tasks: byId(d.tasks),
          habits: byId(d.habits),
          progress: Object.fromEntries(d.progress.map(p => [p.key, p.value])),
          routines: byId(d.routines),
          settings: d.settings,
        };
        setState(ref.current);
      })
      .catch(err => {
        console.error(err);
        ref.current = { ...ref.current, loaded: true, toast: { id: 1, text: 'Daten konnten nicht geladen werden' } };
        setState(ref.current);
      });
    navigator.storage?.persist?.().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider fehlt');
  return c;
}
