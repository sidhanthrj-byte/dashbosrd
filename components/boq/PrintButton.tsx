'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
        color: 'white',
        border: 'none',
        padding: '13px 28px',
        borderRadius: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 700,
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: '0 4px 28px rgba(79,70,229,0.45)',
        zIndex: 100,
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Save PDF
    </button>
  );
}
