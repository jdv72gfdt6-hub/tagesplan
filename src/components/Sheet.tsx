import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Abstand der Bildschirmtastatur zum unteren Rand, damit das Sheet darüber bleibt. */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);
  return inset;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, left, right, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  const start = useRef<number | null>(null);
  const kb = useKeyboardInset(mounted);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => (r2 = requestAnimationFrame(() => setShown(true))));
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 380);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`sheet-root${shown ? ' shown' : ''}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          ['--kb' as string]: `${kb}px`,
          ...(dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : null),
        }}
      >
        <div
          className="sheet-head"
          onPointerDown={e => {
            if ((e.target as Element).closest('button')) return;
            start.current = e.clientY;
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => start.current != null && setDragY(Math.max(0, e.clientY - start.current))}
          onPointerUp={() => {
            if (start.current == null) return;
            start.current = null;
            if (dragY > 90) onClose();
            setDragY(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragY(0);
          }}
        >
          <div className="grabber" />
          <div className="sheet-bar">
            <div>{left}</div>
            <div className="sheet-title">{title}</div>
            <div className="sheet-right">{right}</div>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
