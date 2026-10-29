import { useRef } from 'react';
import { reminderUrl } from '../lib/backup';
import { longestStreak, pkey, streak } from '../lib/day';
import { HabitGrid } from '../components/HabitGrid';
import { addDays, dayLabel, useToday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { useStore } from '../lib/store';
import type { DetailTarget } from '../nav';
import { CheckCircle } from '../components/CheckCircle';
import { ColorField, DayField, DaysField, DurationField, GoalRows, Stepper, Switch, TimeRow } from '../components/Fields';
import { IconArrowRight, IconBell, IconFlame, IconStar, IconTrash, IconTray } from '../components/Icons';
import { carriedLabel } from '../components/ItemRow';
import { Sheet } from '../components/Sheet';

/** Details als Bottom Sheet; Änderungen werden sofort gespeichert. */
export function DetailSheet({ target, onClose }: { target: DetailTarget | null; onClose: () => void }) {
  const last = useRef(target);
  if (target) last.current = target;
  const t = last.current;
  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title={t?.kind === 'habit' ? 'Gewohnheit' : 'Aufgabe'}
      right={<button type="button" className="sheet-btn strong" onClick={onClose}>Fertig</button>}
    >
      {t && (t.kind === 'task' ? <TaskDetail id={t.id} onClose={onClose} /> : <HabitDetail id={t.id} date={t.date} onClose={onClose} />)}
    </Sheet>
  );
}

function TaskDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, actions } = useStore();
  const today = useToday();
  const t = state.tasks[id];
  if (!t) return <p className="hint">Dieser Eintrag wurde gelöscht.</p>;
  const up = actions.updateTask.bind(null, id);

  return (
    <>
      <div className={`group c-${t.color}${t.done ? ' done' : ''}`}>
        <div className="group-row title-row">
          <CheckCircle done={t.done} label={`${t.title} abhaken`} onTap={() => { haptic(); up({ done: !t.done }); }} />
          <input className="title-input" value={t.title} onChange={e => up({ title: e.target.value })} placeholder="Titel" aria-label="Titel" />
        </div>
        <div className="group-row">
          <textarea className="note-input" value={t.note} onChange={e => up({ note: e.target.value })} placeholder="Notiz" rows={2} aria-label="Notiz" />
        </div>
      </div>
      {t.carriedFrom && t.date && <p className="hint">Automatisch übertragen ({carriedLabel(t.carriedFrom, t.date)}).</p>}

      <div className="group-header">Tag</div>
      <div className="group pad"><DayField value={t.date} onChange={d => up({ date: d })} today={today} /></div>

      <div className="group"><TimeRow value={t.time} onChange={v => up({ time: v })} /></div>
      <div className="group-header">Dauer</div>
      <div className="group pad"><DurationField value={t.duration} onChange={v => up({ duration: v })} /></div>

      <div className="group">
        <div className="group-row">
          <span className="round-icon" style={{ background: 'var(--orange)' }}><IconStar size={17} filled /></span>
          <span className="grow">Top 3 des Tages</span>
          <Switch label="Top 3" checked={t.top3} onChange={v => up({ top3: v })} />
        </div>
      </div>

      <div className="group-header">Farbe</div>
      <div className="group pad"><ColorField value={t.color} onChange={c => up({ color: c })} /></div>

      <div className="group">
        <a className="group-row action" href={reminderUrl(t.title, t.date, t.time)}>
          <IconBell size={20} /> In Erinnerungen übernehmen
        </a>
        <button type="button" className="group-row action" onClick={() => { up({ date: addDays(t.date ?? today, 1) }); actions.toast('Auf morgen verschoben'); onClose(); }}>
          <IconArrowRight size={20} /> Auf {t.date ? dayLabel(addDays(t.date, 1), today) : 'morgen'} verschieben
        </button>
        {t.date && (
          <button type="button" className="group-row action" onClick={() => { up({ date: null, time: null }); onClose(); }}>
            <IconTray size={20} /> In den Eingang legen
          </button>
        )}
        <button
          type="button" className="group-row action danger"
          onClick={() => {
            if (!confirm(`„${t.title}“ löschen?`)) return;
            actions.deleteTask(id);
            onClose();
          }}
        >
          <IconTrash size={20} /> Löschen
        </button>
      </div>
    </>
  );
}

function HabitDetail({ id, date, onClose }: { id: string; date: string; onClose: () => void }) {
  const { state, actions } = useStore();
  const today = useToday();
  const h = state.habits[id];
  if (!h) return <p className="hint">Diese Gewohnheit wurde gelöscht.</p>;
  const up = actions.updateHabit.bind(null, id);
  const value = state.progress[pkey(id, date)] ?? 0;
  const st = streak(h, state.progress, today);
  const record = Math.max(st, longestStreak(h, state.progress, today));
  const setValue = (v: number) => {
    haptic();
    actions.setProgress(id, date, Math.max(0, v));
  };

  return (
    <>
      <div className={`group c-${h.color}${value >= h.goal ? ' done' : ''}`}>
        <div className="group-row title-row">
          <CheckCircle
            done={value >= h.goal} value={value} goal={h.goal} label={`${h.title} abhaken`}
            onTap={() => setValue(h.goal > 1 ? Math.min(h.goal, value + 1) : value ? 0 : 1)}
            onLongPress={h.goal > 1 ? () => setValue(value - 1) : undefined}
          />
          <input className="title-input" value={h.title} onChange={e => up({ title: e.target.value })} placeholder="Titel" aria-label="Titel" />
        </div>
        <div className="group-row">
          <textarea className="note-input" value={h.note} onChange={e => up({ note: e.target.value })} placeholder="Notiz" rows={2} aria-label="Notiz" />
        </div>
      </div>

      <div className="group">
        <div className="group-row">
          <span className="round-icon" style={{ background: 'var(--orange)' }}><IconFlame size={17} /></span>
          <span className="grow">{st === 1 ? '1 Tag am Stück' : `${st} Tage am Stück`}</span>
          <span className="row-detail">Rekord {record}</span>
        </div>
        <div className="group-row">
          <span className="grow">
            {dayLabel(date, today)}
            {h.goal > 1 && <span className="row-sub">{value} von {h.goal}{h.unit ? ' ' + h.unit : ''}</span>}
          </span>
          {h.goal > 1 ? (
            <Stepper value={value} onChange={setValue} label="Fortschritt" />
          ) : (
            <Switch label="Erledigt" checked={value >= 1} onChange={v => setValue(v ? 1 : 0)} />
          )}
        </div>
      </div>

      <div className="group-header">Letzte 12 Wochen</div>
      <div className={`group pad c-${h.color}`}><HabitGrid habit={h} progress={state.progress} today={today} /></div>

      <div className="group-header">Wiederholen</div>
      <div className="group pad"><DaysField days={h.days} onChange={d => up({ days: d })} /></div>

      <div className="group"><TimeRow value={h.time} onChange={v => up({ time: v })} /></div>
      <div className="group-header">Dauer</div>
      <div className="group pad"><DurationField value={h.duration} onChange={v => up({ duration: v })} /></div>

      <div className="group"><GoalRows goal={h.goal} unit={h.unit} onGoal={v => up({ goal: v })} onUnit={v => up({ unit: v })} /></div>

      <div className="group-header">Farbe</div>
      <div className="group pad"><ColorField value={h.color} onChange={c => up({ color: c })} /></div>

      <div className="group">
        <a className="group-row action" href={reminderUrl(h.title, date, h.time)}>
          <IconBell size={20} /> In Erinnerungen übernehmen
        </a>
        <button type="button" className="group-row action" onClick={() => { up({ archived: !h.archived }); onClose(); }}>
          <IconTray size={20} /> {h.archived ? 'Wiederherstellen' : 'Archivieren'}
        </button>
        <button
          type="button" className="group-row action danger"
          onClick={() => {
            if (!confirm(`„${h.title}“ mit dem ganzen Verlauf löschen?`)) return;
            actions.deleteHabit(id);
            onClose();
          }}
        >
          <IconTrash size={20} /> Löschen
        </button>
      </div>
      {!h.archived && <p className="hint">Archivierte Gewohnheiten verschwinden aus der Tagesansicht, ihr Verlauf bleibt erhalten.</p>}
    </>
  );
}
