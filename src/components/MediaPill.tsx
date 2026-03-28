'use client';

interface MediaPillProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

export default function MediaPill({ label, href, onClick }: MediaPillProps) {
  const baseClass =
    'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-[var(--color-border-gold)] bg-[var(--color-gold-dim)] text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all cursor-pointer';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        {label}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {label}
    </button>
  );
}
