import { useState } from 'react';
import { streak } from '../lib/day';
import { daysLabel, fmtTime, useToday } from '../lib/dates';
import { useStore } from '../lib/store';
import type { Habit } from '../lib/types';
import type { DetailTarget } from '../nav';
import { IconChevronDown, IconChevronRight, IconRepeat } from '../components/Icons';
import { Empty, Page } from '../components/Page';

export const habitSummary = (h: Habit) =>
  [
    daysLabel(h.days),
    h.time != null ? fmtTime(h.time) : null,
    h.goal > 1 ? `Ziel ${h.goal}${h.unit ? ' ' + h.unit : '×'}` : null,
  ].filter(Boolean).join(' · ');

export function HabitsView({ onOpen }: { onOpen: (t: DetailTarget) => void }) {
  const { state } = useStore();
  const today = useToday();
  const [showArchived, setShowArchived] = useState(false);
  const all = Object.values(state.habits).sort(
    (a, b) => (a.time ?? -1) - (b.time ?? -1) || a.title.localeCompare(b.title, 'de'),
  );
  const active = all.filter(h => !h.archived);
  const archived = all.filter(h => h.archived);

  const row = (h: Habit) => {
    const st = streak(h, state.progress, today);
    return (
      <button key={h.id} type="button" className="group-row link-row" onClick={() => onOpen({ kind: 'habit', id: h.id, date: today })}>
        <span className={`round-icon c-${h.color}`} style={{ background: 'var(--c)' }}><IconRepeat size={17} /></span>
        <span className="grow">
          {h.title}
          <span className="row-sub">{habitSummary(h)}</span>
        </span>
        <span className="row-detail" aria-label={`${st} Tage am Stück`}>{st}</span>
        <IconChevronRight size={16} className="chev" />
      </button>
    );
  };

  return (
    <Page title="Gewohnheiten" subtitle={active.length ? `${active.length} aktiv` : undefined}>
      {active.length === 0 ? (
        <Empty
          icon={<IconRepeat size={44} />}
          title="Noch keine Gewohnheiten"
          text="Tippe auf „+“ und schreibe zum Beispiel „Wasser 3x täglich“ oder „Kreatin 8:00 täglich“."
        />
      ) : (
        <>
          <div className="group list-icons">{active.map(row)}</div>
          <p className="hint">Die Zahl rechts zeigt, wie viele geplante Tage am Stück erfüllt sind.</p>
        </>
      )}
      {archived.length > 0 && (
        <>
          <button type="button" className="disclosure" onClick={() => setShowArchived(!showArchived)} aria-expanded={showArchived}>
            Archiviert <span className="section-count">{archived.length}</span>
            {showArchived ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </button>
          {showArchived && <div className="group list-icons">{archived.map(row)}</div>}
        </>
      )}
    </Page>
  );
}
