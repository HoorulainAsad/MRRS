import { Link } from 'react-router-dom';
import { SpaceFlowMark } from '../Logo';

export function LandingFooter({ onNavigateSection }) {
  const scrollTo = (id) => {
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="border-t"
      style={{
        background: 'var(--sf-forest)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        color: 'var(--sf-canvas)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <SpaceFlowMark className="h-6 w-6" />
              </span>
              <span className="text-lg font-semibold tracking-[-0.03em] text-white">
                Space<span style={{ color: 'var(--sf-brass)' }}>Flow</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
              Shared workspace reservation and meeting room scheduling for organizations and their authorized local
              administrators.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Experience</h3>
            <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 text-sm">
              {[
                { id: 'hero-arch', label: 'The Space' },
                { id: 'door-entrance', label: 'Architectural Entrance' },
                { id: 'portal-login', label: 'Sign In Portal' },
                { id: 'capabilities', label: 'Capabilities' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className="bg-transparent p-0 text-left text-white/80 transition-colors hover:text-white"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Access</h3>
            <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 text-sm">
              <li>
                <Link to="/login" className="text-white/80 transition-colors hover:text-white">
                  Sign in to workspace
                </Link>
              </li>
              <li>
                <Link to="/register-organization" className="text-white/80 transition-colors hover:text-white">
                  Organization registration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs text-white/60 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
        >
          <p className="m-0">SpaceFlow · Shared Workspace &amp; Meeting Room Scheduling</p>
          <p className="m-0">Organization-managed resources and role-scoped approvals</p>
        </div>
      </div>
    </footer>
  );
}
