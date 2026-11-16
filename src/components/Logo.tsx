export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="/" aria-label="SolarWorks Uganda home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" role="img">
          <path d="M9 24.5 20.8 5 33 24.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M12 24.5h18.5v11H12z" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M21.2 25v10M13 30h16" stroke="currentColor" strokeWidth="2" />
          <path d="M5.5 36h31" stroke="#ef8a3b" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-type">
        <strong>SolarWorks</strong>
        {!compact && <span>UGANDA</span>}
      </span>
    </a>
  );
}
