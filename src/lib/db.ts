import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_SETTINGS, type Habit, type Progress, type Routine, type Settings, type Task } from './types';

interface TagesplanDB extends DBSchema {
  tasks: { key: string; value: Task };
  habits: { key: string; value: Habit };
  progress: { key: string; value: Progress; indexes: { byHabit: string } };
  routines: { key: string; value: Routine };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<TagesplanDB>> | null = null;

function db() {
  dbPromise ??= openDB<TagesplanDB>('tagesplan', 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore('tasks', { keyPath: 'id' });
        d.createObjectStore('habits', { keyPath: 'id' });
        d.createObjectStore('progress', { keyPath: 'key' }).createIndex('byHabit', 'habitId');
        d.createObjectStore('meta');
      }
      if (oldVersion < 2) d.createObjectStore('routines', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export async function loadAll() {
  const d = await db();
  const [tasks, habits, progress, routines, settings] = await Promise.all([
    d.getAll('tasks'),
    d.getAll('habits'),
    d.getAll('progress'),
    d.getAll('routines'),
    d.get('meta', 'settings'),
  ]);
  return {
    tasks,
    habits,
    progress,
    routines,
    settings: { ...DEFAULT_SETTINGS, ...(settings as Partial<Settings> | undefined) },
  };
}

export async function saveTasks(tasks: Task[]) {
  const tx = (await db()).transaction('tasks', 'readwrite');
  await Promise.all([...tasks.map(t => tx.store.put(t)), tx.done]);
}

export async function removeTask(id: string) {
  await (await db()).delete('tasks', id);
}

export async function saveHabit(h: Habit) {
  await (await db()).put('habits', h);
}

export async function removeHabit(id: string) {
  const tx = (await db()).transaction(['habits', 'progress'], 'readwrite');
  const keys = await tx.objectStore('progress').index('byHabit').getAllKeys(id);
  await Promise.all([
    tx.objectStore('habits').delete(id),
    ...keys.map(k => tx.objectStore('progress').delete(k)),
    tx.done,
  ]);
}

export async function saveProgress(p: Progress) {
  const d = await db();
  if (p.value > 0) await d.put('progress', p);
  else await d.delete('progress', p.key);
}

export async function saveRoutine(r: Routine) {
  await (await db()).put('routines', r);
}

export async function removeRoutine(id: string) {
  await (await db()).delete('routines', id);
}

export async function saveSettings(s: Settings) {
  await (await db()).put('meta', s, 'settings');
}

export async function replaceAll(data: {
  tasks: Task[];
  habits: Habit[];
  progress: Progress[];
  routines: Routine[];
  settings: Settings;
}) {
  const tx = (await db()).transaction(['tasks', 'habits', 'progress', 'routines', 'meta'], 'readwrite');
  const tasks = tx.objectStore('tasks');
  const habits = tx.objectStore('habits');
  const progress = tx.objectStore('progress');
  const routines = tx.objectStore('routines');
  await Promise.all([tasks.clear(), habits.clear(), progress.clear(), routines.clear()]);
  await Promise.all([
    ...data.tasks.map(t => tasks.put(t)),
    ...data.habits.map(h => habits.put(h)),
    ...data.progress.map(p => progress.put(p)),
    ...data.routines.map(r => routines.put(r)),
    tx.objectStore('meta').put(data.settings, 'settings'),
    tx.done,
  ]);
}
