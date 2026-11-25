const statusStyles = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  maintenance: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  unavailable: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  rejected: 'bg-red-50 text-red-700 ring-red-600/15',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

export function Badge({ children, tone = 'sage', className = '' }) {
  const tones = {
    sage: 'bg-sage-100 text-sage-700 ring-sage-600/15',
    blue: 'bg-sage-100 text-sage-700 ring-sage-600/15',
    navy: 'bg-sage-800 text-white ring-sage-800/10',
    neutral: 'bg-mist-100 text-ink-600 ring-slate-500/10',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone] || tones.sage} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || 'unknown').toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[normalized] || statusStyles.unavailable}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}
