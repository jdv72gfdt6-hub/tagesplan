import { useRef, useState, type ReactNode } from 'react';
import { haptic } from '../lib/haptics';
import { IconCheck } from './Icons';

export interface SwipeAction {
  label: string;
  color: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface Props {
  children: ReactNode;
  /** Nach rechts wischen: erledigt */
  onSwipeRight?: () => void;
  rightLabel?: string;
  /** Nach links wischen: Aktionen wie Verschieben oder Löschen */
  actions?: SwipeAction[];
}

const ACTION_W = 78;

export function SwipeRow({ children, onSwipeRight, rightLabel = 'Erledigt', actions = [] }: Props) {
  const [x, setX] = useState(0);
  const [moving, setMoving] = useState(false);
  const g = useRef<{ x0: number; y0: number; base: number; lock: 'h' | 'v' | null } | null>(null);
  const width = actions.length * ACTION_W;
  const clickGuard = useRef(false);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    g.current = { x0: e.clientX, y0: e.clientY, base: x, lock: null };
  };
  const move = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (!s.lock) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        s.lock = 'h';
        setMoving(true);
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > 10) s.lock = 'v';
    }
    if (s.lock === 'h') {
      const max = onSwipeRight ? 160 : 0;
      setX(Math.min(max, Math.max(-width - 30, s.base + dx)));
    }
  };
  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s || s.lock !== 'h') return;
    setMoving(false);
    clickGuard.current = true;
    setTimeout(() => (clickGuard.current = false), 60);
    if (x > 80 && onSwipeRight) {
      haptic();
      onSwipeRight();
      setX(0);
    } else if (actions.length && x < -width / 2) setX(-width);
    else setX(0);
  };

  return (
    <div className="swipe" data-noswipe>
      {onSwipeRight && (
        <div className="swipe-done" style={{ opacity: x > 0 ? 1 : 0 }}>
          <IconCheck size={20} />
          <span>{rightLabel}</span>
        </div>
      )}
      {actions.length > 0 && (
        <div className="swipe-actions" style={{ opacity: x < 0 ? 1 : 0, width }}>
          {actions.map(a => (
            <button
              key={a.label}
              style={{ background: a.color }}
              onClick={() => {
                setX(0);
                a.onClick();
              }}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <div
        className={`swipe-content${moving ? ' moving' : ''}`}
        style={{ transform: x ? `translateX(${x}px)` : undefined }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          g.current = null;
          setMoving(false);
          setX(0);
        }}
        onClickCapture={e => {
          if (clickGuard.current) e.stopPropagation();
          else if (x !== 0) {
            e.stopPropagation();
            setX(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
