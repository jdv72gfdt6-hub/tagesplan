import { ALL_DAYS, WORK_DAYS, addDays, dayLabel, daysLabel, fmtDuration, fmtTime, toStr, weekday } from './dates';

/** Was aus einer Eingabezeile erkannt wurde. Nicht gesetzte Felder übernimmt das Formular. */
export interface Parsed {
  title: string;
  date?: string | null;
  time?: number;
  duration?: number;
  days?: number[];
  goal?: number;
  unit?: string;
  top3?: boolean;
  chips: string[];
}

const WD_NAMES = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];

const UNITS: Record<string, string> = {
  l: 'Liter', liter: 'Liter', glas: 'Gläser', 'gläser': 'Gläser', seite: 'Seiten', seiten: 'Seiten',
  schritte: 'Schritte', km: 'km', kapitel: 'Kapitel', 'stück': 'Stück', stk: 'Stück',
};

// Wortende: Leerzeichen oder Satzzeichen (die Zeile wird mit Leerzeichen umrahmt)
const END = '(?=[\\s,.;!?])';
const re = (src: string) => new RegExp(src.replaceAll('$END', END), 'iu');

/**
 * Erkennt z. B. „Kreatin 8:00 täglich“, „Training morgen 18 Uhr 60min“,
 * „Wasser 3x täglich“, „Steuer #wichtig“.
 */
export function parseLine(line: string, today: string, mode: 'task' | 'habit'): Parsed {
  let s = ` ${line} `;
  const out: Parsed = { title: '', chips: [] };
  const eat = (r: RegExp) => {
    const m = s.match(r);
    if (m) s = s.slice(0, m.index!) + ' ' + s.slice(m.index! + m[0].length);
    return m;
  };

  if (eat(re('\\s(?:#wichtig|#top3?|#prio|!{1,3})$END'))) out.top3 = true;

  // Wiederholung
  if (eat(re('\\s(?:täglich|taeglich|jeden\\s+tag|jeden\\s+morgen|jeden\\s+abend)$END'))) out.days = [...ALL_DAYS];
  else if (eat(re('\\s(?:werktags|wochentags)$END'))) out.days = [...WORK_DAYS];
  else if (eat(re('\\s(?:jedes\\s+wochenende|wochenends)$END'))) out.days = [5, 6];
  else {
    const days: number[] = [];
    WD_NAMES.forEach((n, i) => {
      const r = re(`\\s(?:jeden\\s+${n}|${n}s)$END`);
      while (eat(r)) if (!days.includes(i)) days.push(i);
    });
    if (days.length) out.days = days.sort();
  }

  // Ziel nur bei Gewohnheiten, damit „Milch 2 Liter kaufen“ als Aufgabe unverändert bleibt
  if (out.days || mode === 'habit') {
    let m = eat(re('\\s(\\d+)\\s*(?:x|mal)$END'));
    if (m) out.goal = +m[1];
    else {
      m = eat(re('\\s(\\d+(?:[.,]\\d+)?)\\s*(liter|l|gläser|glas|seiten|seite|schritte|km|kapitel|stück|stk)$END'));
      if (m) {
        out.goal = parseFloat(m[1].replace(',', '.'));
        out.unit = UNITS[m[2].toLowerCase()];
      }
    }
  }

  // Datum
  let m = eat(/\s(?:am\s+)?(\d{1,2})\.(\d{1,2})\.(\d{2,4})?(?=[\s,;!?])/u);
  if (m) {
    const day = +m[1];
    const month = +m[2];
    let year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : +today.slice(0, 4);
    let d = new Date(year, month - 1, day);
    if (!m[3] && toStr(d) < today) d = new Date(++year, month - 1, day);
    if (d.getMonth() === month - 1 && d.getDate() === day) out.date = toStr(d);
  } else if (eat(re('\\s(?:übermorgen|uebermorgen)$END'))) out.date = addDays(today, 2);
  else if (eat(re('\\smorgen$END'))) out.date = addDays(today, 1);
  else if (eat(re('\\sheute$END'))) out.date = today;
  else if (eat(re('\\s#eingang$END'))) out.date = null;
  else {
    for (let i = 0; i < 7; i++) {
      if (eat(re(`\\s(?:am\\s+|nächsten\\s+|naechsten\\s+)?${WD_NAMES[i]}$END`))) {
        out.date = addDays(today, (i - weekday(today) + 7) % 7 || 7);
        break;
      }
    }
  }

  // Dauer (vor der Uhrzeit, damit „18 Uhr 60 min“ nicht als 18:60 gelesen wird)
  m = eat(/\s(\d{1,3})\s*(?:min|minuten|min\.)(?=[\s,;!?])/iu);
  if (m) out.duration = Math.min(1440, Math.max(5, +m[1]));
  else {
    m = eat(/\s(\d+(?:[.,]\d+)?)\s*(?:h|std\.?|stunden?)(?=[\s,;!?])/iu);
    if (m) out.duration = Math.min(1440, Math.round(parseFloat(m[1].replace(',', '.')) * 60));
  }

  // Uhrzeit
  m =
    eat(/\s(?:um\s+)?(\d{1,2})[:.](\d{2})(?:\s*uhr)?(?=[\s,.;!?])/iu) ??
    eat(/\s(?:um\s+)?(\d{1,2})\s*uhr(?:\s+(\d{1,2})(?=[\s,.;!?]))?(?=[\s,.;!?])/iu) ??
    eat(/\sum\s+(\d{1,2})(?=[\s,.;!?])/iu);
  if (m) {
    const h = +m[1];
    const min = m[2] ? +m[2] : 0;
    if (h < 24 && min < 60) out.time = h * 60 + min;
  }

  out.title =
    s.replace(/\s+/g, ' ').trim()
      .replace(/^(?:und|&|,)\s+/iu, '')
      .replace(/(?:\s+(?:und|&|um|am)|\s*,)+$/iu, '')
      .trim() || line.trim();

  const c = out.chips;
  if (out.days) c.push(daysLabel(out.days));
  if (out.date !== undefined) c.push(out.date === null ? 'Eingang' : dayLabel(out.date, today));
  if (out.time !== undefined) c.push(fmtTime(out.time));
  if (out.duration) c.push(fmtDuration(out.duration));
  if (out.goal) c.push(`Ziel ${out.goal}${out.unit ? ' ' + out.unit : '×'}`);
  if (out.top3) c.push('Top 3');
  return out;
}
