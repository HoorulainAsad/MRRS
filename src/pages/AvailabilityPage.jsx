import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { mockRepository } from '../data/mockRepository';
import { useSession } from '../hooks/useSession';
import { ReservationDialog } from '../components/dashboard/ReservationDialog';

/* ── Constants ── */
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00–18:00
const SLOT_WIDTH = 80; // px per hour column
const ROW_LABEL_WIDTH = 180; // px

/* ── Status colors ── */
const STATUS_STYLE = {
  approved:        { bg: '#203D30', text: '#fff',     label: 'Reserved' },
  confirmed:       { bg: '#26364A', text: '#fff',     label: 'Confirmed' },
  pending_approval:{ bg: '#E5B45B', text: '#6b4c0e',  label: 'Pending' },
  checked_in:      { bg: '#1f7a3c', text: '#fff',     label: 'Checked in' },
  rejected:        { bg: '#D97777', text: '#fff',     label: 'Rejected' },
  cancelled:       { bg: '#c5c8c4', text: '#444',     label: 'Cancelled' },
};

function statusStyle(status) {
  return STATUS_STYLE[status] || { bg: '#e4e8f0', text: '#637068', label: status };
}

/* ── Helpers ── */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatHour(h) {
  return `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(`${d}T12:00:00Z`),
  );
}

function fmtFull(d) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${d}T12:00:00Z`),
  );
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

function weekStart(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7)); // Monday
  return isoDate(d);
}

function getWeekDates(anchor) {
  const mon = weekStart(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

function today() {
  return isoDate(new Date());
}

/* ── Legend ── */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[#637068]">
      {Object.entries(STATUS_STYLE).map(([, cfg]) => (
        <div key={cfg.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cfg.bg }} />
          <span>{cfg.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-[#E8EEE4]" />
        <span>Available</span>
      </div>
    </div>
  );
}

/* ── Reservation block inside a day cell ── */
function ReservationBlock({ reservation, roomName, onClick }) {
  const { startTime, endTime, status, purpose } = reservation;
  const startMin = toMinutes(startTime) - 8 * 60;
  const endMin = toMinutes(endTime) - 8 * 60;
  const totalMin = 10 * 60;
  const left = `${(startMin / totalMin) * 100}%`;
  const width = `${((endMin - startMin) / totalMin) * 100}%`;
  const style = statusStyle(status);

  return (
    <button
      type="button"
      onClick={() => onClick(reservation)}
      title={`${purpose || 'Reservation'} · ${startTime}–${endTime}`}
      className="absolute inset-y-1 rounded px-1.5 text-left text-[10px] font-semibold leading-tight truncate transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2"
      style={{ left, width, background: style.bg, color: style.text }}
    >
      <span className="block truncate">{purpose || style.label}</span>
      <span className="block opacity-80">{startTime}–{endTime}</span>
    </button>
  );
}

/* ── Day-view grid ── */
function DayGrid({ date, resources, reservations, onSlotClick, onReservationClick }) {
  const resForDate = reservations.filter((r) => r.date === date);
  const getResForRoom = (roomId) => resForDate.filter((r) => r.resourceId === roomId);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: ROW_LABEL_WIDTH + HOURS.length * SLOT_WIDTH }}>
        {/* Header */}
        <div className="flex border-b border-[#e4e8f0] bg-[#F7F8F4]">
          <div style={{ width: ROW_LABEL_WIDTH }} className="shrink-0 px-4 py-3 text-xs font-bold text-[#637068]">
            Room
          </div>
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ width: SLOT_WIDTH }}
              className="shrink-0 border-l border-[#e4e8f0] px-2 py-3 text-center text-[10px] font-bold text-[#637068]"
            >
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Room rows */}
        {resources.map((room) => {
          const roomReservations = getResForRoom(room.id);
          return (
            <div key={room.id} className="flex border-b border-[#e4e8f0] hover:bg-[#FAFAFA]">
              {/* Room label */}
              <div
                style={{ width: ROW_LABEL_WIDTH }}
                className="shrink-0 border-r border-[#e4e8f0] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[#26364A] truncate">{room.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#637068]">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  {room.capacity ?? '—'}
                </p>
              </div>

              {/* Time slots */}
              <div className="relative flex flex-1" style={{ height: 64 }}>
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onSlotClick({ resourceId: room.id, date, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h + 1).padStart(2, '0')}:00` })}
                    style={{ width: SLOT_WIDTH }}
                    className="shrink-0 border-l border-[#e4e8f0] hover:bg-[#E8EEE4]/60 transition-colors"
                    aria-label={`Book ${room.name} at ${formatHour(h)}`}
                  />
                ))}
                {/* Reservation blocks */}
                {roomReservations.map((r) => (
                  <ReservationBlock
                    key={r.id}
                    reservation={r}
                    roomName={room.name}
                    onClick={onReservationClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week-view: show 7 day columns with mini blocks ── */
function WeekGrid({ weekDates, resources, reservations, onSlotClick, onReservationClick }) {
  const todayStr = today();
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: ROW_LABEL_WIDTH + weekDates.length * 120 }}>
        {/* Header */}
        <div className="flex border-b border-[#e4e8f0] bg-[#F7F8F4]">
          <div style={{ width: ROW_LABEL_WIDTH }} className="shrink-0 px-4 py-3 text-xs font-bold text-[#637068]">
            Room
          </div>
          {weekDates.map((d) => (
            <div
              key={d}
              style={{ width: 120 }}
              className={`shrink-0 border-l border-[#e4e8f0] px-3 py-3 text-center ${d === todayStr ? 'bg-[#E8EEE4]' : ''}`}
            >
              <p className={`text-[11px] font-bold ${d === todayStr ? 'text-[#203D30]' : 'text-[#637068]'}`}>
                {fmtDate(d)}
              </p>
            </div>
          ))}
        </div>

        {/* Room rows */}
        {resources.map((room) => (
          <div key={room.id} className="flex border-b border-[#e4e8f0]">
            <div style={{ width: ROW_LABEL_WIDTH }} className="shrink-0 border-r border-[#e4e8f0] px-4 py-3">
              <p className="text-sm font-semibold text-[#26364A] truncate">{room.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#637068]">
                <Users className="h-3 w-3" aria-hidden="true" />
                {room.capacity ?? '—'}
              </p>
            </div>
            {weekDates.map((d) => {
              const dayReservations = reservations.filter(
                (r) => r.resourceId === room.id && r.date === d,
              );
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSlotClick({ resourceId: room.id, date: d, startTime: '09:00', endTime: '10:00' })}
                  style={{ width: 120 }}
                  className="relative shrink-0 border-l border-[#e4e8f0] p-1.5 hover:bg-[#F7F8F4] transition-colors"
                  aria-label={`Book ${room.name} on ${fmtDate(d)}`}
                >
                  <div className="space-y-0.5">
                    {dayReservations.slice(0, 3).map((r) => {
                      const style = statusStyle(r.status);
                      return (
                        <div
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); onReservationClick(r); }}
                          className="cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-semibold truncate"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {r.startTime} {r.purpose || style.label}
                        </div>
                      );
                    })}
                    {dayReservations.length > 3 && (
                      <span className="text-[9px] text-[#637068]">+{dayReservations.length - 3} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Month view ── */
function MonthGrid({ year, month, resources, reservations, onSlotClick, onReservationClick }) {
  const todayStr = today();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) => {
    if (i < startOffset) return null;
    const day = i - startOffset + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr;
  });

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[#e4e8f0] bg-[#F7F8F4]">
        {weekDayLabels.map((d) => (
          <div key={d} className="border-r border-[#e4e8f0] px-3 py-2 text-center text-[11px] font-bold text-[#637068] last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-[#e4e8f0] bg-[#FAFAFA] last:border-r-0" />;
          }
          const dayRes = reservations.filter((r) => r.date === dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={`min-h-[90px] border-b border-r border-[#e4e8f0] p-1.5 last:border-r-0 ${isToday ? 'bg-[#E8EEE4]/40' : 'hover:bg-[#FAFAFA]'}`}
            >
              <button
                type="button"
                onClick={() => onSlotClick({ date: dateStr, startTime: '09:00', endTime: '10:00' })}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-[#203D30] text-white' : 'text-[#26364A] hover:bg-[#E8EEE4]'}`}
              >
                {Number(dateStr.slice(-2))}
              </button>
              <div className="space-y-0.5">
                {dayRes.slice(0, 2).map((r) => {
                  const style = statusStyle(r.status);
                  return (
                    <div
                      key={r.id}
                      onClick={() => onReservationClick(r)}
                      className="cursor-pointer rounded px-1 py-0.5 text-[9px] font-semibold truncate"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {r.startTime} {r.purpose || style.label}
                    </div>
                  );
                })}
                {dayRes.length > 2 && (
                  <span className="text-[9px] text-[#637068]">+{dayRes.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Reservation Detail Modal ── */
function ReservationDetailModal({ reservation, resources, onClose }) {
  const room = resources.find((r) => r.id === reservation.resourceId);
  const style = statusStyle(reservation.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl border border-[#e4e8f0] bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#e4e8f0] px-5 py-4">
          <div>
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold"
              style={{ background: style.bg, color: style.text }}
            >
              {style.label}
            </span>
            <h3 className="mt-2 text-base font-bold text-[#26364A]">{reservation.purpose || 'Reservation'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#637068] hover:bg-[#F7F8F4]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm">
          <Row icon={<Calendar className="h-4 w-4" />} label="Room" value={room?.name || reservation.resourceId} />
          <Row icon={<Calendar className="h-4 w-4" />} label="Date" value={fmtDate(reservation.date)} />
          <Row icon={<Clock className="h-4 w-4" />} label="Time" value={`${reservation.startTime} – ${reservation.endTime}`} />
          <Row icon={<Users className="h-4 w-4" />} label="Capacity" value={room?.capacity ? `${room.capacity} seats` : '—'} />
          {reservation.notes && (
            <Row icon={<Info className="h-4 w-4" />} label="Notes" value={reservation.notes} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#637068]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-[#637068]">{label}</p>
        <p className="text-sm font-medium text-[#1e2a24]">{value}</p>
      </div>
    </div>
  );
}

/* ── Main page ── */
export function AvailabilityPage() {
  const { session } = useSession();
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(today());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newReservationSelection, setNewReservationSelection] = useState(null);
  const [roomFilter, setRoomFilter] = useState('all');

  const resources = useMemo(
    () => mockRepository.listResources(session.companyId).filter((r) => r.kind === 'reusable'),
    [session.companyId],
  );

  const reservations = useMemo(
    () => mockRepository.listReservations(session.companyId),
    [session.companyId],
  );

  const filteredResources = useMemo(
    () => (roomFilter === 'all' ? resources : resources.filter((r) => r.id === roomFilter)),
    [resources, roomFilter],
  );

  const navigate = (direction) => {
    if (view === 'day') setAnchor((a) => addDays(a, direction));
    else if (view === 'week') setAnchor((a) => addDays(a, direction * 7));
    else {
      const d = new Date(`${anchor}T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + direction);
      setAnchor(isoDate(d));
    }
  };

  const goToday = () => setAnchor(today());

  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);
  const anchorDate = new Date(`${anchor}T12:00:00Z`);

  const headerLabel = () => {
    if (view === 'day') return fmtFull(anchor);
    if (view === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${fmtDate(start)} – ${fmtDate(end)}`;
    }
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
      new Date(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1),
    );
  };

  return (
    <div className="pb-10">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#26364A]">Availability Calendar</h1>
          <p className="mt-1 text-sm text-[#637068]">View and book available rooms across your workspace.</p>
        </div>
        <button
          type="button"
          onClick={() => setNewReservationSelection({ date: anchor, startTime: '09:00', endTime: '10:00' })}
          className="inline-flex items-center gap-2 rounded-lg bg-[#203D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Reservation
        </button>
      </div>

      {/* Controls bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 shadow-soft">
        {/* Nav */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e8f0] text-[#637068] hover:bg-[#F7F8F4]"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[200px] text-center text-sm font-semibold text-[#26364A]">{headerLabel()}</span>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e8f0] text-[#637068] hover:bg-[#F7F8F4]"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-[#e4e8f0] px-3 py-1.5 text-xs font-semibold text-[#26364A] hover:bg-[#F7F8F4]"
        >
          Today
        </button>

        {/* Room filter */}
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-lg border border-[#e4e8f0] bg-white px-3 py-1.5 text-xs text-[#1e2a24] outline-none focus:border-[#203D30]"
        >
          <option value="all">All Rooms</option>
          {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {/* View switcher */}
        <div className="ml-auto flex rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] p-0.5">
          {['day', 'week', 'month'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                view === v ? 'bg-white text-[#203D30] shadow-sm' : 'text-[#637068] hover:text-[#26364A]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 px-1">
        <Legend />
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-soft">
        {view === 'day' && (
          <DayGrid
            date={anchor}
            resources={filteredResources}
            reservations={reservations}
            onSlotClick={setNewReservationSelection}
            onReservationClick={setSelectedReservation}
          />
        )}
        {view === 'week' && (
          <WeekGrid
            weekDates={weekDates}
            resources={filteredResources}
            reservations={reservations}
            onSlotClick={setNewReservationSelection}
            onReservationClick={setSelectedReservation}
          />
        )}
        {view === 'month' && (
          <MonthGrid
            year={anchorDate.getUTCFullYear()}
            month={anchorDate.getUTCMonth()}
            resources={filteredResources}
            reservations={reservations}
            onSlotClick={setNewReservationSelection}
            onReservationClick={setSelectedReservation}
          />
        )}
      </div>

      {/* Reservation detail modal */}
      <AnimatePresence>
        {selectedReservation && (
          <ReservationDetailModal
            reservation={selectedReservation}
            resources={resources}
            onClose={() => setSelectedReservation(null)}
          />
        )}
      </AnimatePresence>

      {/* New reservation dialog */}
      <AnimatePresence>
        {newReservationSelection && (
          <ReservationDialog
            key="new"
            session={session}
            resources={resources}
            initialSelection={newReservationSelection}
            onClose={() => setNewReservationSelection(null)}
            onSubmitted={() => setNewReservationSelection(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
