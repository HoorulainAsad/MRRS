import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, LoaderCircle, MapPin, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { DEMO_TODAY } from '../../services/dashboardService';
import { submitReservation } from '../../services/reservationService';

const TIME_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const hours = 8 + Math.floor(index / 2);
  const minutes = index % 2 ? '30' : '00';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
});

function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDate(value) {
  if (!value) return 'Choose a date';
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function ReservationDialog({ session, resources = [], initialSelection, onClose, onSubmitted }) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const initialResource = resources.find((resource) => resource.id === initialSelection?.resourceId) || resources[0];
  const [form, setForm] = useState({
    resourceId: initialResource?.id || '',
    date: initialSelection?.date || DEMO_TODAY,
    startTime: initialSelection?.startTime || '09:00',
    endTime: initialSelection?.endTime || '10:00',
    purpose: initialSelection?.purpose || '',
    priority: 'normal',
    quantity: 1,
  });
  const [step, setStep] = useState('details');
  const [reviewed, setReviewed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState(null);
  const resource = useMemo(
    () => resources.find((candidate) => candidate.id === form.resourceId) || initialResource,
    [resources, form.resourceId, initialResource],
  );

  const handleClose = useCallback(() => {
    if (submitting) return;
    if (step === 'success') onSubmitted?.();
    onClose();
  }, [onClose, onSubmitted, step, submitting]);

  useEffect(() => {
    const previousActive = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const update = (field, value) => {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reviewReservation = (event) => {
    event.preventDefault();
    if (!form.resourceId || !form.date || !form.startTime || !form.endTime) {
      setError('Choose a space, date, start time, and end time.');
      return;
    }
    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) {
      setError('End time must be later than start time.');
      return;
    }
    setError('');
    setStep('review');
  };

  const confirmReservation = async () => {
    if (!reviewed || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await submitReservation(session, {
        resourceId: form.resourceId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        priority: form.priority,
        quantity: resource?.kind === 'consumable' ? form.quantity : 1,
      });
      setReservation(created);
      setStep('success');
    } catch (submissionError) {
      setError(submissionError.message || 'The reservation could not be submitted. Review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-sage-950/35 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-dialog-title"
        className="my-auto w-full max-w-[560px] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
      >
        <header className="relative overflow-hidden border-b border-line bg-sage-50 px-6 py-5">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-sage-200/50 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-700"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />SpaceFlow reservation</p>
              <h2 id="reservation-dialog-title" className="mt-2 text-2xl font-bold tracking-tight text-navy-900">
                {step === 'details' ? 'Find your focus.' : step === 'review' ? 'Review your reservation.' : 'You’re all set.'}
              </h2>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                {step === 'details' ? 'Choose the details. Nothing is submitted until you confirm.' : step === 'review' ? 'Check everything once more before continuing.' : 'Your request is recorded in the browser demo.'}
              </p>
            </div>
            <button type="button" onClick={handleClose} disabled={submitting} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-white hover:text-navy-900 disabled:opacity-40" aria-label="Close reservation dialog"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
          <div className="relative mt-5 flex items-center gap-2" aria-label={`Reservation step: ${step}`}>
            {['details', 'review', 'success'].map((item, index) => (
              <div key={item} className="flex flex-1 items-center gap-2">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${step === item || (step === 'success' && index < 2) ? 'bg-sage-700 text-white' : 'bg-white text-ink-500 ring-1 ring-line'}`}>{step === 'success' || index < ['details', 'review', 'success'].indexOf(step) ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}</span>
                {index < 2 ? <span className={`h-px flex-1 ${index < ['details', 'review', 'success'].indexOf(step) ? 'bg-sage-500' : 'bg-line'}`} /> : null}
              </div>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {step === 'details' ? (
            <motion.form key="details" onSubmit={reviewReservation} className="space-y-5 px-6 py-6" initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? false : { opacity: 0, x: -8 }}>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-navy-900">Space</span>
                <select value={form.resourceId} onChange={(event) => update('resourceId', event.target.value)} required className="h-12 w-full rounded-xl border border-line bg-mist-50/60 px-4 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">
                  {!resources.length ? <option value="">No spaces available</option> : null}
                  {resources.map((option) => <option key={option.id} value={option.id}>{option.name}{option.capacity ? ` · ${option.capacity} people` : ''}</option>)}
                </select>
              </label>

              {resource ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-sage-50 px-4 py-3 text-xs font-medium text-sage-800">
                  {resource.location ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{resource.location}</span> : null}
                  {resource.capacity ? <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" aria-hidden="true" />Up to {resource.capacity} people</span> : null}
                  {resource.requiresApproval ? <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Approval required</span> : <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />No-workflow policy</span>}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-navy-900">Date</span>
                <span className="relative block">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" aria-hidden="true" />
                  <input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required className="h-12 w-full rounded-xl border border-line bg-mist-50/60 pl-11 pr-4 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white" />
                </span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="mb-2 block text-xs font-bold text-navy-900">Start</span>
                  <span className="relative block">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" aria-hidden="true" />
                    <select value={form.startTime} onChange={(event) => update('startTime', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-line bg-mist-50/60 pl-10 pr-3 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">{TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}</select>
                  </span>
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-navy-900">End</span>
                  <span className="relative block">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" aria-hidden="true" />
                    <select value={form.endTime} onChange={(event) => update('endTime', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-line bg-mist-50/60 pl-10 pr-3 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">{TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}</select>
                  </span>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-navy-900">What are you working on? <span className="font-medium text-ink-500">(optional)</span></span>
                <textarea value={form.purpose} onChange={(event) => update('purpose', event.target.value)} rows={2} maxLength={160} placeholder="e.g. Product planning with the design team" className="w-full resize-none rounded-xl border border-line bg-mist-50/60 px-4 py-3 text-sm text-navy-900 outline-none placeholder:text-stone-400 focus:border-sage-500 focus:bg-white" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-bold text-navy-900">Priority</span>
                  <select value={form.priority} onChange={(event) => update('priority', event.target.value)} className="h-12 w-full rounded-xl border border-line bg-mist-50/60 px-4 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white">
                    {['low', 'normal', 'high', 'urgent'].map((priority) => <option key={priority} value={priority} className="capitalize">{priority}</option>)}
                  </select>
                </label>
                {resource?.kind === 'consumable' ? (
                  <label>
                    <span className="mb-2 block text-xs font-bold text-navy-900">Quantity</span>
                    <input type="number" min="1" step="1" value={form.quantity} onChange={(event) => update('quantity', Number(event.target.value))} className="h-12 w-full rounded-xl border border-line bg-mist-50/60 px-4 text-sm font-semibold text-navy-900 outline-none focus:border-sage-500 focus:bg-white" />
                  </label>
                ) : null}
              </div>

              {error ? <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <p className="max-w-56 text-[10px] leading-4 text-ink-500">Browser mock only. No live booking or email is sent.</p>
                <Button type="submit" disabled={!resources.length}>Review reservation <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
              </div>
            </motion.form>
          ) : null}

          {step === 'review' ? (
            <motion.div key="review" className="px-6 py-6" initial={reduceMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? false : { opacity: 0, x: 8 }}>
              <div className="overflow-hidden rounded-2xl border border-line">
                <div className="flex items-start gap-4 bg-sage-50 p-5">
                  {resource?.image ? <img src={resource.image} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sage-100 text-sage-700"><CalendarDays className="h-6 w-6" aria-hidden="true" /></span>}
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-sage-700">Your space</p><h3 className="mt-1 text-lg font-bold text-navy-900">{resource?.name}</h3>{resource?.location ? <p className="mt-1 flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3 w-3" aria-hidden="true" />{resource.location}</p> : null}</div>
                </div>
                <dl className="grid gap-4 p-5 sm:grid-cols-2">
                  <div><dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Date</dt><dd className="mt-1 text-sm font-semibold text-navy-900">{formatDate(form.date)}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Time</dt><dd className="mt-1 text-sm font-semibold text-navy-900">{form.startTime} – {form.endTime}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Purpose</dt><dd className="mt-1 text-sm font-semibold text-navy-900">{form.purpose.trim() || 'General workspace session'}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Priority</dt><dd className="mt-1 text-sm font-semibold capitalize text-navy-900">{form.priority}</dd></div>
                </dl>
              </div>

              <div className="mt-4 rounded-2xl border border-sage-200 bg-sage-50 p-4 text-xs leading-5 text-sage-800">
                <p className="flex items-start gap-2 font-semibold"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{resource?.requiresApproval ? 'This space requires its configured approval workflow.' : 'This space uses the demo no-workflow policy.'}</p>
                <p className="mt-1 text-sage-700/80">{resource?.requiresApproval ? 'Your request will remain pending until the assigned roles approve it in order.' : 'If the slot is valid and available, the browser mock will confirm it immediately.'}</p>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
                <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-sage-700" />
                <span className="text-sm font-medium leading-5 text-navy-900">I have reviewed the space, date, time, and workflow policy.</span>
              </label>
              {error ? <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                <Button variant="ghost" onClick={() => { setStep('details'); setError(''); }} disabled={submitting}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Edit details</Button>
                <Button onClick={confirmReservation} disabled={!reviewed || submitting}>
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                  {submitting ? 'Submitting…' : resource?.requiresApproval ? 'Submit for approval' : 'Confirm reservation'}
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 'success' ? (
            <motion.div key="success" className="px-6 py-8 text-center" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage-100 text-sage-700 ring-8 ring-sage-50"><CheckCircle2 className="h-8 w-8" aria-hidden="true" /></span>
              <h3 className="mt-5 text-xl font-bold text-navy-900">{reservation?.status === 'confirmed' ? 'Reservation confirmed' : 'Submitted for approval'}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">{reservation?.status === 'confirmed' ? `${resource?.name} is reserved for ${formatDate(form.date)}, ${form.startTime}–${form.endTime}.` : `${resource?.name} is pending the configured review workflow. You can track it in Reservations.`}</p>
              <p className="mt-4 text-[10px] leading-4 text-ink-500">Demo data only. No live booking or email notification was sent.</p>
              <Button className="mt-6 w-full" onClick={handleClose}>Back to my workspace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
