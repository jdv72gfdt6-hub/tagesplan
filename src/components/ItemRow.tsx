import type { DayItem } from '../lib/day';
import { addDays, fmtShort, fmtTime } from '../lib/dates';
import { CheckCircle } from './CheckCircle';
import { IconArrowRight, IconTrash } from './Icons';
import { SwipeRow } from './SwipeRow';

export function carriedLabel(from: string, date: string) {
  return from === addDays(date, -1) ? 'von gestern' : `vom ${fmtShort(from)}`;
}

interface Props {
  item: DayItem;
  date: string;
  onTap: () => void;
  onLongPress: () => void;
  onOpen: () => void;
  onTomorrow?: () => void;
  onDelete?: () => void;
}

/** Listenzeile mit Abhak-Kreis, Wischgesten und – bei Zähl-Gewohnheiten – Fortschrittsbalken. */
export function ItemRow({ item: it, date, onTap, onLongPress, onOpen, onTomorrow, onDelete }: Props) {
  const sub = [
    it.time != null ? fmtTime(it.time) : null,
    it.goal > 1 ? `${it.value}/${it.goal}${it.unit ? ' ' + it.unit : ''}` : null,
    it.carriedFrom ? carriedLabel(it.carriedFrom, date) : null,
    it.note ? it.note.split('\n')[0] : null,
  ].filter(Boolean);

  const actions = [
    ...(onTomorrow ? [{ label: 'Morgen', color: 'var(--orange)', icon: <IconArrowRight size={20} />, onClick: onTomorrow }] : []),
    ...(onDelete ? [{ label: 'Löschen', color: 'var(--red)', icon: <IconTrash size={20} />, onClick: onDelete }] : []),
  ];

  return (
    <SwipeRow onSwipeRight={onTap} rightLabel={it.done && it.goal === 1 ? 'Offen' : it.goal > 1 ? '+1' : 'Erledigt'} actions={actions}>
      <div className={`row c-${it.color}${it.done ? ' done' : ''}`}>
        <CheckCircle
          done={it.done} value={it.value} goal={it.goal}
          label={it.goal > 1 ? `${it.title}: eins mehr` : `${it.title} abhaken`}
          onTap={onTap} onLongPress={it.goal > 1 ? onLongPress : undefined}
        />
        <button type="button" className="row-main" onClick={onOpen}>
          <span className="row-title"><span className="strike">{it.title}</span></span>
          {sub.length > 0 && <span className={`row-sub${it.carriedFrom ? ' carried' : ''}`}>{sub.join(' · ')}</span>}
          {it.goal > 1 && (
            <span className="bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (it.value / it.goal) * 100)}%` }} />
            </span>
          )}
        </button>
      </div>
    </SwipeRow>
  );
}
