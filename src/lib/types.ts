export type ColorName = 'blue' | 'orange' | 'green' | 'red' | 'teal' | 'yellow' | 'gray';

export const COLORS: ColorName[] = ['blue', 'orange', 'green', 'red', 'teal', 'yellow', 'gray'];

export const COLOR_LABEL: Record<ColorName, string> = {
  blue: 'Blau',
  orange: 'Orange',
  green: 'Grün',
  red: 'Rot',
  teal: 'Türkis',
  yellow: 'Gelb',
  gray: 'Grau',
};

/** Einmalige Aufgabe. `date` = null bedeutet „Eingang“. Zeiten in Minuten ab Mitternacht. */
export interface Task {
  id: string;
  title: string;
  date: string | null;
  time: number | null;
  duration: number;
  note: string;
  color: ColorName;
  done: boolean;
  doneAt: string | null;
  top3: boolean;
  carriedFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Wiederkehrende Gewohnheit. `days`: 0 = Montag … 6 = Sonntag. */
export interface Habit {
  id: string;
  title: string;
  time: number | null;
  duration: number;
  days: number[];
  goal: number;
  unit: string;
  color: ColorName;
  note: string;
  activeFrom: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fortschritt einer Gewohnheit an einem Tag. */
export interface Progress {
  key: string;
  habitId: string;
  date: string;
  value: number;
}

/** Vorlage mit mehreren Einträgen; `lines` wird beim Einfügen wie die Schnellerfassung gelesen. */
export interface Routine {
  id: string;
  name: string;
  lines: string;
  color: ColorName;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  carryOver: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: 'auto', carryOver: true };

export interface BackupFile {
  app: 'tagesplan';
  version: 1 | 2;
  exportedAt: string;
  tasks: Task[];
  habits: Habit[];
  progress: Progress[];
  routines: Routine[];
  settings: Settings;
}
