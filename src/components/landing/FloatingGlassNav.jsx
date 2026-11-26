import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpaceFlowMark } from '../Logo';

const NAV_TABS = [
  { id: 'hero-arch', label: 'The Space' },
  { id: 'door-entrance', label: 'Entrance' },
  { id: 'portal-login', label: 'Sign In' },
  { id: 'capabilities', label: 'Capabilities' },
];

export function FloatingGlassNav({ activeSection = 'hero-arch', onNavigateSection, session }) {
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabClick = (id) => {
    setMobileOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center px-4 sm:top-5 sm:px-6">
      <nav
        aria-label="Primary landing navigation"
        className="floating-glass-nav pointer-events-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4"
      >
        <button
          type="button"
          onClick={() => handleTabClick('hero-arch')}
          className="inline-flex min-h-[40px] items-center gap-2.5 rounded-full px-2 text-left transition-opacity hover:opacity-85"
          aria-label="SpaceFlow top"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-xs">
            <SpaceFlowMark className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-[-0.03em]" style={{ color: 'var(--sf-ink)' }}>
            Space<span style={{ color: 'var(--sf-sage)' }}>Flow</span>
          </span>
        </button>

        {/* Desktop floating glass tabs */}
        <div className="hidden items-center gap-1 rounded-full bg-black/[0.04] p-1 md:flex" role="tablist" aria-label="Page sections">
          {NAV_TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(tab.id)}
                className="relative min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  color: isActive ? 'var(--sf-surface)' : 'var(--sf-ink-muted)',
                }}
              >
                {isActive ? (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'floating-nav-pill'}
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'var(--sf-forest)',
                      boxShadow: '0 4px 12px -2px rgba(22, 43, 34, 0.28)',
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-[1]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action links */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/register-organization"
            className="min-h-[36px] rounded-full px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/60"
            style={{ color: 'var(--sf-ink)' }}
          >
            Register Org
          </Link>
          <Link
            to={session ? '/app/dashboard' : '/login'}
            className="forest-pill-button inline-flex min-h-[36px] items-center gap-1.5 px-4 py-1.5 text-xs"
          >
            <span>{session ? 'Dashboard' : 'Portal'}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/60 md:hidden"
          style={{ color: 'var(--sf-ink)' }}
        >
          {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile glass drawer */}
      {mobileOpen ? (
        <div className="floating-glass-nav pointer-events-auto mt-2.5 flex w-full max-w-4xl flex-col gap-1.5 rounded-3xl p-3 md:hidden">
          {NAV_TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className="flex min-h-[44px] items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: isActive ? 'var(--sf-forest)' : 'rgba(255,255,255,0.45)',
                  color: isActive ? 'var(--sf-surface)' : 'var(--sf-ink)',
                }}
              >
                <span>{tab.label}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </button>
            );
          })}
          <div className="mt-1 grid grid-cols-2 gap-2 border-t border-black/5 pt-2">
            <Link
              to="/register-organization"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center justify-center rounded-2xl bg-white/65 px-3 py-2 text-xs font-semibold"
              style={{ color: 'var(--sf-ink)' }}
            >
              Register Org
            </Link>
            <Link
              to={session ? '/app/dashboard' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="forest-pill-button flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs"
            >
              <span>{session ? 'Dashboard' : 'Portal'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
