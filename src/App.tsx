import { useCallback, useEffect, useRef, useState } from 'react';
import { daysBetween, useToday } from './lib/dates';
import { useStore } from './lib/store';
import type { AddDefaults, DetailTarget } from './nav';
import { IconPlus } from './components/Icons';
import { TABS, TabBar, type Tab } from './components/TabBar';
import { Toast } from './components/Toast';
import { AddSheet } from './sheets/AddSheet';
import { DetailSheet } from './sheets/DetailSheet';
import { HabitsView } from './views/Habits';
import { InboxView } from './views/Inbox';
import { MoreView } from './views/More';
import { ReviewView } from './views/Review';
import { TodayView } from './views/Today';

const readTab = (): Tab => {
  const h = location.hash.replace(/^#\/?/, '');
  return TABS.some(t => t.id === h) ? (h as Tab) : 'heute';
};

function useHashTab() {
  const [tab, setTab] = useState(readTab);
  useEffect(() => {
    const update = () => setTab(readTab());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const go = useCallback((t: Tab) => {
    if (t === readTab()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo(0, 0);
    location.hash = '/' + t;
  }, []);
  return [tab, go] as const;
}

export function App() {
  const { state, actions } = useStore();
  const today = useToday();
  const [tab, go] = useHashTab();
  const [date, setDateRaw] = useState(today);
  const [dir, setDir] = useState(0);
  const [add, setAdd] = useState<AddDefaults | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const prevToday = useRef(today);

  const setDate = (d: string) => {
    setDir(Math.sign(daysBetween(date, d)));
    setDateRaw(d);
  };

  // Nach Mitternacht mit „Heute“ mitwandern
  useEffect(() => {
    if (prevToday.current === today) return;
    setDateRaw(d => (d === prevToday.current ? today : d));
    prevToday.current = today;
  }, [today]);

  useEffect(() => {
    if (state.loaded) actions.carryOver(today);
  }, [state.loaded, today, state.settings.carryOver, actions]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);

  const fab = (): AddDefaults =>
    tab === 'eingang' ? { kind: 'task', date: null, time: null }
    : tab === 'gewohnheiten' ? { kind: 'habit', date: today, time: null }
    : { kind: 'task', date: tab === 'heute' ? date : today, time: null };

  return (
    <>
      {tab === 'heute' && <TodayView date={date} today={today} dir={dir} setDate={setDate} onAdd={setAdd} onOpen={setDetail} />}
      {tab === 'eingang' && <InboxView onOpen={setDetail} />}
      {tab === 'gewohnheiten' && <HabitsView onOpen={setDetail} />}
      {tab === 'rueckblick' && <ReviewView />}
      {tab === 'mehr' && <MoreView />}

      {(tab === 'heute' || tab === 'eingang' || tab === 'gewohnheiten') && (
        <button type="button" className="fab glass" onClick={() => setAdd(fab())} aria-label="Neuer Eintrag">
          <IconPlus size={28} />
        </button>
      )}
      <TabBar tab={tab} onChange={go} />

      <AddSheet defaults={add} onClose={() => setAdd(null)} />
      <DetailSheet target={detail} onClose={() => setDetail(null)} />
      <Toast />
    </>
  );
}
