import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  DoorOpen,
  Eye,
  EyeOff,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  Search,
  UsersRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { getDemoAccounts } from '../../services/sessionService';
import { DEMO_TODAY } from '../../services/dashboardService';
import { mockRepository } from '../../data/mockRepository';
import { ACTIVE_RESERVATION_STATUSES } from '../../domain/reservationStatus';

const FEATURED_ROOMS = [
  { id: 'featured-room-a', name: 'Meeting Room A', meta: 'Meeting room • 6:30 PM', status: 'reserved', tag: 'Boardroom' },
  { id: 'featured-desk', name: 'Collaborative Desk', meta: 'Shared workspace • 7:30 PM', status: 'open', tag: null },
];

const EASE = [0.22, 1, 0.36, 1];

function StatusPill({ open }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
      style={{ background: open ? 'var(--sage)' : 'var(--terracotta)' }}
    >
      {open ? 'Open' : 'Reserved'}
    </span>
  );
}

export function AuthGlassPortal({ onBackToDoor, backLabel = '← Back to the door', from, skipEntrance = false }) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { login } = useSession();
  const accounts = useMemo(() => getDemoAccounts(), []);
  const emailRef = useRef(null);
  const pulseTimer = useRef(null);

  const [mode, setMode] = useState('login');
  const [registered, setRegistered] = useState(false);
  const [selectedId, setSelectedId] = useState(accounts[0]?.id || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(accounts[0]?.email || '');
  const [password, setPassword] = useState('demo123');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forgotHint, setForgotHint] = useState(false);

  const [search, setSearch] = useState('');
  const [showAllSpaces, setShowAllSpaces] = useState(false);
  const [quickHint, setQuickHint] = useState('');
  const [pulseDesk, setPulseDesk] = useState(false);

  const demoSpaces = useMemo(() => {
    const resources = mockRepository.listResources('company-northstar')
      .filter((resource) => resource.kind === 'reusable' && resource.image)
      .slice(0, 4);
    const busy = new Set(mockRepository.listReservations('company-northstar')
      .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && reservation.date === DEMO_TODAY)
      .map((reservation) => reservation.resourceId));
    return resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      floor: resource.floor,
      capacity: resource.capacity,
      image: resource.image,
      open: !busy.has(resource.id),
    }));
  }, []);

  useEffect(() => () => window.clearTimeout(pulseTimer.current), []);

  const query = search.trim().toLowerCase();
  const featured = FEATURED_ROOMS.filter((room) =>
    !query || `${room.name} ${room.meta} ${room.tag ?? ''}`.toLowerCase().includes(query));
  const extraSpaces = demoSpaces.filter((space) =>
    !query || `${space.name} ${space.floor}`.toLowerCase().includes(query));

  const selectAccount = (userId) => {
    const account = accounts.find(({ id }) => id === userId);
    setSelectedId(userId);
    setEmail(account?.email || '');
    setPassword('demo123');
    setError('');
  };

  const switchMode = (next) => {
    setMode(next);
    setRegistered(false);
    setError('');
    setForgotHint(false);
  };

  const handleQuickBook = () => {
    setQuickHint('Collaborative Desk is open at 7:30 PM — log in to reserve it.');
    setPulseDesk(true);
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulseDesk(false), 1600);
    emailRef.current?.focus();
  };

  const enterWorkspace = async (credentials) => {
    setSubmitting(true);
    setError('');
    try {
      await login(credentials);
      navigate(from || '/app/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Check the demo credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (mode === 'register') {
      if (fullName.trim().length < 2) { setError('Please enter your full name.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 650));
      setSubmitting(false);
      setRegistered(true);
      return;
    }
    await enterWorkspace({ email: email.trim(), password });
  };

  const continueAsDemo = () => {
    const employee = accounts.find((account) => account.role === 'Employee') || accounts[0];
    enterWorkspace({ email: employee.email, password: 'demo123' });
  };

  const entrance = (delay = 0) => reduceMotion || skipEntrance
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } };

  return (
    <div
      className="portal-scroll relative grid min-h-screen w-full"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        backgroundImage: "url('/images/auth-glass-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, rgba(22,27,24,0.72) 0%, rgba(46,53,48,0.4) 50%, rgba(246,244,238,0.62) 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* LEFT — Workspace Tools glass panel */}
      <div className="relative z-[2] flex flex-col items-center justify-center" style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
        <motion.div {...entrance(0.05)} className="glass-tools-panel w-full max-w-[490px] rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-[22px] font-bold text-white">Workspace Tools</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--sage-soft)' }} /> Live preview
            </span>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Search meeting rooms</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search meeting rooms..."
                className="w-full rounded-xl py-2.5 pl-10 pr-3.5 text-[13px] outline-none"
                style={{ background: 'rgba(244,247,244,0.85)', color: 'var(--ink-dark)' }}
              />
            </span>
          </label>

          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <button type="button" onClick={handleQuickBook} className="forest-pill-button flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ borderRadius: 12 }}>
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" /> Quick Book
            </button>
            <button
              type="button"
              onClick={() => setShowAllSpaces((value) => !value)}
              aria-pressed={showAllSpaces}
              className="flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'rgba(244,247,244,0.72)', color: 'var(--ink-dark)', border: '1px solid rgba(255,255,255,0.75)', borderRadius: 12 }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" /> {showAllSpaces ? 'Hide Spaces' : 'View Spaces'}
            </button>
          </div>

          <AnimatePresence>
            {quickHint ? (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduceMotion ? false : { opacity: 0, height: 0 }}
                className="overflow-hidden text-xs font-medium"
                style={{ color: 'var(--sage-soft)' }}
              >
                <span className="mt-3 block rounded-lg bg-white/10 px-3 py-2">{quickHint}</span>
              </motion.p>
            ) : null}
          </AnimatePresence>

          <div className="mt-4 flex flex-col gap-3">
            {featured.map((room) => room.status === 'open' ? (
              <div key={room.id} className={`room-card-glow rounded-2xl p-4 ${pulseDesk ? 'is-pulsing' : ''}`}>
                <div className="font-bold" style={{ color: 'var(--ink-dark)' }}>{room.name}</div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>{room.meta}</div>
                <div className="mt-2.5"><StatusPill open /></div>
              </div>
            ) : (
              <div key={room.id} className="room-card-plain rounded-2xl p-4">
                <div className="font-bold" style={{ color: 'var(--ink-dark)' }}>{room.name}</div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>{room.meta}</div>
                <div className="mt-2.5 flex gap-2">
                  <StatusPill open={false} />
                  {room.tag ? <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px]" style={{ color: 'var(--ink-dark)' }}>{room.tag}</span> : null}
                </div>
              </div>
            ))}

            <AnimatePresence initial={false}>
              {showAllSpaces ? extraSpaces.map((space, index) => (
                <motion.div
                  key={space.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? false : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: EASE }}
                  className="room-card-plain flex items-center gap-3 rounded-2xl p-3"
                >
                  <img src={space.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold" style={{ color: 'var(--ink-dark)' }}>{space.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{space.floor}</span>
                      <span className="flex items-center gap-1"><UsersRound className="h-3 w-3" aria-hidden="true" />{space.capacity}</span>
                    </div>
                  </div>
                  <StatusPill open={space.open} />
                </motion.div>
              )) : null}
            </AnimatePresence>

            {query && !featured.length && !extraSpaces.length ? (
              <p className="rounded-xl bg-white/40 px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                No spaces match “{search}”.
              </p>
            ) : null}
          </div>

          <p className="mb-0 mt-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Demo data only — sign in to reserve a space.
          </p>
        </motion.div>
      </div>

      {/* RIGHT — Frosted Log In / Sign Up card */}
      <div className="relative z-[2] flex items-center justify-center" style={{ padding: 'clamp(24px, 4vw, 48px)' }}>
        <motion.div {...entrance(0.15)} className="glass-auth-card w-full max-w-[420px] rounded-3xl" style={{ padding: '32px 28px' }}>
          <div className="mb-5 grid grid-cols-2 rounded-full p-1" style={{ background: 'rgba(142,168,148,0.25)' }} role="tablist" aria-label="Authentication mode">
            {['login', 'register'].map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => switchMode(option)}
                className="rounded-full py-2 text-sm font-semibold transition-colors"
                style={mode === option
                  ? { background: 'var(--forest)', color: 'var(--white)' }
                  : { background: 'transparent', color: 'var(--ink-muted)' }}
              >
                {option === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {registered ? (
              <motion.div
                key="registered"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? false : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="text-center"
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: 'rgba(142,168,148,0.3)', color: 'var(--forest)' }}>
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-2xl font-bold" style={{ color: 'var(--ink-dark)' }}>You’re on the list</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>
                  Registration is simulated in this browser demo — no live account or email is created.
                  Continue with a demo employee account to explore the workspace.
                </p>
                <button type="button" onClick={continueAsDemo} disabled={submitting} className="forest-pill-button mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-[15px]">
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DoorOpen className="h-4 w-4" aria-hidden="true" />}
                  {submitting ? 'Opening workspace…' : 'Enter the workspace'}
                </button>
                <button type="button" onClick={() => switchMode('login')} className="mt-3 text-[13px] font-semibold underline" style={{ color: 'var(--ink-dark)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Back to log in
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? false : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <h2 className="m-0 text-[32px] font-bold leading-tight" style={{ color: 'var(--ink-dark)' }}>
                  {mode === 'register' ? 'Sign Up' : 'Log In'}
                </h2>
                <p className="mb-5 mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
                  {mode === 'register'
                    ? 'Create your account to reserve meeting rooms and desks.'
                    : 'Welcome back. Please log in to the reservation hub.'}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                  {mode === 'register' ? (
                    <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" aria-label="Full name" autoComplete="name" className="sage-glass-input" required />
                  ) : (
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Demo role</span>
                      <select value={selectedId} onChange={(event) => selectAccount(event.target.value)} aria-label="Choose a demo account" className="sage-glass-input cursor-pointer">
                        {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} — {account.role}</option>)}
                      </select>
                    </label>
                  )}

                  <input ref={emailRef} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail address" aria-label="Email address" autoComplete="username" className="sage-glass-input" required />

                  <span className="relative block">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      aria-label="Password"
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      className="sage-glass-input pr-11"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg" style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </span>

                  {mode === 'register' ? (
                    <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirm password" aria-label="Confirm password" autoComplete="new-password" className="sage-glass-input" required />
                  ) : (
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-3.5 w-3.5" style={{ accentColor: 'var(--forest)' }} />
                        Remember me
                      </label>
                      <button type="button" onClick={() => setForgotHint((value) => !value)} className="underline" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}>
                        Forgot password
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {forgotHint && mode === 'login' ? (
                      <motion.p initial={reduceMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduceMotion ? false : { opacity: 0, height: 0 }} className="overflow-hidden rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(142,168,148,0.25)', color: 'var(--ink-dark)' }}>
                        Every demo account uses the password <strong>demo123</strong>.
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  {error ? <p role="alert" className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'rgba(231,142,107,0.2)', color: '#8a3c22', border: '1px solid rgba(231,142,107,0.5)' }}>{error}</p> : null}

                  <button type="submit" disabled={submitting} className="forest-pill-button mt-1.5 flex items-center justify-center gap-2 px-4 py-3 text-[15px]">
                    {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    {submitting ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Log In'}
                  </button>
                </form>

                <p className="mb-0 mt-5 text-center text-[13px]" style={{ color: 'var(--ink-muted)' }}>
                  {mode === 'register' ? 'Already have an account? ' : 'Don’t have an account? '}
                  <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')} className="font-bold underline" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink-dark)', cursor: 'pointer' }}>
                    {mode === 'register' ? 'Log in' : 'Sign up'}
                  </button>
                </p>
                <p className="mb-0 mt-3 text-center text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  New organization? <Link to="/register-organization" className="font-semibold underline" style={{ color: 'var(--forest)' }}>View registration preview</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {onBackToDoor ? (
        <button
          type="button"
          onClick={onBackToDoor}
          className="fixed bottom-6 z-[3] flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
          style={{ left: 'clamp(24px, 4vw, 48px)', background: 'rgba(255,255,255,0.85)', color: 'var(--forest)', border: 'none', cursor: 'pointer', boxShadow: '0 10px 24px rgba(16,36,26,0.2)' }}
        >
          {backLabel}
        </button>
      ) : null}
    </div>
  );
}