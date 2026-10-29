import type { ReactNode } from 'react';

// Symbole im Stil von SF Symbols: runde Enden, gleichmäßige Strichstärke.

interface P {
  size?: number;
  className?: string;
}

function Svg({ size = 22, className, children, sw = 1.9, fill = 'none' }: P & { children: ReactNode; sw?: number; fill?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: P) => <Svg {...p} sw={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconPlus = (p: P) => <Svg {...p} sw={2.3}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMinus = (p: P) => <Svg {...p} sw={2.3}><path d="M5 12h14" /></Svg>;
export const IconChevronRight = (p: P) => <Svg {...p} sw={2.2}><path d="M9.5 5.5L16 12l-6.5 6.5" /></Svg>;
export const IconChevronDown = (p: P) => <Svg {...p} sw={2.2}><path d="M5.5 9.5L12 16l6.5-6.5" /></Svg>;
export const IconXmark = (p: P) => <Svg {...p} sw={2.2}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></Svg>;

export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" />
    <path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4" />
    <rect x="7" y="12.5" width="3.5" height="3.5" rx=".8" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconTray = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 13.5L6.2 6a2 2 0 0 1 1.9-1.4h7.8A2 2 0 0 1 17.8 6l2.7 7.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18z" />
    <path d="M3.5 13.5H8l1.4 2.5h5.2l1.4-2.5h4.5" />
  </Svg>
);

export const IconRepeat = (p: P) => (
  <Svg {...p}>
    <path d="M16.5 3l3 3-3 3" />
    <path d="M4.5 11.5V10a4 4 0 0 1 4-4h11" />
    <path d="M7.5 21l-3-3 3-3" />
    <path d="M19.5 12.5V14a4 4 0 0 1-4 4h-11" />
  </Svg>
);

export const IconChart = (p: P) => (
  <Svg {...p} sw={2.4}>
    <path d="M5.5 20v-6M12 20V5M18.5 20v-9.5" />
  </Svg>
);

export const IconEllipsis = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.6M10 10.5v6M14 10.5v6" />
  </Svg>
);

export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} sw={1.8} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
  </Svg>
);

export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Svg>
);

export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M8.5 10.5H7a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2h-1.5" />
  </Svg>
);

export const IconImport = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v11M8 10.5l4 4 4-4" />
    <path d="M5 15.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" />
  </Svg>
);

export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeSlash = (p: P) => (
  <Svg {...p}>
    <path d="M9.9 5.8A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.5 7.6A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
  </Svg>
);

export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const IconFlame = (p: P) => (
  <Svg {...p}>
    <path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4-3-6-4-9.5-2 1.5-3 3.5-3 5.5-1-.5-1.8-1.6-2-3C7.6 9.2 5.5 11.5 5.5 14.5A6.5 6.5 0 0 0 12 21z" />
  </Svg>
);

export const IconCircleHalf = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r=".6" fill="currentColor" />
  </Svg>
);

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

export const IconChevronLeft = (p: P) => <Svg {...p} sw={2.2}><path d="M14.5 5.5L8 12l6.5 6.5" /></Svg>;

export const IconStack = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="9" width="16" height="11" rx="2.5" />
    <path d="M6.5 6h11M9 3h6" />
  </Svg>
);

export const IconPencil = (p: P) => (
  <Svg {...p}>
    <path d="M15.5 4.5l4 4L9 19H5v-4z" />
    <path d="M13 7l4 4" />
  </Svg>
);

export const IconNote = (p: P) => (
  <Svg {...p}>
    <path d="M6 3.5h8.5l4 4V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z" />
    <path d="M8 11h8M8 15h6" />
  </Svg>
);
