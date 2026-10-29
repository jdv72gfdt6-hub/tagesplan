import { useEffect, useMemo, useState } from 'react';
import { dayLabel, fmtTime, useToday } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { parseLine } from '../lib/parse';
import { useStore } from '../lib/store';
import type { ColorName, Routine } from '../lib/types';
import { ColorField } from '../components/Fields';
import { IconChevronLeft, IconPencil, IconPlus, IconStack, IconTrash } from '../components/Icons';
import { Sheet } from '../components/Sheet';

const SAMPLE = {
  name: 'Morgenroutine',
  lines: 'Wasser trinken 7:00 5min\nMeditation 7:05 10min\nDehnen 7:15 15min\nTag planen 7:30 15min',
};

const parseAll = (lines: string, date: string) =>
  lines.split('\n').map(l => l.trim()).filter(Boolean).map(l => parseLine(l, date, 'task'));

function summary(r: Routine, date: string) {
  const ps = parseAll(r.lines, date);
  const times = ps.flatMap(p => (p.time != null ? [[p.time, p.time + (p.duration ?? 15)]] : []));
  const range = times.length
    ? ` · ${fmtTime(Math.min(...times.map(t => t[0])))}–${fmtTime(Math.max(...times.map(t => t[1])))}`
    : '';
  return `${ps.length} ${ps.length === 1 ? 'Eintrag' : 'Einträge'}${range}`;
}

/** Routinen als Vorlagen: antippen fügt sie in `date` ein, Stift öffnet den Editor. */
export function RoutinesSheet({ open, date, onClose }: { open: boolean; date: string; onClose: () => void }) {
  const { state, actions } = useStore();
  const today = useToday();
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [lines, setLines] = useState('');
  const [color, setColor] = useState<ColorName>('teal');

  useEffect(() => {
    if (open) setEdit(null);
  }, [open]);

  const routines = Object.values(state.routines).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const parsed = useMemo(() => parseAll(lines, date), [lines, date]);

  const startEdit = (r?: Routine) => {
    setEdit(r ? r.id : 'new');
    setName(r?.name ?? '');
    setLines(r?.lines ?? '');
    setColor(r?.color ?? 'teal');
  };

  const save = () => {
    if (!name.trim() || !parsed.length) return;
    actions.saveRoutine({ id: edit === 'new' ? undefined : edit!, name: name.trim(), lines: lines.trim(), color });
    haptic();
    setEdit(null);
  };

  const insert = (r: Routine) => {
    const n = actions.insertRoutine(r.id, date);
    haptic();
    actions.toast(`${r.name}: ${n} ${n === 1 ? 'Eintrag' : 'Einträge'} eingefügt`);
    onClose();
  };

  if (edit) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title={edit === 'new' ? 'Neue Routine' : 'Routine'}
        left={
          <button type="button" className="sheet-btn icon-label" onClick={() => setEdit(null)}>
            <IconChevronLeft size={18} /> Zurück
          </button>
        }
        right={
          <button type="button" className="sheet-btn strong" disabled={!name.trim() || !parsed.length} onClick={save}>
            Sichern
          </button>
        }
      >
        <div className="group">
          <div className="group-row">
            <input className="title-input" value={name} onChange={e => setName(e.target.value)} placeholder="Name, z. B. Morgenroutine" aria-label="Name" />
          </div>
          <div className="group-row">
            <textarea
              className="note-input routine-lines"
              rows={Math.min(8, Math.max(4, lines.split('\n').length + 1))}
              value={lines}
              onChange={e => setLines(e.target.value)}
              placeholder={SAMPLE.lines}
              aria-label="Einträge, eine Zeile pro Eintrag"
            />
          </div>
        </div>
        {parsed.length > 0 ? (
          <div className="preview">
            {parsed.map((p, i) => (
              <div className="preview-line" key={i}>
                <span className="preview-title">{p.title}</span>
                {p.time != null && <span className="pchip">{fmtTime(p.time)}</span>}
                <span className="pchip">{p.duration ?? 15} Min.</span>
                {p.top3 && <span className="pchip">Top 3</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">Eine Zeile pro Eintrag, mit Uhrzeit und Dauer wie bei der Schnellerfassung.</p>
        )}
        <div className="group-header">Farbe</div>
        <div className="group pad"><ColorField value={color} onChange={setColor} /></div>
        {edit !== 'new' && (
          <div className="group">
            <button
              type="button" className="group-row action danger"
              onClick={() => {
                if (!confirm(`Routine „${name}“ löschen?`)) return;
                actions.deleteRoutine(edit);
                setEdit(null);
              }}
            >
              <IconTrash size={20} /> Routine löschen
            </button>
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Routinen"
      right={<button type="button" className="sheet-btn strong" onClick={onClose}>Fertig</button>}
    >
      {routines.length > 0 && (
        <>
          <p className="hint">Antippen fügt alle Einträge in „{dayLabel(date, today)}“ ein.</p>
          <div className="group list-icons">
            {routines.map(r => (
              <div key={r.id} className="group-row routine-row">
                <button type="button" className="routine-main" onClick={() => insert(r)} aria-label={`${r.name} in ${dayLabel(date, today)} einfügen`}>
                  <span className={`round-icon c-${r.color}`} style={{ background: 'var(--c)' }}><IconStack size={17} /></span>
                  <span className="grow">
                    {r.name}
                    <span className="row-sub">{summary(r, date)}</span>
                  </span>
                </button>
                <button type="button" className="icon-btn press" onClick={() => startEdit(r)} aria-label={`${r.name} bearbeiten`}>
                  <IconPencil size={20} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {routines.length === 0 && (
        <p className="hint">
          Routinen sind Vorlagen mit mehreren Einträgen, zum Beispiel eine Morgenroutine. Mit einem Tipp landen sie in deinem Tag.
        </p>
      )}
      <div className="group">
        <button type="button" className="group-row action" onClick={() => startEdit()}>
          <IconPlus size={20} /> Neue Routine
        </button>
        {routines.length === 0 && (
          <button
            type="button" className="group-row action"
            onClick={() => {
              actions.saveRoutine({ ...SAMPLE, color: 'teal' });
              haptic();
            }}
          >
            <IconStack size={20} /> Beispiel „Morgenroutine“ anlegen
          </button>
        )}
      </div>
    </Sheet>
  );
}
