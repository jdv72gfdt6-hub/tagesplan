import { useEffect, useState, type ReactNode } from 'react';

function useScrolled(threshold = 36) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [threshold]);
  return scrolled;
}

/** Seite mit großem Titel, der beim Scrollen klein in die Glas-Leiste wandert. */
export function Page({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  const scrolled = useScrolled();
  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <div />
          <div className="nav-title" aria-hidden={!scrolled}>{title}</div>
          <div className="nav-right">{right}</div>
        </div>
      </header>
      <main className="page">
        <div className={`large-title${scrolled ? ' hidden' : ''}`}>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </main>
    </>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
