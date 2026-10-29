import { useState, type CSSProperties, type ReactNode } from 'react';
import { ALL_DAYS, WD_SHORT, WORK_DAYS, addDays, daysPreset, fmtShortWd, fmtTime, parseTime } from '../lib/dates';
import { COLORS, COLOR_LABEL, type ColorName } from '../lib/types';
import { IconCalendar, IconMinus, IconPlus } from './Icons';

export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  const i = Math.max(0, options.findIndex(o => o.value === value));
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ '--n': options.length, '--i': i } as CSSProperties}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

export function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function RowIcon({ color, children }: { color: string; children: ReactNode }) {
  return <span className="round-icon" style={{ background: color }}>{children}</span>;
}

/** Tag für Aufgaben: Eingang, Heute, Morgen oder beliebiges Datum. */
export function DayField({ value, onChange, today }: { value: string | null; onChange: (d: string | null) => void; today: string }) {
  const tomorrow = addDays(today, 1);
  const other = value !== null && value !== today && value !== tomorrow;
  return (
    <div className="chips">
      <Chip on={value === null} onClick={() => onChange(null)}>Eingang</Chip>
      <Chip on={value === today} onClick={() => onChange(today)}>Heute</Chip>
      <Chip on={value === tomorrow} onClick={() => onChange(tomorrow)}>Morgen</Chip>
      <label className={`chip date-chip${other ? ' on' : ''}`}>
        <IconCalendar size={17} />
        {other ? fmtShortWd(value!) : 'Datum'}
        <input type="date" value={value ?? ''} onChange={e => e.target.value && onChange(e.target.value)} aria-label="Datum wählen" />
      </label>
    </div>
  );
}

/** Wochentage für Gewohnheiten: täglich, werktags oder frei wählbar. */
export function DaysField({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  const [custom, setCustom] = useState(daysPreset(days) === 'custom');
  const preset = custom ? 'custom' : daysPreset(days);
  return (
    <>
      <Segmented
        label="Wiederholung"
        value={preset}
        options={[
          { value: 'daily', label: 'Täglich' },
          { value: 'work', label: 'Werktags' },
          { value: 'custom', label: 'Eigene' },
        ]}
        onChange={v => {
          setCustom(v === 'custom');
          if (v === 'daily') onChange([...ALL_DAYS]);
          if (v === 'work') onChange([...WORK_DAYS]);
        }}
      />
      <div className="wd-row">
        {WD_SHORT.map((l, i) => {
          const on = days.includes(i);
          return (
            <button
              key={l} type="button" className={`wd${on ? ' on' : ''}`} aria-pressed={on}
              onClick={() => {
                const next = on ? days.filter(d => d !== i) : [...days, i].sort();
                if (!next.length) return;
                setCustom(true);
                onChange(next);
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </>
  );
}

const suggestTime = () => {
  const d = new Date();
  return Math.min(23 * 60, (d.getHours() + 1) * 60);
};

export function TimeRow({ value, onChange, fallback }: { value: number | null; onChange: (v: number | null) => void; fallback?: number }) {
  return (
    <div className="group-row">
      <span className="round-icon" style={{ background: 'var(--blue)' }}><ClockGlyph /></span>
      <span className="grow">Uhrzeit</span>
      {value != null && (
        <input
          type="time" step={300} className="field-input" value={fmtTime(value)} aria-label="Uhrzeit"
          onChange={e => {
            const t = parseTime(e.target.value);
            if (t != null) onChange(t);
          }}
        />
      )}
      <Switch label="Uhrzeit festlegen" checked={value != null} onChange={on => onChange(on ? fallback ?? suggestTime() : null)} />
    </div>
  );
}

function ClockGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

const DURATIONS = [15, 30, 45, 60, 90];

export function DurationField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const list = DURATIONS.includes(value) ? DURATIONS : [...DURATIONS, value].sort((a, b) => a - b);
  return (
    <div className="chips">
      {list.map(d => (
        <Chip key={d} on={d === value} onClick={() => onChange(d)}>
          {d} Min.
        </Chip>
      ))}
    </div>
  );
}

export function ColorField({ value, onChange }: { value: ColorName; onChange: (c: ColorName) => void }) {
  return (
    <div className="colors" role="radiogroup" aria-label="Farbe">
      {COLORS.map(c => (
        <button
          key={c} type="button" role="radio" aria-checked={c === value} aria-label={COLOR_LABEL[c]}
          className={`color-dot c-${c}${c === value ? ' on' : ''}`} onClick={() => onChange(c)}
        >
          <span />
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, label }: { value: number; onChange: (v: number) => void; min?: number; label: string }) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" className="press" aria-label="Weniger" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <IconMinus size={18} />
      </button>
      <span className="stepper-value">{value}</span>
      <button type="button" className="press" aria-label="Mehr" onClick={() => onChange(value + 1)}>
        <IconPlus size={18} />
      </button>
    </div>
  );
}

export function GoalRows({ goal, unit, onGoal, onUnit }: { goal: number; unit: string; onGoal: (v: number) => void; onUnit: (v: string) => void }) {
  return (
    <>
      <div className="group-row">
        <span className="grow">
          Ziel pro Tag
          <span className="row-sub">{goal === 1 ? 'Einfach abhaken' : `${goal}× antippen zum Erfüllen`}</span>
        </span>
        <Stepper value={goal} min={1} onChange={onGoal} label="Ziel pro Tag" />
      </div>
      {goal > 1 && (
        <div className="group-row">
          <span className="grow">Einheit</span>
          <input className="field-input text" value={unit} placeholder="z. B. Liter" onChange={e => onUnit(e.target.value)} aria-label="Einheit" />
        </div>
      )}
    </>
  );
}
