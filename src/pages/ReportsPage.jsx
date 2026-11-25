import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Package,
  History,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { Button } from '../components/ui/Button';

export function ReportsPage() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('utilization'); // 'utilization' | 'overrides' | 'consumables'

  // Load resources, reservations, history
  const resources = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listResources(session.companyId);
  }, [session?.companyId]);

  const reservations = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listReservations(session.companyId);
  }, [session?.companyId]);

  const history = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listHistory(session.companyId);
  }, [session?.companyId]);

  const users = useMemo(() => {
    if (!session?.companyId) return new Map();
    const list = mockRepository.listUsers(session.companyId);
    return new Map(list.map((u) => [u.id, u]));
  }, [session?.companyId]);

  // Override Audit Entries
  const overrideLogs = useMemo(() => {
    return history
      .filter((h) => h.action === 'overridden' || h.action === 'override_submitted')
      .map((entry) => {
        const res = reservations.find((r) => r.id === entry.reservationId);
        const resource = resources.find((r) => r.id === res?.resourceId);
        const actor = users.get(entry.actorId);
        return {
          id: entry.id,
          timestamp: entry.timestamp,
          actorName: actor?.name || 'Administrator',
          spaceName: resource?.name || 'Shared Space',
          message: entry.message,
          reason: entry.details?.reason || entry.message,
          reservationId: entry.reservationId,
        };
      });
  }, [history, reservations, resources, users]);

  // Consumables summary
  const consumableStats = useMemo(() => {
    return resources.filter((r) => r.kind === 'consumable');
  }, [resources]);

  // Utilization rates
  const spaceUtilization = useMemo(() => {
    return resources.filter((r) => r.kind === 'reusable');
  }, [resources]);

  const handleExportCSV = () => {
    alert('Export generated: spaceflow-report-analytics.csv has been prepared for download.');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
              <BarChart3 className="h-3.5 w-3.5 text-sage-600" />
              Organizational Analytics
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Reports & Utilization Insights
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Tenant-scoped reporting on space utilization, consumable allocation rates, and priority override audit logs.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="secondary"
          className="gap-2 text-xs font-bold"
        >
          <Download className="h-4 w-4" />
          Export CSV Report
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Average Utilization
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900">58.4%</p>
          <p className="mt-1 text-xs text-sage-700 font-semibold">Across 25 workspace assets</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Monthly Bookings
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
            {reservations.length}
          </p>
          <p className="mt-1 text-xs text-ink-500">Confirmed & completed requests</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Turnaround Time
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900">1.8 hrs</p>
          <p className="mt-1 text-xs text-sage-700 font-semibold">Average approval speed</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Priority Overrides
          </span>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
            {overrideLogs.length}
          </p>
          <p className="mt-1 text-xs text-amber-700 font-semibold">With mandatory justification</p>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'utilization', label: 'Space Utilization Rates' },
          { id: 'overrides', label: `Override Audit History (${overrideLogs.length})` },
          { id: 'consumables', label: 'Consumable Stock Depletion' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-navy-900 text-white'
                : 'bg-white text-ink-600 hover:bg-mist-100 border border-line'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Space Utilization Table */}
      {activeTab === 'utilization' && (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-bold text-navy-900">
              Space Capacity & Occupancy Rates
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Aggregated monthly usage metrics across all meeting rooms and labs.
            </p>
          </div>

          <div className="divide-y divide-line">
            {spaceUtilization.map((space) => {
              const util = space.utilization || Math.floor(Math.random() * 40 + 40);
              return (
                <div
                  key={space.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-mist-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sage-50 text-sage-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-navy-900">{space.name}</p>
                      <p className="text-xs text-ink-500">
                        {space.category} · {space.location} · {space.capacity} seats
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-navy-900 mb-1">
                        <span>Utilization</span>
                        <span>{util}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-mist-100">
                        <div
                          className="h-full rounded-full bg-sage-600"
                          style={{ width: `${util}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Override Audit Log */}
      {activeTab === 'overrides' && (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-bold text-navy-900">
              Mandatory Priority Override Audit Ledger
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Immutable log of executive overrides, reasons, affected bookings, and actor identities.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-mist-50/70 text-ink-500 border-b border-line">
                <tr>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Authorized Actor</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Space Affected</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Mandatory Justification</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {overrideLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-mist-50/40 transition-colors">
                    <td className="px-6 py-4 text-ink-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-navy-900">
                      {log.actorName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-sage-800">
                      {log.spaceName}
                    </td>
                    <td className="px-6 py-4 text-ink-600 max-w-xs leading-relaxed font-medium">
                      {log.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
                        <ShieldAlert className="h-3 w-3" />
                        Authorized
                      </span>
                    </td>
                  </tr>
                ))}

                {overrideLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-ink-400">
                      No priority overrides have been executed in this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumables Inventory Report */}
      {activeTab === 'consumables' && (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-base font-bold text-navy-900">
              Consumable Resource Consumption & Stock
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Current inventory balances, reorder thresholds, and depletion indicators.
            </p>
          </div>

          <div className="divide-y divide-line">
            {consumableStats.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-5 hover:bg-mist-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-mist-100 text-navy-700">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-navy-900">{item.name}</p>
                    <p className="text-xs text-ink-500">{item.location} · {item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy-900">
                      {item.totalStock} {item.unit}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      Threshold: {item.threshold} {item.unit}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      (item.totalStock || 0) <= (item.threshold || 2)
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-sage-100 text-sage-800'
                    }`}
                  >
                    {(item.totalStock || 0) <= (item.threshold || 2) ? 'Low Stock' : 'Optimal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
