import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_DAYS, useToday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { parseLine } from '../lib/parse';
import { useStore, type NewTask } from '../lib/store';
import type { ColorName } from '../lib/types';
import type { AddDefaults } from '../nav';
import { ColorField, DayField, DaysField, DurationField, GoalRows, Segmented, Switch, TimeRow } from '../components/Fields';
import { IconStar } from '../components/Icons';
import { Sheet } from '../components/Sheet';

/** Schnelle Erfassung: eine Zeile pro Eintrag, Uhrzeit/Tag/Wiederholung werden im Text erkannt. */
export function AddSheet({ defaults, onClose }: { defaults: AddDefaults | null; onClose: () => void }) {
  const today = useToday();
  const { actions } = useStore();
  const [kind, setKind] = useState<'task' | 'habit'>('task');
  const [text, setText] = useState('');
  const [date, setDate] = useState<string | null>(today);
  const [time, setTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState<ColorName>('blue');
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [goal, setGoal] = useState(1);
  const [unit, setUnit] = useState('');
  const [top3, setTop3] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!defaults) return;
    setKind(defaults.kind);
    setText('');
    setDate(defaults.date);
    setTime(defaults.time);
    setDuration(defaults.kind === 'habit' ? 15 : 30);
    setColor(defaults.kind === 'habit' ? 'green' : 'blue');
    setDays([...ALL_DAYS]);
    setGoal(1);
    setUnit('');
    setTop3(false);
    area.current?.focus({ preventScroll: true });
  }, [defaults]);

  const parsed = useMemo(
    () => text.split('\n').map(l => l.trim()).filter(Boolean).map(l => parseLine(l, today, kind)),
    [text, today, kind],
  );

  const save = () => {
    if (!parsed.length) return;
    const tasks: NewTask[] = [];
    for (const p of parsed) {
      const t = p.time ?? time;
      const dur = p.duration ?? duration;
      if (p.days || kind === 'habit') {
        actions.addHabit({
          title: p.title, time: t, duration: dur, days: p.days ?? days, goal: p.goal ?? goal,
          unit: p.goal !== undefined ? p.unit ?? '' : unit,
          // Im Aufgaben-Modus erkannte Gewohnheit: Standardfarbe der Gewohnheiten statt Aufgaben-Blau
          color: kind === 'task' && color === 'blue' ? 'green' : color,
          activeFrom: (p.date !== undefined ? p.date : date) ?? today,
        });
      } else {
        tasks.push({ title: p.title, date: p.date !== undefined ? p.date : date, time: t, duration: dur, color, top3: !!p.top3 || top3 });
      }
    }
    if (tasks.length) actions.addTasks(tasks);
    haptic();
    onClose();
  };

  const n = parsed.length;
  return (
    <Sheet
      open={!!defaults}
      onClose={onClose}
      title="Neuer Eintrag"
      left={<button type="button" className="sheet-btn" onClick={onClose}>Abbrechen</button>}
      right={
        <button type="button" className="sheet-btn strong" disabled={!n} onClick={save}>
          {n > 1 ? `${n} hinzufügen` : 'Hinzufügen'}
        </button>
      }
    >
      <Segmented
        label="Art"
        value={kind}
        onChange={k => {
          setKind(k);
          setColor(k === 'habit' ? 'green' : 'blue');
          setDuration(k === 'habit' ? 15 : 30);
        }}
        options={[
          { value: 'task', label: 'Aufgabe' },
          { value: 'habit', label: 'Gewohnheit' },
        ]}
      />
      <div className="group">
        <textarea
          ref={area}
          className="title-area"
          rows={Math.min(6, Math.max(2, text.split('\n').length))}
          placeholder={kind === 'task' ? 'z. B. Training morgen 18 Uhr 60min' : 'z. B. Wasser 3x täglich'}
          value={text}
          onChange={e => setText(e.target.value)}
          aria-label="Titel, eine Zeile pro Eintrag"
          enterKeyHint="enter"
        />
      </div>
      {parsed.some(p => p.chips.length) ? (
        <div className="preview" aria-live="polite">
          {parsed.map((p, i) => (
            <div className="preview-line" key={i}>
              <span className="preview-title">{p.title}</span>
              {(p.days || kind === 'habit') && kind === 'task' && <span className="pchip strong">Gewohnheit</span>}
              {p.chips.map(c => <span className="pchip" key={c}>{c}</span>)}
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">Eine Zeile pro Eintrag. Uhrzeit, Tag, Dauer, „täglich“ und „#wichtig“ werden erkannt.</p>
      )}

      {kind === 'task' ? (
        <>
          <div className="group-header">Tag</div>
          <div className="group pad"><DayField value={date} onChange={setDate} today={today} /></div>
        </>
      ) : (
        <>
          <div className="group-header">Wiederholen</div>
          <div className="group pad"><DaysField days={days} onChange={setDays} /></div>
        </>
      )}

      <div className="group">
        <TimeRow value={time} onChange={setTime} />
      </div>
      <div className="group-header">Dauer</div>
      <div className="group pad"><DurationField value={duration} onChange={setDuration} /></div>

      {kind === 'habit' ? (
        <div className="group"><GoalRows goal={goal} unit={unit} onGoal={setGoal} onUnit={setUnit} /></div>
      ) : (
        <div className="group">
          <div className="group-row">
            <span className="round-icon" style={{ background: 'var(--orange)' }}><IconStar size={17} filled /></span>
            <span className="grow">Top 3 des Tages</span>
            <Switch label="Top 3" checked={top3} onChange={setTop3} />
          </div>
        </div>
      )}

      <div className="group-header">Farbe</div>
      <div className="group pad"><ColorField value={color} onChange={setColor} /></div>
    </Sheet>
  );
}
