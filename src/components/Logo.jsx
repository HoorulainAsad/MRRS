import { Link } from 'react-router-dom';

export function SpaceFlowMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`spaceflow-dot-mark ${className}`}
      aria-hidden="true"
    >
      <circle className="spaceflow-dot spaceflow-dot-sage" cx="7" cy="7" r="3.5" fill="#8A9A86" />
      <circle className="spaceflow-dot spaceflow-dot-second" cx="21" cy="7" r="3.5" fill="#C9BDAA" />
      <circle className="spaceflow-dot spaceflow-dot-third" cx="21" cy="21" r="3.5" fill="#7D8B81" />
      <circle className="spaceflow-dot spaceflow-dot-fourth" cx="7" cy="21" r="3.5" fill="#D5D0C7" />
    </svg>
  );
}

export function Logo({ compact = false, light = false, to = '/app/dashboard', className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 w-fit items-center gap-3 rounded-xl ${className}`}
      aria-label={to === '/' || to === '/login' ? 'SpaceFlow home' : 'SpaceFlow dashboard'}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        <SpaceFlowMark className="h-7 w-7" />
      </span>
      {!compact ? (
        <span className={`text-lg font-semibold tracking-[-0.03em] ${light ? 'text-ink-900' : 'text-white'}`}>
          Space<span className={light ? 'text-sage-600' : 'text-sage-200'}>Flow</span>
        </span>
      ) : null}
    </Link>
  );
}
