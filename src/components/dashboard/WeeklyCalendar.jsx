import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TIME_LABELS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

function parseDate(value) {
  return new Date(`${value}T12:00:00.000Z`);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value, amount) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
}

function startOfWeek(value) {
  const date = parseDate(value);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return dateKey(date);
}

function minutes(value) {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
}

function formatRange(value, view) {
  const date = parseDate(value);
  if (view === 'month') {
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  const end = parseDate(addDays(startOfWeek(value), 4));
  const sameMonth = date.getUTCMonth() === end.getUTCMonth();
  const startLabel = new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', ...(sameMonth ? {} : { month: 'short' }), timeZone: 'UTC',
  }).format(parseDate(startOfWeek(value)));
  const endLabel = new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}

function eventTone(event, index) {
  if (event.isOwn) return 'border-sage-700 bg-sage-700 text-white shadow-sm';
  const tones = [
    'border-[#dce6df] bg-[#e8f0ea] text-sage-900',
    'border-[#e1e5e5] bg-[#edf0ef] text-[#52615c]',
    'border-[#e6e4dc] bg-[#f0eee7] text-[#66665d]',
  ];
  return tones[index % tones.length];
}

function arrangeEvents(events) {
  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((event) => ({ ...event }));
  const lanes = [];

  sorted.forEach((event) => {
    const start = minutes(event.startTime);
    const end = minutes(event.endTime);
    let laneIndex = lanes.findIndex((laneEnd) => laneEnd <= start);
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push(end);
    } else {
      lanes[laneIndex] = end;
    }
    event.lane = laneIndex;
  });

  const laneCount = Math.max(1, lanes.length);
  return sorted.map((event) => ({ ...event, laneCount }));
}

function EventDetail({ event, onClose }) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previousActive = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
      if (keyboardEvent.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button, a[href], [tabindex="0"]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-sage-950/30 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(domEvent) => {
        if (domEvent.target === domEvent.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
        className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.isOwn ? 'bg-sage-100 text-sage-800' : 'bg-mist-100 text-ink-600'}`}>
            {event.isOwn ? 'Your booking' : 'Reserved'}
          </span>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 hover:bg-mist-100" aria-label="Close booking details">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <h3 id="calendar-event-title" className="mt-5 text-xl font-bold tracking-tight text-navy-900">{event.resourceName}</h3>
        <div className="mt-4 space-y-3 text-sm text-ink-600">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sage-600" aria-hidden="true" />{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parseDate(event.date))}</p>
          <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-sage-600" aria-hidden="true" />{event.startTime} – {event.endTime}</p>
          {event.location ? <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sage-600" aria-hidden="true" />{event.location}</p> : null}
        </div>
        <p className="mt-5 rounded-2xl bg-mist-50 p-4 text-xs leading-5 text-ink-500">
          {event.isOwn
            ? 'This is your demo reservation. You can review its workflow status in Reservations.'
            : 'This time is reserved. Booker details stay private in this demo view.'}
        </p>
        <Link to="/app/reservations" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sage-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-sage-800">
          View reservations <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </motion.section>
    </motion.div>
  );
}

function WeekView({ events, weekDate, referenceDate, reduceMotion, onEventSelect }) {
  const days = Array.from({ length: 5 }, (_, index) => addDays(startOfWeek(weekDate), index));
  const now = new Date();
  const today = dateKey(now);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const showNow = days.includes(referenceDate) && today === referenceDate && nowMinutes >= 480 && nowMinutes <= 1080;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[740px]">
        <div className="grid grid-cols-[62px_repeat(5,minmax(0,1fr))] border-b border-line bg-mist-50/70">
          <div />
          {days.map((day) => {
            const date = parseDate(day);
            const isToday = day === referenceDate;
            return (
              <div key={day} className={`border-l border-line px-3 py-3 text-center ${isToday ? 'bg-sage-50' : ''}`}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isToday ? 'text-sage-700' : 'text-ink-500'}`}>{WEEKDAYS[(date.getUTCDay() + 6) % 7]}</p>
                <p className={`mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${isToday ? 'bg-sage-700 text-white' : 'text-navy-900'}`}>{date.getUTCDate()}</p>
              </div>
            );
          })}
        </div>

        <div className="relative grid h-[440px] grid-cols-[62px_repeat(5,minmax(0,1fr))]">
          <div className="relative">
            {TIME_LABELS.map((time, index) => (
              <span key={time} className="absolute right-3 -translate-y-1/2 text-[10px] font-medium text-ink-500" style={{ top: `${index * 20}%` }}>{time}</span>
            ))}
          </div>
          {days.map((day) => {
            const dayEvents = arrangeEvents(events.filter((event) => event.date === day));
            return (
              <div key={day} className="relative border-l border-line">
                {TIME_LABELS.map((time, index) => (
                  <span key={time} className="absolute inset-x-0 border-t border-line/80" style={{ top: `${index * 20}%` }} aria-hidden="true" />
                ))}
                {showNow && day === referenceDate ? (
                  <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: `${((nowMinutes - 480) / 600) * 100}%` }}>
                    <span className="h-2 w-2 -translate-x-1 rounded-full bg-sage-600 ring-2 ring-white" />
                    <span className="h-px flex-1 bg-sage-500" />
                  </div>
                ) : null}
                {dayEvents.map((event, index) => {
                  const start = Math.max(480, Math.min(1080, minutes(event.startTime)));
                  const end = Math.max(start + 15, Math.min(1080, minutes(event.endTime)));
                  const top = ((start - 480) / 600) * 100;
                  const height = Math.max(9, ((end - start) / 600) * 100);
                  const laneWidth = 100 / event.laneCount;
                  return (
                    <motion.button
                      key={event.id}
                      type="button"
                      onClick={() => onEventSelect(event)}
                      className={`absolute z-10 overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-shadow hover:z-30 hover:shadow-md ${eventTone(event, index)}`}
                      style={{
                        top: `calc(${top}% + 3px)`,
                        height: `calc(${height}% - 6px)`,
                        left: `calc(${event.lane * laneWidth}% + 3px)`,
                        width: `calc(${laneWidth}% - 6px)`,
                      }}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: reduceMotion ? 0 : index * 0.025 }}
                      aria-label={`${event.resourceName}, ${event.startTime} to ${event.endTime}, ${event.isOwn ? 'your booking' : 'reserved'}`}
                    >
                      <span className="block truncate text-[10px] font-bold">{event.startTime}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold leading-4">{event.resourceName}</span>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({ events, monthDate, referenceDate, onDaySelect, onEventSelect, reduceMotion }) {
  const first = parseDate(`${monthDate.slice(0, 7)}-01`);
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((leading + daysInMonth) / 7) * 7 }, (_, index) => {
    const dayNumber = index - leading + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dateKey(new Date(Date.UTC(year, month, dayNumber))) : null;
  });

  return (
    <div className="grid grid-cols-7 border-t border-line">
      {MONTH_WEEKDAYS.map((day, index) => <div key={`${day}-${index}`} className="border-b border-r border-line bg-mist-50/70 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-ink-500 last:border-r-0">{day}</div>)}
      {cells.map((day, index) => {
        if (!day) return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-line bg-mist-50/30 last:border-r-0" />;
        const dayEvents = events.filter((event) => event.date === day).slice(0, 2);
        const extra = events.filter((event) => event.date === day).length - dayEvents.length;
        return (
          <div key={day} className={`min-h-24 border-b border-r border-line p-2 last:border-r-0 ${day === referenceDate ? 'bg-sage-50/70' : ''}`}>
            <button type="button" onClick={() => onDaySelect(day)} className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${day === referenceDate ? 'bg-sage-700 text-white' : 'text-navy-900 hover:bg-mist-100'}`} aria-label={`Open week of ${day}`}>{parseDate(day).getUTCDate()}</button>
            <div className="mt-1 space-y-1">
              {dayEvents.map((event, eventIndex) => (
                <motion.button
                  key={event.id}
                  type="button"
                  onClick={() => onEventSelect(event)}
                  className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-[9px] font-semibold ${eventTone(event, eventIndex)}`}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {event.startTime} {event.resourceName}
                </motion.button>
              ))}
              {extra > 0 ? <button type="button" onClick={() => onDaySelect(day)} className="text-[10px] font-semibold text-sage-700 hover:underline">+{extra} more</button> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyCalendar({ events = [], weekDate, referenceDate, resources = [], view, onViewChange, onPeriodChange, onDaySelect }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');
  const reduceMotion = useReducedMotion();
  const filteredEvents = useMemo(
    () => resourceFilter === 'all' ? events : events.filter((event) => event.resourceId === resourceFilter),
    [events, resourceFilter],
  );

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft" aria-labelledby="weekly-calendar-title">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-sage-700"><CalendarDays className="h-4 w-4" aria-hidden="true" /></span>
              <h2 id="weekly-calendar-title" className="text-lg font-bold tracking-tight text-navy-900">Your week, at a glance</h2>
            </div>
            <p className="mt-2 text-xs font-medium text-ink-500">{formatRange(weekDate, view)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-line bg-white p-1">
              <button type="button" onClick={() => onPeriodChange(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-mist-100 hover:text-navy-900" aria-label={`Previous ${view}`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => onDaySelect(referenceDate)} className="h-8 rounded-lg px-3 text-xs font-bold text-sage-700 hover:bg-sage-50">Today</button>
              <button type="button" onClick={() => onPeriodChange(1)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-mist-100 hover:text-navy-900" aria-label={`Next ${view}`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <label className="sr-only" htmlFor="calendar-space-filter">Filter calendar by space</label>
            <select id="calendar-space-filter" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)} className="h-10 max-w-40 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-600 outline-none focus:border-sage-500">
              <option value="all">All spaces</option>
              {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
            </select>
            <div className="flex rounded-xl bg-mist-100 p-1" aria-label="Calendar view">
              {['week', 'month'].map((option) => (
                <button key={option} type="button" onClick={() => onViewChange(option)} aria-pressed={view === option} className={`h-8 rounded-lg px-3 text-xs font-bold capitalize transition-colors ${view === option ? 'bg-white text-sage-800 shadow-sm' : 'text-ink-500 hover:text-navy-900'}`}>{option}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-5 py-3 text-[11px] font-medium text-ink-500 sm:px-6">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-sage-700" />Your booking</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[#dfe9e2]" />Reserved</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-line bg-white" />Available</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-ink-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Availability updated just now</span>
        </div>

        {view === 'week' ? (
          <WeekView events={filteredEvents} weekDate={weekDate} referenceDate={referenceDate} reduceMotion={reduceMotion} onEventSelect={setSelectedEvent} />
        ) : (
          <MonthView events={filteredEvents} monthDate={weekDate} referenceDate={referenceDate} onDaySelect={onDaySelect} onEventSelect={setSelectedEvent} reduceMotion={reduceMotion} />
        )}
      </section>
      <AnimatePresence>{selectedEvent ? <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} /> : null}</AnimatePresence>
    </>
  );
}
