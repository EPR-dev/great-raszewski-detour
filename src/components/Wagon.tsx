export function Wagon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 110"
      role="img"
      aria-label="A small station wagon with a roof rack"
    >
      <rect x="18" y="48" width="168" height="36" rx="10" fill="#1f6e68" />
      <path d="M48 48 72 24h78l22 24" fill="#144e4a" />
      <rect x="78" y="28" width="34" height="18" rx="3" fill="#f4ecdc" />
      <rect x="118" y="28" width="32" height="18" rx="3" fill="#f4ecdc" />
      <rect x="168" y="52" width="16" height="22" rx="3" fill="#9d3b32" />
      <circle cx="64" cy="86" r="14" fill="#2a211c" />
      <circle cx="64" cy="86" r="6" fill="#e2a51a" />
      <circle cx="158" cy="86" r="14" fill="#2a211c" />
      <circle cx="158" cy="86" r="6" fill="#e2a51a" />
      <rect x="86" y="14" width="46" height="8" rx="2" fill="#9d3b32" />
      <path d="M92 14c8-10 28-10 36 0" fill="none" stroke="#e2a51a" strokeWidth="4" />
    </svg>
  );
}
