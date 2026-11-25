import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Building2, Check, ChevronDown, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { mockRepository } from '../data/mockRepository';
import { useSession } from '../hooks/useSession';
import { getAccessibleRoutes, getPrimaryRole, getRouteByPath } from '../routes/registry';
import { getVisibleResources } from '../services/dashboardService';
import { getDemoAccounts } from '../services/sessionService';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

export function Topbar({ onOpenMobile, triggerRef }) {
  const { session, switchDemoUser, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const accounts = useMemo(() => getDemoAccounts(), []);
  const currentRoute = getRouteByPath(location.pathname);
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);

  const notifications = useMemo(() => mockRepository.listNotifications(session.companyId)
    .filter((entry) => entry.userId === session.userId && entry.channel === 'in_app')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5), [session.companyId, session.userId]);
  const unreadCount = notifications.filter((entry) => !entry.readAt).length;

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const routeResults = getAccessibleRoutes(session)
      .filter((route) => `${route.label} ${route.description}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((route) => ({
        id: `route-${route.path}`,
        label: route.label,
        description: route.description,
        path: route.path,
        icon: route.icon,
      }));
    const resourceResults = getVisibleResources(session)
      .filter((resource) => resource.kind === 'reusable')
      .filter((resource) => `${resource.name} ${resource.category} ${resource.location}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((resource) => ({
        id: `resource-${resource.id}`,
        label: resource.name,
        description: `${resource.category} · ${resource.location}`,
        path: `/app/resources?resource=${encodeURIComponent(resource.id)}`,
        icon: Building2,
      }));
    return [...routeResults, ...resourceResults].slice(0, 8);
  }, [query, session]);
  const showSearchResults = searchActive && Boolean(query.trim());

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpenMenu(null);
        setMobileSearchOpen(true);
        setSearchActive(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const closeMenus = () => {
      setOpenMenu(null);
      setSearchActive(false);
      setMobileSearchOpen(false);
    };
    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) closeMenus();
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (openMenu === 'notifications') notificationRef.current?.focus();
      if (openMenu === 'profile') profileRef.current?.focus();
      if (mobileSearchOpen && !openMenu) mobileSearchRef.current?.focus();
      closeMenus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSearchOpen, openMenu]);

  useEffect(() => {
    setOpenMenu(null);
    setSearchActive(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const selectSearchResult = (result) => {
    navigate(result.path);
    setQuery('');
    setSearchActive(false);
    setMobileSearchOpen(false);
    searchRef.current?.blur();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && searchResults.length) {
      event.preventDefault();
      setActiveResult((index) => (index + 1) % searchResults.length);
    } else if (event.key === 'ArrowUp' && searchResults.length) {
      event.preventDefault();
      setActiveResult((index) => (index - 1 + searchResults.length) % searchResults.length);
    } else if (event.key === 'Enter' && showSearchResults && searchResults[activeResult]) {
      event.preventDefault();
      selectSearchResult(searchResults[activeResult]);
    }
  };

  const handleDemoSwitch = (userId) => {
    switchDemoUser(userId);
    setOpenMenu(null);
  };

  const signOut = () => {
    setOpenMenu(null);
    logout();
    navigate('/login', { replace: true });
  };

  const roleName = getPrimaryRole(session);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-[#e4e8f0] bg-white px-3 shadow-sm sm:gap-4 sm:px-5 lg:px-6"
    >
      {/* Mobile hamburger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpenMenu(null); onOpenMobile(); }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#637068] transition-colors hover:bg-[#F7F8F4] hover:text-[#26364A] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Page breadcrumb */}
      <div className="hidden min-w-0 lg:block">
        <p className="text-xs font-medium text-[#637068]">{session.company?.name || 'SpaceFlow'}</p>
        <p className="truncate text-sm font-semibold text-[#26364A]">{currentRoute?.label || 'Dashboard'}</p>
      </div>

      {/* Mobile search toggle */}
      <button
        ref={mobileSearchRef}
        type="button"
        onClick={() => {
          setMobileSearchOpen(true);
          setSearchActive(true);
          window.setTimeout(() => searchRef.current?.focus(), 0);
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] text-[#637068] transition-colors hover:bg-[#E8EEE4] sm:hidden"
        aria-label="Search workspace"
        aria-expanded={mobileSearchOpen}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Search input */}
      <div
        className={`${mobileSearchOpen ? 'absolute inset-x-3 top-2 z-20 h-14' : 'hidden'} relative sm:mx-auto sm:block sm:w-full sm:max-w-md sm:flex-1`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSearchActive(false);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#637068]" aria-hidden="true" />
        <label htmlFor="global-search" className="sr-only">Search workspace pages and resources</label>
        <input
          ref={searchRef}
          id="global-search"
          type="search"
          role="combobox"
          autoComplete="off"
          value={query}
          placeholder="Search spaces, people or reservations"
          aria-autocomplete="list"
          aria-expanded={showSearchResults}
          aria-controls="global-search-results"
          aria-activedescendant={showSearchResults && searchResults[activeResult] ? `global-search-result-${activeResult}` : undefined}
          onFocus={() => setSearchActive(true)}
          onChange={(event) => { setQuery(event.target.value); setActiveResult(0); setSearchActive(true); }}
          onKeyDown={handleSearchKeyDown}
          className="h-10 w-full rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] pl-9 pr-16 text-sm text-[#1e2a24] outline-none placeholder:text-[#637068] focus:border-[#203D30] focus:bg-white focus:ring-2 focus:ring-[#203D30]/10"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[#e4e8f0] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#637068] sm:block">
          ⌘K
        </kbd>
        {mobileSearchOpen && (
          <button
            type="button"
            onClick={() => { setMobileSearchOpen(false); setSearchActive(false); setQuery(''); mobileSearchRef.current?.focus(); }}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#637068] hover:bg-[#F7F8F4] sm:hidden"
            aria-label="Close search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {showSearchResults && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-lift">
            {searchResults.length ? (
              <ul id="global-search-results" role="listbox" aria-label="Workspace search results" className="max-h-80 overflow-y-auto p-1.5">
                {searchResults.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <li
                      key={result.id}
                      id={`global-search-result-${index}`}
                      role="option"
                      aria-selected={activeResult === index}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveResult(index)}
                      onClick={() => selectSearchResult(result)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${activeResult === index ? 'bg-[#E8EEE4]' : 'hover:bg-[#F7F8F4]'}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E8EEE4] text-[#203D30]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1e2a24]">{result.label}</span>
                        <span className="block truncate text-xs text-[#637068]">{result.description}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-[#637068]">No results found for "{query}"</p>
            )}
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Org badge - visible on larger screens */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] px-3 py-1.5 xl:flex">
          <Building2 className="h-3.5 w-3.5 text-[#203D30]" aria-hidden="true" />
          <span className="text-xs font-semibold text-[#26364A]">{session.company?.name || 'Demo workspace'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationRef}
            type="button"
            onClick={() => setOpenMenu((menu) => menu === 'notifications' ? null : 'notifications')}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-[#637068] transition-colors hover:bg-[#F7F8F4] hover:text-[#26364A]"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={openMenu === 'notifications'}
            aria-controls="notifications-menu"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D97777] text-[9px] font-bold text-white"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {openMenu === 'notifications' && (
            <div
              id="notifications-menu"
              className="absolute right-0 top-full z-40 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-[#e4e8f0] px-4 py-3">
                <p className="text-sm font-bold text-[#26364A]">Notifications</p>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#D97777]/10 px-2 py-0.5 text-xs font-semibold text-[#D97777]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length ? notifications.map((notification) => (
                  <div key={notification.id} className={`flex gap-3 border-b border-[#e4e8f0] px-4 py-3 last:border-0 ${notification.readAt ? '' : 'bg-[#F7F8F4]'}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? 'bg-[#e4e8f0]' : 'bg-[#203D30]'}`} aria-hidden="true" />
                    <div>
                      <p className="text-sm leading-5 text-[#1e2a24]">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-[#637068]">{formatNotificationTime(notification.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="px-4 py-6 text-center text-sm text-[#637068]">No recent notifications.</p>
                )}
              </div>
              <Link
                to="/app/notifications"
                onClick={() => setOpenMenu(null)}
                className="flex min-h-10 items-center justify-center border-t border-[#e4e8f0] px-4 text-sm font-semibold text-[#203D30] hover:bg-[#F7F8F4]"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            ref={profileRef}
            type="button"
            onClick={() => setOpenMenu((menu) => menu === 'profile' ? null : 'profile')}
            className="flex min-h-9 max-w-44 items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[#F7F8F4] xl:max-w-52"
            aria-label={`Open profile menu for ${session.user.name}`}
            aria-expanded={openMenu === 'profile'}
            aria-controls="profile-menu"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#26364A] text-[11px] font-bold text-white">
              {getInitials(session.user.name)}
            </span>
            <span className="hidden min-w-0 text-left xl:block">
              <span className="block truncate text-sm font-semibold text-[#1e2a24]">{session.user.name}</span>
              <span className="mt-0.5 block truncate text-[11px] text-[#637068]">{roleName}</span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-[#637068] sm:block" aria-hidden="true" />
          </button>
          {openMenu === 'profile' && (
            <div
              id="profile-menu"
              className="absolute right-0 top-full z-40 mt-2 w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-lift"
            >
              <div className="border-b border-[#e4e8f0] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#26364A] text-sm font-bold text-white">
                    {getInitials(session.user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1e2a24]">{session.user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#637068]">{session.user.email}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#203D30]">{roleName} · {session.company?.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  to="/app/profile"
                  onClick={() => setOpenMenu(null)}
                  className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#1e2a24] hover:bg-[#F7F8F4]"
                >
                  <UserRound className="h-4 w-4 text-[#203D30]" aria-hidden="true" />
                  View profile
                </Link>
              </div>
              <div className="border-t border-[#e4e8f0] px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#637068]">Switch demo account</p>
                <div className="sidebar-scroll mt-2 max-h-48 space-y-0.5 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleDemoSwitch(account.id)}
                      className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-[#F7F8F4] ${account.id === session.userId ? 'bg-[#E8EEE4]' : ''}`}
                      aria-pressed={account.id === session.userId}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E8EEE4] text-[10px] font-bold text-[#203D30]">
                        {getInitials(account.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[#1e2a24]">{account.name}</span>
                        <span className="block truncate text-[11px] text-[#637068]">{account.role}</span>
                      </span>
                      {account.id === session.userId && <Check className="h-4 w-4 shrink-0 text-[#203D30]" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="flex min-h-10 w-full items-center gap-3 border-t border-[#e4e8f0] px-4 text-sm font-semibold text-[#1e2a24] hover:bg-[#F7F8F4]"
              >
                <LogOut className="h-4 w-4 text-[#637068]" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
