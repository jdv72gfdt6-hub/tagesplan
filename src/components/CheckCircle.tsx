import { useRef } from 'react';

interface Props {
  done: boolean;
  value?: number;
  goal?: number;
  label: string;
  onTap: () => void;
  /** Gedrückt halten, z. B. Zähler um eins zurück */
  onLongPress?: () => void;
  className?: string;
}

const R = 10.5;
const C = 2 * Math.PI * R;

/** Runder Abhak-Kreis wie in „Erinnerungen“; bei Zähl-Gewohnheiten mit Fortschrittsbogen. */
export function CheckCircle({ done, value = 0, goal = 1, label, onTap, onLongPress, className = '' }: Props) {
  const timer = useRef(0);
  const fired = useRef(false);
  const pct = goal > 1 ? Math.min(1, value / goal) : 0;
  const clear = () => clearTimeout(timer.current);

  return (
    <button
      type="button"
      className={`check${done ? ' on' : ''} ${className}`}
      aria-label={label}
      aria-pressed={done}
      onPointerDown={e => {
        e.stopPropagation();
        fired.current = false;
        if (onLongPress) {
          timer.current = window.setTimeout(() => {
            fired.current = true;
            onLongPress();
          }, 450);
        }
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={e => e.preventDefault()}
      onClick={e => {
        e.stopPropagation();
        if (!fired.current) onTap();
      }}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <circle cx="12" cy="12" r={R} className="check-ring" />
        {pct > 0 && !done && (
          <circle
            cx="12" cy="12" r={R} className="check-arc"
            strokeDasharray={`${pct * C} ${C}`} transform="rotate(-90 12 12)"
          />
        )}
        <g className="check-done">
          <circle cx="12" cy="12" r="11.2" className="check-fill" />
          <path d="M7.4 12.4l3.1 3.1 6.1-6.6" className="check-mark" />
        </g>
      </svg>
    </button>
  );
}
