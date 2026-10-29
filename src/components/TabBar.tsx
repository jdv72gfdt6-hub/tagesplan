import type { ComponentType } from 'react';
import { IconCalendar, IconChart, IconEllipsis, IconRepeat, IconTray } from './Icons';

export type Tab = 'heute' | 'eingang' | 'gewohnheiten' | 'rueckblick' | 'mehr';

export const TABS: { id: Tab; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'heute', label: 'Heute', Icon: IconCalendar },
  { id: 'eingang', label: 'Eingang', Icon: IconTray },
  { id: 'gewohnheiten', label: 'Gewohnheiten', Icon: IconRepeat },
  { id: 'rueckblick', label: 'Rückblick', Icon: IconChart },
  { id: 'mehr', label: 'Mehr', Icon: IconEllipsis },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar glass" aria-label="Bereiche">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id} type="button" className={`tab${tab === id ? ' on' : ''}`}
          aria-current={tab === id ? 'page' : undefined} onClick={() => onChange(id)}
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
