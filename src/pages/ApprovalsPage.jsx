import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  AlertCircle,
  History,
  ShieldCheck,
  ArrowRight,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { approveReservation, rejectReservation } from '../services/reservationService';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { RESERVATION_STATUS } from '../domain/reservationStatus';
import { can, reservationTarget } from '../services/authorization';

export function ApprovalsPage() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('actionable'); // 'actionable' | 'all-pending' | 'decisions'
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Load all reservations, resources, and users
  const reservations = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listReservations(session.companyId);
  }, [session?.companyId, refreshKey]);

  const resources = useMemo(() => {
    if (!session?.companyId) return new Map();
    const list = mockRepository.listResources(session.companyId);
    return new Map(list.map((r) => [r.id, r]));
  }, [session?.companyId, refreshKey]);

  const users = useMemo(() => {
    if (!session?.companyId) return new Map();
    const list = mockRepository.listUsers(session.companyId);
    return new Map(list.map((u) => [u.id, u]));
  }, [session?.companyId]);

  // Determine if a reservation is actionable by current session
  const isActionable = (reservation) => {
    if (reservation.status !== RESERVATION_STATUS.pending) return false;
    const resource = resources.get(reservation.resourceId);
    if (!resource?.approvalPolicy?.requiresApproval) return false;

    const step = resource.approvalPolicy.steps[reservation.currentApprovalStep];
    if (!step) return false;

    const hasPermission = can(session, 'approve', reservationTarget(reservation));
    const hasRole = session.roleAssignments.some((a) => step.roleIds.includes(a.roleId));
    return hasPermission && hasRole;
  };

  // Filter requests
  const filteredList = useMemo(() => {
    return reservations.filter((res) => {
      const resource = resources.get(res.resourceId);

      if (activeTab === 'actionable') {
        if (!isActionable(res)) return false;
      } else if (activeTab === 'all-pending') {
        if (res.status !== RESERVATION_STATUS.pending) return false;
      } else if (activeTab === 'decisions') {
        if (
          res.status === RESERVATION_STATUS.pending ||
          !resource?.approvalPolicy?.requiresApproval
        )
          return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const rName = resource?.name?.toLowerCase() || '';
        const purpose = res.purpose?.toLowerCase() || '';
        const uName = users.get(res.requesterId)?.name?.toLowerCase() || '';
        return rName.includes(q) || purpose.includes(q) || uName.includes(q);
      }

      return true;
    });
  }, [reservations, resources, users, activeTab, searchQuery, session]);

  // Counts
  const counts = useMemo(() => {
    let actionable = 0;
    let totalPending = 0;
    let completed = 0;

    reservations.forEach((r) => {
      const res = resources.get(r.resourceId);
      if (r.status === RESERVATION_STATUS.pending) {
        totalPending += 1;
        if (isActionable(r)) actionable += 1;
      } else if (res?.approvalPolicy?.requiresApproval) {
        completed += 1;
      }
    });

    return { actionable, totalPending, completed };
  }, [reservations, resources, session]);

  // Handle Approve
  const handleApprove = async (reservationId) => {
    try {
      await approveReservation(session, reservationId);
      setRefreshKey((k) => k + 1);
      alert('Approval confirmed! Reservation progressed to next step or finalized.');
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;

    try {
      await rejectReservation(session, rejectingItem.id, rejectReason.trim());
      setRejectingItem(null);
      setRejectReason('');
      setRefreshKey((k) => k + 1);
      alert('Reservation rejected and notified to requester.');
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
            <ClipboardCheck className="h-3.5 w-3.5 text-sage-600" />
            Approval Governance
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Approval Queue & Review Desk
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Review pending workspace reservation requests, evaluate urgency, and advance multi-step workflows.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Awaiting Your Decision
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-navy-900">
            {counts.actionable}
          </p>
          <p className="mt-1 text-xs text-ink-500">Assigned directly to your role</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Total Organization Pending
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-sage-100 text-sage-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-navy-900">
            {counts.totalPending}
          </p>
          <p className="mt-1 text-xs text-ink-500">Across all workflow stages</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Reviewed Decisions
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-mist-100 text-navy-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-navy-900">
            {counts.completed}
          </p>
          <p className="mt-1 text-xs text-ink-500">Approved or rejected records</p>
        </div>
      </div>

      {/* Controls & Filter Tabs */}
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-2xl bg-mist-100 p-1">
          <button
            onClick={() => setActiveTab('actionable')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === 'actionable'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-ink-500 hover:text-navy-900'
            }`}
          >
            Actionable for You ({counts.actionable})
          </button>
          <button
            onClick={() => setActiveTab('all-pending')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === 'all-pending'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-ink-500 hover:text-navy-900'
            }`}
          >
            All Pending ({counts.totalPending})
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === 'decisions'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-ink-500 hover:text-navy-900'
            }`}
          >
            Decisions History
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by requester or space..."
            className="w-full rounded-2xl border border-line bg-mist-50/60 py-2.5 pl-9 pr-4 text-xs font-medium text-navy-900 focus:border-sage-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredList.map((res) => {
          const resource = resources.get(res.resourceId);
          const requester = users.get(res.requesterId);
          const policy = resource?.approvalPolicy;
          const currentStepIndex = res.currentApprovalStep ?? 0;
          const currentStep = policy?.steps?.[currentStepIndex];
          const canAct = isActionable(res);

          return (
            <motion.article
              key={res.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-soft transition-all hover:shadow-hover"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Details */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-navy-900">
                      {resource?.name || 'Space'}
                    </span>
                    <StatusBadge status={res.status} />
                    {res.priority && res.priority !== 'normal' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                        {res.priority} priority
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-ink-600">
                    Purpose: <span className="font-bold text-navy-900">{res.purpose || 'None'}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-ink-400" />
                      <span>{requester?.name || 'Member'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-ink-400" />
                      <span>{res.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-ink-400" />
                      <span>
                        {res.startTime} – {res.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Multi-step Workflow Progress Bar */}
                  {policy?.requiresApproval && policy.steps.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">
                        Approval Chain:
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {policy.steps.map((step, idx) => {
                          const isDone = idx < currentStepIndex || res.status === RESERVATION_STATUS.confirmed;
                          const isCurrent = idx === currentStepIndex && res.status === RESERVATION_STATUS.pending;
                          return (
                            <div key={step.id} className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
                                  isDone
                                    ? 'bg-sage-100 text-sage-800'
                                    : isCurrent
                                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                                    : 'bg-mist-100 text-ink-400'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-sage-600" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                Step {idx + 1}: {step.label}
                              </span>
                              {idx < policy.steps.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-ink-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {res.status === RESERVATION_STATUS.rejected && res.rejectionReason && (
                    <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                      <span className="font-bold">Rejection Note:</span> {res.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canAct && (
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="secondary"
                      onClick={() => setRejectingItem(res)}
                      className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 text-xs px-4 py-2.5"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>

                    <Button
                      onClick={() => handleApprove(res.id)}
                      className="gap-1.5 bg-sage-700 text-white hover:bg-sage-800 text-xs px-4 py-2.5 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Request
                    </Button>
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}

        {filteredList.length === 0 && (
          <div className="rounded-3xl border border-line bg-white p-12 text-center shadow-soft">
            <ClipboardCheck className="mx-auto h-12 w-12 text-ink-300" />
            <h3 className="mt-3 text-base font-bold text-navy-900">
              No requests waiting for review
            </h3>
            <p className="mt-1 text-xs text-ink-500">
              All reservation requests in this category have been processed.
            </p>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h3 className="text-base font-bold text-navy-900">Reject Reservation</h3>
                <button
                  onClick={() => setRejectingItem(null)}
                  className="rounded-xl p-1 text-ink-400 hover:bg-mist-100 hover:text-navy-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a clear explanation for the requester..."
                    className="mt-1.5 w-full rounded-2xl border border-line bg-mist-50/50 px-4 py-2 text-xs font-medium text-navy-900 focus:border-sage-500 focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-ink-400">
                    The requester will receive an automated notification with this explanation.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRejectingItem(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-700">
                    Confirm Rejection
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
