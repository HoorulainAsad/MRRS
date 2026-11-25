import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  DoorOpen,
  LayoutDashboard,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuickBook } from '../components/dashboard/QuickBook';
import { ReservationDialog } from '../components/dashboard/ReservationDialog';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useSession } from '../hooks/useSession';
import { canAccessRoute, getRouteByPath } from '../routes/registry';
import { DEMO_TODAY, getDashboardData } from '../services/dashboardService';

const STAT_META = {
  occupancy: { icon: Building2, accent: 'bg-sage-100 text-sage-700' },
  active: { icon: CalendarCheck2, accent: 'bg-[#edf0ef] text-[#5e6b66]' },
  available: { icon: DoorOpen, accent: 'bg-[#f0eee7] text-[#777367]' },
  personal: { icon: UsersRound, accent: 'bg-sage-50 text-sage-700' },
  organizations: { icon: Building2, accent: 'bg-sage-100 text-sage-700' },
  resources: { icon: LayoutDashboard, accent: 'bg-[#edf0ef] text-[#5e6b66]' },
  'active-reservations': { icon: CalendarCheck2, accent: 'bg-[#f0eee7] text-[#777367]' },
  utilization: { icon: TrendingUp, accent: 'bg-sage-50 text-sage-700' },
};

function addDays(value, amount) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function StatCard({ stat, index, reduceMotion }) {
  const meta = STAT_META[stat.id] || STAT_META.resources;
  const Icon = meta.icon;
  const progress = stat.id === 'occupancy' ? Number(stat.progress ?? String(stat.value).replaceAll('%', '')) : null;

  return (
    <motion.article
      className={`group rounded-2xl border border-line bg-white p-5 shadow-soft transition-transform hover:-translate-y-0.5 ${stat.id === 'occupancy' ? 'bg-sage-50/60' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink-500">{stat.label}</p>
          <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.04em] text-navy-900">
            {stat.id === 'available' && typeof stat.value === 'number' ? String(stat.value).padStart(2, '0') : stat.value}
          </p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${meta.accent}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-[11px] font-medium text-ink-500">{stat.detail}</p>
      {progress !== null && Number.isFinite(progress) ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage-200/70" role="progressbar" aria-label="Room occupancy" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-sage-600" initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.15 }} />
        </div>
      ) : null}
    </motion.article>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your SpaceFlow dashboard" className="animate-pulse">
      <div className="skeleton-shimmer h-3 w-44 rounded-full" />
      <div className="skeleton-shimmer mt-4 h-10 w-full max-w-xl rounded-xl" />
      <div className="skeleton-shimmer mt-3 h-4 w-full max-w-md rounded" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton-shimmer h-36 rounded-2xl" />)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="skeleton-shimmer h-[590px] rounded-3xl" /><div className="skeleton-shimmer h-[590px] rounded-3xl" /></div>
      <span className="sr-only">Loading your workspace overview</span>
    </div>
  );
}

function TodaySchedule({ items = [], referenceDate, reduceMotion }) {
  const date = new Date(`${referenceDate}T12:00:00.000Z`);
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft" aria-labelledby="today-schedule-title">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5">
        <div>
          <h2 id="today-schedule-title" className="text-lg font-bold tracking-tight text-navy-900">Today’s schedule</h2>
          <p className="mt-1 text-xs text-ink-500">Your workspace, in order.</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sage-50 text-center ring-1 ring-sage-100">
          <span><span className="block text-[9px] font-bold uppercase tracking-wider text-sage-600">{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date)}</span><span className="mt-0.5 block text-xl font-bold leading-none text-sage-800">{date.getUTCDate()}</span></span>
        </div>
      </div>
      {items.length ? (
        <ol className="px-5 py-2 sm:px-6">
          {items.slice(0, 4).map((item, index) => (
            <motion.li key={item.id} className="relative flex gap-4 py-4" initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.05 }}>
              {index < Math.min(items.length, 4) - 1 ? <span className="absolute left-[5px] top-10 h-[calc(100%-1rem)] w-px bg-line" aria-hidden="true" /> : null}
              <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white ${item.isOwn ? 'bg-sage-600' : item.status === 'pending' ? 'bg-amber-400' : 'bg-stone-300'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-sm font-bold text-navy-900">{item.resourceName}</p><p className="mt-1 text-[11px] font-medium text-ink-500">{item.startTime} – {item.endTime} · {item.durationMinutes} min</p></div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 truncate text-xs text-ink-600">{item.isOwn ? item.purpose || 'Personal workspace session' : 'Reserved workspace time'}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      ) : (
        <div className="px-6 py-12 text-center"><CalendarDays className="mx-auto h-7 w-7 text-sage-500" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-navy-900">A clear day ahead</p><p className="mt-1 text-xs leading-5 text-ink-500">No reservations are scheduled in your visible scope today.</p></div>
      )}
      <div className="border-t border-line bg-mist-50/50 px-5 py-4"><Link to="/app/reservations" className="flex items-center justify-between text-xs font-bold text-sage-700 hover:underline">View full schedule <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </section>
  );
}

function PopularSpaces({ spaces = [], quickBook, onBook, reduceMotion }) {
  const quickMap = new Map((quickBook?.spaces || []).map((space) => [space.resourceId, space]));
  return (
    <section aria-labelledby="popular-spaces-title">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div><h2 id="popular-spaces-title" className="text-lg font-bold tracking-tight text-navy-900">Popular spaces</h2><p className="mt-1 text-xs text-ink-500">A few favorites, ready when you are.</p></div>
        <Link to="/app/resources" className="flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {spaces.map((space, index) => {
          const quickSpace = quickMap.get(space.id);
          const slot = quickSpace?.slots?.find((candidate) => candidate.available);
          return (
            <motion.article key={space.id} className="group overflow-hidden rounded-3xl border border-line bg-white shadow-soft" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.06 }} whileHover={reduceMotion ? undefined : { y: -4 }}>
              <div className="relative aspect-[4/3] overflow-hidden bg-mist-100">
                {space.image ? <img src={space.image} alt={space.imageAlt || space.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /> : <span className="grid h-full place-items-center text-sage-500"><Building2 className="h-8 w-8" aria-hidden="true" /></span>}
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${space.available ? 'bg-white/90 text-sage-800' : 'bg-white/85 text-ink-500'}`}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${space.available ? 'bg-emerald-500' : 'bg-stone-400'}`} />{space.available ? 'Available today' : 'Fully booked'}</span>
                {space.photoCredit ? <span className="absolute bottom-2 right-2 rounded-full bg-black/25 px-2 py-0.5 text-[8px] font-medium text-white/90 backdrop-blur-sm">Photo: {space.photoCredit}</span> : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-navy-900">{space.name}</h3><p className="mt-1 flex items-center gap-2 text-[10px] font-medium text-ink-500"><span className="flex items-center gap-1"><UsersRound className="h-3 w-3" aria-hidden="true" />{space.capacity} people</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{space.floor}</span></p></div><button type="button" onClick={() => slot && onBook({ resourceId: space.id, date: quickBook?.date || DEMO_TODAY, startTime: slot.startTime, endTime: slot.endTime })} disabled={!slot} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-50 text-sage-700 transition-colors hover:bg-sage-700 hover:text-white disabled:cursor-not-allowed disabled:bg-mist-100 disabled:text-stone-400" aria-label={slot ? `Book ${space.name}` : `${space.name} is fully booked`}><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button></div>
                <p className="mt-3 line-clamp-2 min-h-8 text-[11px] leading-4 text-ink-500">{space.description}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function PlatformOverview({ data }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-7 shadow-soft">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sage-100/70 blur-3xl" aria-hidden="true" />
        <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-sage-700"><Building2 className="h-6 w-6" aria-hidden="true" /></span>
        <h2 className="relative mt-6 text-2xl font-bold tracking-tight text-navy-900">A calm view across your organizations.</h2>
        <p className="relative mt-3 max-w-xl text-sm leading-6 text-ink-500">SpaceFlow keeps platform reporting aggregate-only. Private resources, reservation details, and inventory remain inside each organization.</p>
        <div className="relative mt-7 flex flex-wrap gap-3"><Link to="/app/organizations" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-700 px-4 text-sm font-semibold text-white hover:bg-sage-800">Organizations <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link to="/app/reports" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-sage-700 hover:bg-sage-50">Reports <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      </div>
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft"><h2 className="text-base font-bold text-navy-900">Platform snapshot</h2><div className="mt-5 space-y-4">{data.stats.map((stat) => <div key={stat.id} className="flex items-center justify-between border-b border-line pb-4 last:border-0 last:pb-0"><div><p className="text-sm font-semibold text-navy-900">{stat.label}</p><p className="mt-1 text-[11px] text-ink-500">{stat.detail}</p></div><span className="text-xl font-bold text-sage-700">{stat.value}</span></div>)}</div></div>
    </section>
  );
}

export function DashboardPage() {
  const { session } = useSession();
  const reduceMotion = useReducedMotion();
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [retry, setRetry] = useState(0);
  const [weekDate, setWeekDate] = useState(DEMO_TODAY);
  const [calendarView, setCalendarView] = useState('week');
  const [quickBookDate, setQuickBookDate] = useState(DEMO_TODAY);
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(1);
  const [reservationSelection, setReservationSelection] = useState(null);
  const requestKey = `${session.userId}:${retry}:${weekDate}:${calendarView}:${quickBookDate}:${duration}:${capacity}`;

  useEffect(() => {
    let active = true;
    getDashboardData(session, undefined, { weekDate, quickBookDate, duration, capacity, calendarView })
      .then((dashboard) => {
        if (active) setResult({ key: requestKey, data: dashboard, error: '' });
      })
      .catch(() => {
        if (active) setResult({ key: requestKey, data: null, error: 'Your dashboard could not be loaded. Please try again.' });
      });
    return () => { active = false; };
  }, [session, requestKey, weekDate, quickBookDate, duration, capacity, calendarView]);

  const resourceOptions = useMemo(() => {
    const quickMap = new Map((result.data?.quickBook?.spaces || []).map((resource) => [resource.resourceId, resource]));
    return (result.data?.resourceAvailability || []).map((resource) => ({
      ...resource,
      ...quickMap.get(resource.id),
      id: resource.id,
      name: resource.name,
      kind: resource.kind || 'reusable',
    }));
  }, [result.data]);

  if (result.key !== requestKey) return <DashboardSkeleton />;
  const { data, error } = result;

  if (error || !data) {
    return (
      <section className="mx-auto mt-16 max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-soft">
        <Activity className="mx-auto h-8 w-8 text-sage-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-navy-900">We couldn’t load your overview</h1>
        <p className="mt-2 text-sm text-ink-500" role="alert">{error || 'Dashboard data is unavailable.'}</p>
        <Button className="mt-6" onClick={() => setRetry((value) => value + 1)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Retry</Button>
      </section>
    );
  }

  const referenceDate = data.referenceDate || DEMO_TODAY;
  const isPlatform = Boolean(data.platform);
  const canReview = canAccessRoute(session, getRouteByPath('/app/approvals'));
  const stats = data.stats || [];
  const calendarResources = resourceOptions.filter((resource) => resource.kind === 'reusable');
  const openReservation = (selection = {}) => setReservationSelection(selection);

  const changePeriod = (direction) => {
    if (calendarView === 'month') {
      const date = new Date(`${weekDate.slice(0, 7)}-01T12:00:00.000Z`);
      date.setUTCMonth(date.getUTCMonth() + direction);
      setWeekDate(date.toISOString().slice(0, 10));
      return;
    }
    setWeekDate((current) => addDays(current, direction * 7));
  };

  const selectDay = (day) => {
    setWeekDate(day);
    setCalendarView('week');
  };

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="pb-28 sm:pb-24">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sage-700"><span className="h-1.5 w-1.5 rounded-full bg-sage-500" />Your workspace, in sync</p>
          <h1 className="mt-3 text-balance text-3xl font-bold tracking-[-0.04em] text-navy-900 sm:text-[36px]">Make room for your best work.</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">Find your space. Bring your ideas. We’ll take care of the rest.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-xs font-semibold text-ink-600 shadow-sm"><MapPin className="h-4 w-4 text-sage-600" aria-hidden="true" /><span>{session.company?.name || 'Demo workspace'}</span><span className="rounded-md bg-sage-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sage-700">HQ</span></div>
          {!isPlatform ? <Button onClick={() => openReservation()}><Plus className="h-4 w-4" aria-hidden="true" />New reservation</Button> : null}
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace statistics">{stats.map((stat, index) => <StatCard key={stat.id} stat={stat} index={index} reduceMotion={reduceMotion} />)}</section>

      {isPlatform ? (
        <div className="mt-6"><PlatformOverview data={data} /></div>
      ) : (
        <>
          <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <WeeklyCalendar events={data.calendarEvents || []} weekDate={weekDate} referenceDate={referenceDate} resources={calendarResources} view={calendarView} onViewChange={setCalendarView} onPeriodChange={changePeriod} onDaySelect={selectDay} />
            <QuickBook data={data.quickBook} resourceCount={calendarResources.length} onChange={(changes) => { if (changes.date) setQuickBookDate(changes.date); if (changes.duration) setDuration(changes.duration); if (changes.capacity) setCapacity(changes.capacity); }} onBook={openReservation} />
          </div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.65fr)]">
            <TodaySchedule items={data.todaySchedule || []} referenceDate={referenceDate} reduceMotion={reduceMotion} />
            <PopularSpaces spaces={data.popularSpaces || []} quickBook={data.quickBook} onBook={openReservation} reduceMotion={reduceMotion} />
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-xs text-ink-500 shadow-soft sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-sage-600" aria-hidden="true" />Need a hand? Orbit can help you find a space—never submit one for you.</p><Link to={canReview ? '/app/approvals' : '/app/resources'} className="flex items-center gap-1 font-bold text-sage-700 hover:underline">{canReview ? 'Review workflow' : 'Explore spaces'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
        </>
      )}

      <AnimatePresence>{reservationSelection ? <ReservationDialog key={`${reservationSelection.resourceId || 'new'}:${reservationSelection.date || ''}:${reservationSelection.startTime || ''}`} session={session} resources={resourceOptions} initialSelection={reservationSelection} onClose={() => setReservationSelection(null)} onSubmitted={() => setRetry((value) => value + 1)} /> : null}</AnimatePresence>
    </motion.div>
  );
}
