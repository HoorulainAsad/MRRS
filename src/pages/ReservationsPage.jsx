import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Filter,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { mockRepository } from '../data/mockRepository';
import { useSession } from '../hooks/useSession';
import { canAccessRoute, getRouteByPath } from '../routes/registry';
import { ReservationDialog } from '../components/dashboard/ReservationDialog';

/* ── Status map ── */
const STATUS_MAP = {
  approved:         { label: 'Approved',  bg: '#E8F5EC', text: '#1f7a3c' },
  confirmed:        { label: 'Confirmed', bg: '#E8F5EC', text: '#1f7a3c' },
  pending_approval: { label: 'Pending',   bg: '#FDF3E0', text: '#b07d20' },
  checked_in:       { label: 'Checked in',bg: '#EEF1F8', text: '#26364A' },
  rejected:         { label: 'Rejected',  bg: '#FDE8E8', text: '#b04040' },
  cancelled:        { label: 'Cancelled', bg: '#F5F5F5', text: '#637068' },
};

function StatusPill({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, bg: '#F5F5F5', text: '#637068' };
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  );
}

function fmt(d) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${d}T12:00:00Z`),
  );
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const ALL_STATUSES = ['all', 'pending_approval', 'approved', 'confirmed', 'checked_in', 'rejected', 'cancelled'];

export function ReservationsPage() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newDialog, setNewDialog] = useState(null);
  const [retry, setRetry] = useState(0);
  const canApprove = canAccessRoute(session, getRouteByPath('/app/approvals'));

  const resources = useMemo(() => mockRepository.listResources(session.companyId), [session.companyId, retry]);
  const users = useMemo(() => mockRepository.listUsers(session.companyId), [session.companyId]);

  const reservations = useMemo(() => {
    const all = mockRepository.listReservations(session.companyId);
    return all
      .map((r) => ({
        ...r,
        roomName: resources.find((res) => res.id === r.resourceId)?.name || r.resourceId,
        requesterName: users.find((u) => u.id === r.userId)?.name || r.userId,
      }))
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return r.roomName.toLowerCase().includes(q) || r.requesterName.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  }, [session.companyId, resources, users, statusFilter, search, retry]);

  const handleApprove = (id) => {
    try { mockRepository.updateReservation(session.companyId, id, { status: 'approved' }); setRetry((v) => v + 1); } catch { /* noop */ }
  };
  const handleReject = (id) => {
    try { mockRepository.updateReservation(session.companyId, id, { status: 'rejected' }); setRetry((v) => v + 1); } catch { /* noop */ }
  };
  const handleCancel = (id) => {
    try { mockRepository.updateReservation(session.companyId, id, { status: 'cancelled' }); setRetry((v) => v + 1); } catch { /* noop */ }
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#26364A]">Reservations</h1>
          <p className="mt-1 text-sm text-[#637068]">{reservations.length} reservation{reservations.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          type="button"
          onClick={() => setNewDialog({})}
          className="inline-flex items-center gap-2 rounded-lg bg-[#203D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Reservation
        </button>
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 shadow-soft">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#637068]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room or requester…"
            className="h-9 w-full rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] pl-9 pr-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30] focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#203D30] text-white'
                  : 'border border-[#e4e8f0] bg-white text-[#637068] hover:bg-[#F7F8F4]'
              }`}
            >
              {s === 'all' ? 'All' : (STATUS_MAP[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e4e8f0] text-sm">
            <thead className="bg-[#F7F8F4]">
              <tr>
                {['Room', 'Requester', 'Date', 'Time', 'Status', 'Actions'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[#637068]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e8f0]">
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#637068]">
                    No reservations match your filters.
                  </td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F8F4]">
                  <td className="px-4 py-3 font-medium text-[#1e2a24]">{r.roomName}</td>
                  <td className="px-4 py-3 text-[#637068]">{r.requesterName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#637068]">{fmt(r.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#637068]">
                    {fmtTime(r.startTime)} – {fmtTime(r.endTime)}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canApprove && r.status === 'pending_approval' && (
                        <>
                          <button onClick={() => handleApprove(r.id)} className="rounded-md bg-[#203D30] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#162b22]">Approve</button>
                          <button onClick={() => handleReject(r.id)} className="rounded-md border border-[#e4e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#b04040] hover:bg-[#FDE8E8]">Reject</button>
                        </>
                      )}
                      {['approved', 'confirmed', 'pending_approval'].includes(r.status) && (
                        <button onClick={() => handleCancel(r.id)} className="rounded-md border border-[#e4e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#637068] hover:bg-[#F7F8F4]">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New reservation dialog */}
      <AnimatePresence>
        {newDialog !== null && (
          <ReservationDialog
            key="res-dialog"
            session={session}
            resources={resources}
            initialSelection={newDialog}
            onClose={() => setNewDialog(null)}
            onSubmitted={() => { setNewDialog(null); setRetry((v) => v + 1); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
