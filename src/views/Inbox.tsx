import { useEffect, useState, type FormEvent } from 'react';
import { addDays, dayLabel, fmtLong, fmtShortWd, useToday, weekday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { parseLine } from '../lib/parse';
import { useStore } from '../lib/store';
import type { Task } from '../lib/types';
import type { DetailTarget } from '../nav';
import { CheckCircle } from '../components/CheckCircle';
import { TimeRow } from '../components/Fields';
import { IconCalendar, IconChevronDown, IconChevronRight, IconPlus, IconTrash, IconTray } from '../components/Icons';
import { Empty, Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { SwipeRow } from '../components/SwipeRow';

export function InboxView({ onOpen }: { onOpen: (t: DetailTarget) => void }) {
  const { state, actions } = useStore();
  const today = useToday();
  const [text, setText] = useState('');
  const [plan, setPlan] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const inbox = Object.values(state.tasks).filter(t => t.date === null);
  const open = inbox.filter(t => !t.done).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const done = inbox.filter(t => t.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const line = text.trim();
    if (!line) return;
    const p = parseLine(line, today, 'task');
    if (p.days) {
      actions.addHabit({ title: p.title, time: p.time ?? null, duration: p.duration ?? 15, days: p.days, goal: p.goal ?? 1, unit: p.unit ?? '' });
      actions.toast('Als Gewohnheit angelegt');
    } else {
      const date = p.date ?? null;
      actions.addTasks([{ title: p.title, date, time: p.time ?? null, duration: p.duration ?? 30, top3: !!p.top3 }]);
      if (date) actions.toast(`Eingeplant: ${dayLabel(date, today)}`);
    }
    haptic();
    setText('');
  };

  const complete = (t: Task) => {
    haptic();
    actions.updateTask(t.id, { done: !t.done });
  };

  const row = (t: Task) => (
    <SwipeRow
      key={t.id}
      onSwipeRight={() => complete(t)}
      rightLabel={t.done ? 'Offen' : 'Erledigt'}
      actions={[
        ...(t.done ? [] : [{ label: 'Einplanen', color: 'var(--orange)', icon: <IconCalendar size={20} />, onClick: () => setPlan(t.id) }]),
        { label: 'Löschen', color: 'var(--red)', icon: <IconTrash size={20} />, onClick: () => actions.deleteTask(t.id) },
      ]}
    >
      <div className={`row c-${t.color}${t.done ? ' done' : ''}`}>
        <CheckCircle done={t.done} label={`${t.title} abhaken`} onTap={() => complete(t)} />
        <button type="button" className="row-main" onClick={() => onOpen({ kind: 'task', id: t.id, date: today })}>
          <span className="row-title"><span className="strike">{t.title}</span></span>
          {t.note && <span className="row-sub">{t.note.split('\n')[0]}</span>}
        </button>
        {!t.done && (
          <button type="button" className="icon-btn press" aria-label={`${t.title} einplanen`} onClick={() => setPlan(t.id)}>
            <IconCalendar size={21} />
          </button>
        )}
      </div>
    </SwipeRow>
  );

  return (
    <Page title="Eingang" subtitle={open.length ? `${open.length} ${open.length === 1 ? 'Aufgabe' : 'Aufgaben'} ohne Tag` : 'Alles eingeplant'}>
      <form className="group add-row" onSubmit={submit}>
        <span className="add-icon"><IconPlus size={20} /></span>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Neue Aufgabe" enterKeyHint="done" aria-label="Neue Aufgabe" />
      </form>

      {open.length === 0 ? (
        <Empty icon={<IconTray size={44} />} title="Eingang ist leer" text="Sammle hier Aufgaben ohne Tag und plane sie später mit einem Tipp ein." />
      ) : (
        <div className="group list">{open.map(row)}</div>
      )}

      {done.length > 0 && (
        <>
          <button type="button" className="disclosure" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
            Erledigt <span className="section-count">{done.length}</span>
            {showDone ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </button>
          {showDone && <div className="group list">{done.map(row)}</div>}
        </>
      )}

      <PlanSheet taskId={plan} onClose={() => setPlan(null)} />
    </Page>
  );
}

/** Aufgabe aus dem Eingang mit einem Tipp auf einen Tag (optional mit Uhrzeit) legen. */
function PlanSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { state, actions } = useStore();
  const today = useToday();
  const [time, setTime] = useState<number | null>(null);
  const [custom, setCustom] = useState(addDays(today, 3));
  const task = taskId ? state.tasks[taskId] : null;

  useEffect(() => {
    if (!taskId) return;
    setTime(null);
    setCustom(addDays(today, 3));
  }, [taskId, today]);

  const plan = (date: string) => {
    if (!taskId) return;
    actions.updateTask(taskId, { date, time });
    haptic();
    actions.toast(`Eingeplant: ${dayLabel(date, today)}`);
    onClose();
  };

  const nextMonday = addDays(today, 7 - weekday(today));
  const options = [
    { d: today, label: 'Heute', color: 'var(--blue)' },
    { d: addDays(today, 1), label: 'Morgen', color: 'var(--orange)' },
    { d: addDays(today, 2), label: 'Übermorgen', color: 'var(--teal)' },
    { d: nextMonday, label: 'Nächste Woche', color: 'var(--gray)' },
  ];

  return (
    <Sheet
      open={!!taskId}
      onClose={onClose}
      title="Einplanen"
      left={<button type="button" className="sheet-btn" onClick={onClose}>Abbrechen</button>}
    >
      {task && <p className="plan-title">{task.title}</p>}
      <div className="group">
        {options.map(o => (
          <button key={o.label} type="button" className="group-row" onClick={() => plan(o.d)}>
            <span className="round-icon" style={{ background: o.color }}><IconCalendar size={17} /></span>
            <span className="grow">{o.label}</span>
            <span className="row-detail">{fmtShortWd(o.d)}</span>
            <IconChevronRight size={16} className="chev" />
          </button>
        ))}
      </div>
      <div className="group"><TimeRow value={time} onChange={setTime} fallback={9 * 60} /></div>
      <div className="group-header">Anderer Tag</div>
      <div className="group">
        <label className="group-row">
          <span className="grow">Datum</span>
          <input type="date" className="field-input" value={custom} min={today} onChange={e => e.target.value && setCustom(e.target.value)} />
        </label>
        <button type="button" className="group-row action strong" onClick={() => plan(custom)}>
          Auf {fmtLong(custom)} legen
        </button>
      </div>
    </Sheet>
  );
}
