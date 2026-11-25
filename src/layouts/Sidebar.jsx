import { useState } from 'react';
import { LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useSession } from '../hooks/useSession';
import { getAccessibleRoutes, getPrimaryRole, NAV_SECTIONS } from '../routes/registry';

const sections = NAV_SECTIONS.filter((s) => s !== 'Account');

function NavItem({ route, collapsed, onClick }) {
  const Icon = route.icon;
  return (
    <li>
      <NavLink
        to={route.path}
        onClick={onClick}
        title={collapsed ? route.label : undefined}
        className={({ isActive }) =>
          `group flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${
            collapsed ? 'h-11 w-11 justify-center mx-auto' : 'gap-3 px-3 py-2.5 w-full'
          } ${
            isActive
              ? 'bg-[#E8EEE4] text-[#203D30] font-semibold'
              : 'text-[#9aafc0] hover:bg-white/10 hover:text-white'
          }`
        }
      >
        <Icon
          className={`shrink-0 transition-colors ${collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`}
          aria-hidden="true"
        />
        {!collapsed && <span className="truncate leading-none">{route.label}</span>}
        {collapsed && <span className="sr-only">{route.label}</span>}
      </NavLink>
    </li>
  );
}

function SidebarContent({ collapsed = false, mobile = false, onClose, onToggle, onLogout }) {
  const { session } = useSession();
  const accessibleRoutes = getAccessibleRoutes(session);
  const roleName = getPrimaryRole(session);
  const userName = session?.user?.name || 'User';

  const closeMobile = () => { if (mobile) onClose?.(); };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: '#26364A' }}
    >
      {/* ── Logo row ── */}
      <div
        className={`flex h-[64px] shrink-0 items-center border-b border-white/10 ${
          collapsed && !mobile ? 'justify-center px-3' : 'justify-between px-5'
        }`}
      >
        <Logo light compact={collapsed && !mobile} />
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
            autoFocus
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {!mobile && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="grid h-7 w-7 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
        {sections.map((section) => {
          const routes = accessibleRoutes.filter((r) => r.section === section);
          if (!routes.length) return null;
          return (
            <div key={section} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {section}
                </p>
              )}
              {collapsed && (
                <div className="mx-auto mb-1.5 h-px w-6 bg-white/15" aria-hidden="true" />
              )}
              <ul className="space-y-0.5">
                {routes.map((route) => (
                  <NavItem
                    key={route.path}
                    route={route}
                    collapsed={collapsed && !mobile}
                    onClick={closeMobile}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed && !mobile && (
          <div className="mb-3 rounded-lg bg-white/8 px-3 py-2.5">
            <p className="truncate text-[11px] font-semibold text-white/80">{userName}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/45">{roleName}</p>
          </div>
        )}
        <div className={`flex ${collapsed && !mobile ? 'flex-col items-center gap-1' : 'items-center justify-between gap-2'}`}>
          {!collapsed && !mobile && (
            <span className="truncate text-[10px] text-white/35">Demo workspace</span>
          )}
          <button
            type="button"
            onClick={onLogout}
            title={collapsed && !mobile ? 'Sign out' : undefined}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white ${
              collapsed && !mobile ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {(!collapsed || mobile) && <span>Sign out</span>}
            {collapsed && !mobile && <span className="sr-only">Sign out</span>}
          </button>
          {!mobile && collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 grid h-9 w-9 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DesktopSidebar({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
      className="sticky top-0 hidden h-screen shrink-0 border-r border-white/10 lg:block"
      aria-label="Desktop sidebar"
    >
      <SidebarContent
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={onLogout}
      />
    </aside>
  );
}

export function MobileSidebar({ onClose, onLogout }) {
  return (
    <aside
      className="h-full w-[min(80vw,280px)] border-r border-white/10 shadow-modal"
      aria-label="Mobile navigation"
    >
      <SidebarContent mobile onClose={onClose} onLogout={onLogout} />
    </aside>
  );
}
