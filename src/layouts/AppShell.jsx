import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { DesktopSidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialogRef = useRef(null);
  const mobileTriggerRef = useRef(null);
  const { logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
      if (event.key === 'Tab') {
        const focusable = mobileDialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), select, input, [tabindex="0"]',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => {
    setMobileOpen(false);
    mobileTriggerRef.current?.focus();
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F8F4' }}>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 font-semibold text-[#26364A] shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        <DesktopSidebar onLogout={handleLogout} />
        <div className="min-w-0 flex-1 flex flex-col">
          <Topbar onOpenMobile={() => setMobileOpen(true)} triggerRef={mobileTriggerRef} />
          <main
            id="main-content"
            className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
            tabIndex={-1}
          >
            <div className="mx-auto max-w-[1500px]">
              <motion.div
                key={location.pathname}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <Outlet />
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="Close navigation overlay"
              className="absolute inset-0 h-full w-full bg-[#1a2535]/60 backdrop-blur-sm"
              onClick={closeMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            />
            <motion.div
              ref={mobileDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="absolute inset-y-0 left-0"
              initial={{ x: reduceMotion ? 0 : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <MobileSidebar onClose={closeMobile} onLogout={handleLogout} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
