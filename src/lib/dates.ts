import { useEffect, useState } from 'react';

// Datumswerte sind lokale Kalendertage im Format YYYY-MM-DD.

export const pad = (n: number) => String(n).padStart(2, '0');

export const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromStr = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayStr = () => toStr(new Date());

export const addDays = (s: string, n: number) => {
  const d = fromStr(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
};

/** Wochentag mit Montag = 0. */
export const weekday = (s: string) => (fromStr(s).getDay() + 6) % 7;

export const weekStart = (s: string) => addDays(s, -weekday(s));

export const daysBetween = (a: string, b: string) =>
  Math.round((fromStr(b).getTime() - fromStr(a).getTime()) / 86400000);

export const WD_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Kalenderwoche nach ISO 8601. */
export function isoWeek(s: string) {
  const d = fromStr(s);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WORK_DAYS = [0, 1, 2, 3, 4];

export const fmtDayMonth = (s: string) => {
  const d = fromStr(s);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
};

export const fmtLong = (s: string) => `${WD_LONG[weekday(s)]}, ${fmtDayMonth(s)}`;

export const fmtShort = (s: string) => {
  const d = fromStr(s);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

export const fmtShortWd = (s: string) => `${WD_SHORT[weekday(s)]}, ${fmtShort(s)}`;

export const fmtDE = (s: string) => {
  const d = fromStr(s);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const relDay = (s: string, today: string) =>
  s === today ? 'Heute'
  : s === addDays(today, 1) ? 'Morgen'
  : s === addDays(today, -1) ? 'Gestern'
  : s === addDays(today, 2) ? 'Übermorgen'
  : null;

/** „Heute“, „Morgen“ oder „Mo, 3.11.“ */
export const dayLabel = (s: string, today: string) => relDay(s, today) ?? fmtShortWd(s);

export const fmtTime = (min: number) => {
  const m = Math.max(0, Math.min(1440, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export const parseTime = (v: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(v);
  return m ? +m[1] * 60 + +m[2] : null;
};

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const fmtDuration = (m: number) =>
  m < 60 ? `${m} Min.`
  : m % 60 === 0 ? `${m / 60} Std.`
  : `${Math.floor(m / 60)} Std. ${m % 60} Min.`;

const sameSet = (a: number[], b: number[]) => a.length === b.length && b.every(x => a.includes(x));

export const daysLabel = (days: number[]) =>
  sameSet(days, ALL_DAYS) ? 'Täglich'
  : sameSet(days, WORK_DAYS) ? 'Werktags'
  : sameSet(days, [5, 6]) ? 'Am Wochenende'
  : [...days].sort().map(d => WD_SHORT[d]).join(', ');

export const daysPreset = (days: number[]): 'daily' | 'work' | 'custom' =>
  sameSet(days, ALL_DAYS) ? 'daily' : sameSet(days, WORK_DAYS) ? 'work' : 'custom';

/** Aktueller Tag; aktualisiert sich nach Mitternacht und beim Zurückkehren in die App. */
export function useToday() {
  const [today, setToday] = useState(todayStr);
  useEffect(() => {
    const update = () => setToday(todayStr());
    const timer = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, []);
  return today;
}
