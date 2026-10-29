import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { MIN_BLOCK, layoutBlocks, type Block, type DayItem } from '../lib/day';
import { fmtTime, nowMinutes, pad } from '../lib/dates';
import { haptic } from '../lib/haptics';
import { CheckCircle } from './CheckCircle';

/** Pixel pro Minute (eine Stunde = 60 px). */
export const PX = 1;
const SNAP = 15;
const TOP = 12;
const GUTTER = 52;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Props {
  items: DayItem[];
  isToday: boolean;
  onTapEmpty: (minutes: number) => void;
  onOpen: (item: DayItem) => void;
  onTap: (item: DayItem) => void;
  onLongPress: (item: DayItem) => void;
  onChange: (item: DayItem, time: number, duration: number) => void;
}

interface Drag {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  origTime: number;
  origDur: number;
  time: number;
  dur: number;
  active: boolean;
  timer: number;
}

/** Zeitleiste 0–24 Uhr wie im Kalender, mit Verschieben (lange drücken) und Dauer ändern (unterer Rand). */
export const Timeline = forwardRef<HTMLDivElement, Props>(function Timeline(
  { items, isToday, onTapEmpty, onOpen, onTap, onLongPress, onChange },
  ref,
) {
  const [now, setNow] = useState(nowMinutes);
  const blocks = useMemo(() => layoutBlocks(items), [items]);
  const drag = useRef<Drag | null>(null);
  const [view, setView] = useState<{ id: string; time: number; dur: number } | null>(null);
  const suppressClick = useRef(false);
  const latest = useRef({ items, onChange });
  latest.current = { items, onChange };

  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes()), 20000);
    return () => clearInterval(t);
  }, []);

  // Während des Ziehens darf die Seite nicht scrollen (iOS braucht dafür einen nicht-passiven Listener)
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (drag.current?.active) e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  const end = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    if (!d) return;
    clearTimeout(d.timer);
    if (!d.active) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 80);
    document.body.classList.remove('dragging');
    setView(null);
    const item = latest.current.items.find(i => i.id === d.id);
    if (commit && item && (d.time !== d.origTime || d.dur !== d.origDur)) latest.current.onChange(item, d.time, d.dur);
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      // Bewegung vor dem langen Drücken = normales Scrollen
      if (Math.abs(dy) > 8 || Math.abs(e.clientX - d.startX) > 8) end(false);
      return;
    }
    if (d.mode === 'move') d.time = clamp(Math.round((d.origTime + dy / PX) / SNAP) * SNAP, 0, 1440 - d.dur);
    else d.dur = clamp(Math.round((d.origDur + dy / PX) / SNAP) * SNAP, SNAP, 1440 - d.time);
    setView(v => (v && v.time === d.time && v.dur === d.dur ? v : { id: d.id, time: d.time, dur: d.dur }));
  };
  const up = () => end(true);
  const cancel = () => end(false);

  const down = (e: React.PointerEvent, b: Block, mode: Drag['mode']) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (mode === 'resize') e.stopPropagation();
    end(false);
    const d: Drag = {
      id: b.item.id, mode, startX: e.clientX, startY: e.clientY,
      origTime: b.start, origDur: b.item.duration, time: b.start, dur: b.item.duration,
      active: false, timer: 0,
    };
    const activate = () => {
      d.active = true;
      haptic();
      document.body.classList.add('dragging');
      setView({ id: d.id, time: d.time, dur: d.dur });
    };
    if (mode === 'resize') activate();
    else d.timer = window.setTimeout(activate, 380);
    drag.current = d;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };

  const tapEmpty = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.tl-block')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const min = Math.floor((e.clientY - rect.top - TOP) / PX / SNAP) * SNAP;
    onTapEmpty(clamp(min, 0, 1440 - SNAP));
  };

  return (
    <div className="timeline" ref={ref} style={{ height: 1440 * PX + TOP * 2 }} onClick={tapEmpty}>
      {Array.from({ length: 25 }, (_, h) => (
        <div key={h} className="tl-hour" style={{ top: TOP + h * 60 * PX }}>
          {!(isToday && Math.abs(now - h * 60) < 13) && <span>{pad(h % 24 === 0 && h ? 0 : h)}:00</span>}
        </div>
      ))}
      {isToday && (
        <div className="tl-now" style={{ top: TOP + now * PX }} aria-label={`Jetzt ${fmtTime(now)}`}>
          <span>{fmtTime(now)}</span>
        </div>
      )}
      {blocks.map(b => {
        const it = b.item;
        const v = view?.id === it.id ? view : null;
        const time = v ? v.time : b.start;
        const dur = v ? v.dur : it.duration;
        const h = Math.max(dur, MIN_BLOCK) * PX - 2;
        const count = it.goal > 1 ? `${it.value}/${it.goal}${it.unit ? ' ' + it.unit : ''}` : '';
        const range = `${fmtTime(time)}–${fmtTime(time + dur)}`;
        const tall = h >= 40;
        return (
          <div
            key={it.kind + it.id}
            className={`tl-block c-${it.color}${it.done ? ' done' : ''}${v ? ' dragging' : ''}${tall ? '' : ' short'}`}
            data-noswipe
            style={{
              top: TOP + time * PX + 1,
              height: h,
              left: `calc(${GUTTER}px + (100% - ${GUTTER + 6}px) * ${b.col / b.cols})`,
              width: `calc((100% - ${GUTTER + 6}px) / ${b.cols} - 2px)`,
            }}
            onPointerDown={e => down(e, b, 'move')}
            onContextMenu={e => e.preventDefault()}
            onClick={e => {
              e.stopPropagation();
              if (!suppressClick.current) onOpen(it);
            }}
            role="button"
            aria-label={`${it.title}, ${range}${it.done ? ', erledigt' : ''}`}
          >
            <CheckCircle
              done={it.done} value={it.value} goal={it.goal}
              label={it.goal > 1 ? `${it.title}: eins mehr` : `${it.title} abhaken`}
              onTap={() => onTap(it)}
              onLongPress={it.goal > 1 ? () => onLongPress(it) : undefined}
            />
            <div className="tl-text">
              <div className="tl-title">
                <span className="strike">{it.title}</span>
                {!tall && count && <span className="tl-count"> {count}</span>}
              </div>
              {tall && (
                <div className="tl-sub">
                  {count ? `${count} · ` : ''}
                  {range}
                </div>
              )}
            </div>
            <div className="tl-resize" onPointerDown={e => down(e, b, 'resize')} onClick={e => e.stopPropagation()} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
});
