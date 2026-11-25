import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Clock3, MapPin, Plus, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuickBook({ data, onChange, onBook, resourceCount = 0 }) {
  const reduceMotion = useReducedMotion();
  const spaces = data?.spaces || [];

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft" aria-labelledby="quick-book-title">
      <div className="border-b border-line px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-sage-700"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
              <h2 id="quick-book-title" className="text-lg font-bold tracking-tight text-navy-900">Quick book</h2>
            </div>
            <p className="mt-2 text-xs text-ink-500">A little space for your next big idea.</p>
          </div>
          <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sage-700">Live demo</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Date</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" aria-hidden="true" />
              <input type="date" value={data?.date || ''} onChange={(event) => onChange({ date: event.target.value })} className="h-11 w-full rounded-xl border border-line bg-mist-50/60 pl-10 pr-3 text-xs font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white" />
            </span>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Duration</span>
            <span className="relative block">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sage-600" aria-hidden="true" />
              <select value={data?.duration || 60} onChange={(event) => onChange({ duration: Number(event.target.value) })} className="h-11 w-full appearance-none rounded-xl border border-line bg-mist-50/60 pl-9 pr-3 text-xs font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">
                {[30, 60, 90, 120].map((duration) => <option key={duration} value={duration}>{duration} min</option>)}
              </select>
            </span>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Capacity</span>
            <span className="relative block">
              <UsersRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sage-600" aria-hidden="true" />
              <select value={data?.capacity || 1} onChange={(event) => onChange({ capacity: Number(event.target.value) })} className="h-11 w-full appearance-none rounded-xl border border-line bg-mist-50/60 pl-9 pr-3 text-xs font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">
                {[1, 2, 4, 6, 8, 10].map((capacity) => <option key={capacity} value={capacity}>{capacity}+ people</option>)}
              </select>
            </span>
          </label>
        </div>
      </div>

      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-5 py-2">
        <AnimatePresence mode="popLayout">
          {spaces.map((space, index) => {
            const availableSlots = (space.slots || []).filter((slot) => slot.available).slice(0, 2);
            return (
              <motion.article
                layout
                key={space.resourceId}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? false : { opacity: 0, y: -6 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
                className="border-b border-line py-4 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  {space.image ? <img src={space.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage-100 text-sage-700"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="truncate text-sm font-bold text-navy-900">{space.name}</h3>
                        <p className="mt-1 flex items-center gap-2 text-[10px] font-medium text-ink-500"><span className="flex items-center gap-1"><UsersRound className="h-3 w-3" aria-hidden="true" />{space.capacity}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{space.floor}</span></p>
                      </div>
                      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${availableSlots.length ? 'bg-emerald-500' : 'bg-stone-300'}`} aria-label={availableSlots.length ? 'Slots available' : 'Fully booked'} />
                    </div>
                  </div>
                </div>
                {availableSlots.length ? (
                  <div className="mt-3 flex gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => onBook({ resourceId: space.resourceId, date: data.date, startTime: slot.startTime, endTime: slot.endTime })}
                        className="flex min-h-9 flex-1 items-center justify-between rounded-xl border border-sage-200 bg-sage-50 px-3 text-xs font-bold text-sage-800 transition-colors hover:border-sage-500 hover:bg-sage-100"
                        aria-label={`Book ${space.name} on ${data.date} from ${slot.startTime} to ${slot.endTime}`}
                      >
                        {slot.startTime}<Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-mist-50 px-3 py-2.5 text-center text-[11px] font-semibold text-ink-500">No slots for these filters</p>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
        {!spaces.length ? (
          <div className="py-10 text-center">
            <UsersRound className="mx-auto h-6 w-6 text-sage-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-navy-900">No spaces match these filters</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">Try a smaller group or another date.</p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line bg-mist-50/50 px-5 py-4">
        <Link to="/app/resources" className="flex min-h-10 items-center justify-between rounded-xl px-2 text-xs font-bold text-sage-700 transition-colors hover:bg-sage-50">
          Explore all {resourceCount} spaces <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
