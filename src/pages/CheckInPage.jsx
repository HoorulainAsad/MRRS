import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  CheckCircle2,
  Clock,
  QrCode,
  Building2,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { checkInReservation } from '../services/reservationService';
import { Button } from '../components/ui/Button';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { RESERVATION_STATUS } from '../domain/reservationStatus';

export function CheckInPage() {
  const { session } = useSession();
  const [selectedDate, setSelectedDate] = useState('2026-11-24');
  const [qrModalItem, setQrModalItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load reservations for this company
  const reservations = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listReservations(session.companyId);
  }, [session?.companyId, refreshKey]);

  const resources = useMemo(() => {
    if (!session?.companyId) return new Map();
    const list = mockRepository.listResources(session.companyId);
    return new Map(list.map((r) => [r.id, r]));
  }, [session?.companyId]);

  const users = useMemo(() => {
    if (!session?.companyId) return new Map();
    const list = mockRepository.listUsers(session.companyId);
    return new Map(list.map((u) => [u.id, u]));
  }, [session?.companyId]);

  // Today's eligible confirmed bookings for this user & team
  const checkInList = useMemo(() => {
    return reservations.filter((r) => {
      const resource = resources.get(r.resourceId);
      if (resource?.kind === 'consumable') return false; // Check-in is for spaces/equipment
      return r.date === selectedDate;
    });
  }, [reservations, resources, selectedDate]);

  // Handle Check-in Action
  const handleCheckIn = async (reservationId) => {
    try {
      await checkInReservation(session, reservationId);
      setRefreshKey((k) => k + 1);
      alert('Success! Check-in confirmed and timestamp saved.');
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
              <MapPin className="h-3.5 w-3.5 text-sage-600" />
              Arrival Desk
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Space Check-in Console
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Confirm on-site arrival for today's reserved spaces to keep your reservation active and prevent slot release.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2 shadow-soft">
          <Calendar className="h-4 w-4 text-sage-600" />
          <span className="text-xs font-bold text-navy-900">Today: {selectedDate}</span>
        </div>
      </div>

      {/* Check-in Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {checkInList.map((res) => {
          const resource = resources.get(res.resourceId);
          const requester = users.get(res.requesterId);
          const isMine = res.requesterId === session?.userId;
          const isConfirmed = res.status === RESERVATION_STATUS.confirmed;
          const isCheckedIn = Boolean(res.checkedInAt);
          const canCheckIn = isMine && isConfirmed && !isCheckedIn;

          return (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-3xl border p-6 shadow-soft transition-all ${
                isCheckedIn
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isConfirmed
                  ? 'border-line bg-white hover:shadow-hover'
                  : 'border-line/60 bg-mist-50/50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${
                      isCheckedIn
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sage-100 text-sage-800'
                    }`}
                  >
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy-900">
                      {resource?.name || 'Space'}
                    </h2>
                    <p className="text-xs text-ink-500">
                      {resource?.location || 'Floor 1'} · {resource?.floor}
                    </p>
                  </div>
                </div>

                <StatusBadge status={res.status} />
              </div>

              {/* Time & Requester Info */}
              <div className="mt-5 space-y-2 rounded-2xl border border-line/60 bg-mist-50/50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Reserved Slot:
                  </span>
                  <span className="font-bold text-navy-900">
                    {res.startTime} – {res.endTime}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Booked By:</span>
                  <span className="font-semibold text-navy-900">
                    {requester?.name || 'Member'} {isMine && '(You)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Purpose:</span>
                  <span className="font-medium text-navy-900 truncate max-w-[200px]">
                    {res.purpose || 'General meeting'}
                  </span>
                </div>

                {isCheckedIn && (
                  <div className="flex items-center justify-between pt-2 border-t border-line text-emerald-800 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Checked in at:
                    </span>
                    <span>
                      {new Date(res.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setQrModalItem(res)}
                  className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-600 hover:bg-mist-50 hover:text-navy-900"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Show Badge
                </button>

                {canCheckIn ? (
                  <Button
                    onClick={() => handleCheckIn(res.id)}
                    className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 text-xs px-4 py-2.5"
                  >
                    <UserCheck className="h-4 w-4" />
                    Confirm Arrival
                  </Button>
                ) : isCheckedIn ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Arrival Confirmed
                  </span>
                ) : (
                  <span className="text-xs text-ink-400">
                    {!isMine ? 'Belongs to colleague' : 'Awaiting confirmation'}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {checkInList.length === 0 && (
        <div className="rounded-3xl border border-line bg-white p-12 text-center shadow-soft">
          <MapPin className="mx-auto h-12 w-12 text-ink-300" />
          <h3 className="mt-3 text-base font-bold text-navy-900">
            No reservations scheduled for today
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Check the calendar or create a new reservation to reserve a space.
          </p>
        </div>
      )}

      {/* QR Badge Simulation Modal */}
      <AnimatePresence>
        {qrModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-2xl text-center"
            >
              <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-sage-100 text-sage-800">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-navy-900">
                Workspace Digital Pass
              </h3>
              <p className="text-xs text-ink-500 mt-1">
                Scan or display at room display terminal
              </p>

              {/* QR Code SVG simulation */}
              <div className="my-6 mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-sage-300 bg-mist-50 p-4">
                <QrCode className="h-32 w-32 text-navy-900 opacity-90" />
              </div>

              <div className="rounded-2xl bg-mist-100/70 p-3 text-xs text-left">
                <p className="font-bold text-navy-900">
                  {resources.get(qrModalItem.resourceId)?.name}
                </p>
                <p className="text-ink-500">
                  Slot: {qrModalItem.startTime} – {qrModalItem.endTime}
                </p>
                <p className="text-[10px] text-ink-400 mt-1 font-mono">
                  REF: {qrModalItem.id}
                </p>
              </div>

              <div className="mt-5">
                <Button className="w-full" onClick={() => setQrModalItem(null)}>
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
