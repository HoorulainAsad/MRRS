import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sliders,
  Settings2,
  X,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { Button } from '../components/ui/Button';

export function WorkflowsPage() {
  const { session } = useSession();
  const [editingResource, setEditingResource] = useState(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load resources
  const resources = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository.listResources(session.companyId);
  }, [session?.companyId, refreshKey]);

  // Handle Save Policy
  const handleSavePolicy = (e) => {
    e.preventDefault();
    if (!editingResource) return;

    const newPolicy = requiresApproval
      ? {
          requiresApproval: true,
          steps: [
            { id: 'manager-review', label: 'Manager review', roleIds: ['role-manager'] },
            { id: 'hod-review', label: 'Head of department review', roleIds: ['role-hod'] },
          ],
        }
      : { requiresApproval: false, steps: [] };

    mockRepository.updateApprovalPolicy(session.companyId, editingResource.id, newPolicy);
    setEditingResource(null);
    setRefreshKey((k) => k + 1);
    alert(`Approval policy updated for ${editingResource.name}.`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
            <GitBranch className="h-3.5 w-3.5 text-sage-600" />
            Workflow Engine
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Configurable Approval Workflows
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Configure single-level and multi-tier approval chains (e.g. Team Lead → Manager → HOD) based on resource sensitivity and department policies.
        </p>
      </div>

      {/* Preset Workflow Chains Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sage-100 text-sage-800">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Direct / Instant Booking Policy</h2>
              <p className="text-xs text-ink-500">Zero approval delay</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-600">
            For standard focus rooms, desks, and open collaboration studios. Bookings are instantly confirmed if the time slot is free.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-sage-700 bg-sage-50 px-3 py-2 rounded-xl">
            <span>User Requests</span> <ArrowRight className="h-3.5 w-3.5" /> <span>Direct Confirmation</span>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Multi-Tier Approval Policy</h2>
              <p className="text-xs text-ink-500">Sequential review chain</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-600">
            For executive boardrooms, specialized research laboratories, and event workshops requiring administrative sign-off.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-2 rounded-xl">
            <span>Step 1: Manager</span> <ArrowRight className="h-3.5 w-3.5" /> <span>Step 2: HOD</span> <ArrowRight className="h-3.5 w-3.5" /> <span>Confirmed</span>
          </div>
        </div>
      </div>

      {/* Resource Policy Assignment Table */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-base font-bold text-navy-900">
            Resource Policy Mappings
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Current approval policies assigned to tenant workspace resources.
          </p>
        </div>

        <div className="divide-y divide-line">
          {resources.map((res) => {
            const hasWorkflow = res.approvalPolicy?.requiresApproval;
            const steps = res.approvalPolicy?.steps || [];

            return (
              <div
                key={res.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-mist-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-mist-100 text-navy-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-navy-900">{res.name}</p>
                    <p className="text-xs text-ink-500">
                      {res.category} · {res.location}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {hasWorkflow ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      Sequential: Manager → HOD ({steps.length} Steps)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-sage-50 px-3 py-1 text-xs font-bold text-sage-800 ring-1 ring-sage-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sage-600" />
                      Instant (No Workflow)
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setEditingResource(res);
                      setRequiresApproval(Boolean(hasWorkflow));
                    }}
                    className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm hover:bg-mist-50"
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Policy Modal */}
      <AnimatePresence>
        {editingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h3 className="text-base font-bold text-navy-900">Configure Approval Policy</h3>
                <button
                  onClick={() => setEditingResource(null)}
                  className="rounded-xl p-1 text-ink-400 hover:bg-mist-100 hover:text-navy-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePolicy} className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-ink-500">Resource</p>
                  <p className="text-sm font-bold text-navy-900 mt-0.5">{editingResource.name}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 rounded-2xl border p-3 cursor-pointer hover:bg-mist-50 transition-colors">
                    <input
                      type="radio"
                      name="policyType"
                      checked={!requiresApproval}
                      onChange={() => setRequiresApproval(false)}
                      className="mt-0.5 h-4 w-4 text-sage-600 focus:ring-sage-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-navy-900">Instant Booking (No Approval)</p>
                      <p className="text-[11px] text-ink-500">
                        Requests are automatically confirmed if the time slot is free.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border p-3 cursor-pointer hover:bg-mist-50 transition-colors">
                    <input
                      type="radio"
                      name="policyType"
                      checked={requiresApproval}
                      onChange={() => setRequiresApproval(true)}
                      className="mt-0.5 h-4 w-4 text-sage-600 focus:ring-sage-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-navy-900">Multi-Step Review Chain</p>
                      <p className="text-[11px] text-ink-500">
                        Enforces Step 1 (Manager Review) then Step 2 (HOD Approval).
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingResource(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sage-700 text-white hover:bg-sage-800">
                    Apply Policy
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
