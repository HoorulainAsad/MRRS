import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Layers,
  MapPin,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { Button } from '../components/ui/Button';

export function OrganizationsPage() {
  const { session } = useSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('enterprise');

  const companies = useMemo(() => {
    return mockRepository.listCompanies();
  }, []);

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    alert(`Organization "${newOrgName}" successfully registered.`);
    setIsAddModalOpen(false);
    setNewOrgName('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
              <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
              Platform Super Admin
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Multi-Tenant Organizations
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Platform governance and logical data boundary monitoring across registered university and corporate organizations.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 bg-sage-700 text-white hover:bg-sage-800 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Register Organization
        </Button>
      </div>

      {/* Tenant Isolation Banner */}
      <div className="rounded-3xl border border-sage-200 bg-sage-50/60 p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-900">
              100% Logical Tenant Data Isolation Enforced
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-600 max-w-3xl">
              Each registered organization operates within its own private namespace. Departments, users, roles, reservations, and inventory records are partitioned by mandatory <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-sage-800 font-bold">company_id</code> scoping.
            </p>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {companies.map((org) => {
          const isCurrent = org.id === session?.companyId;

          return (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl border p-6 shadow-soft transition-all ${
                isCurrent
                  ? 'border-sage-300 bg-white ring-2 ring-sage-500/20'
                  : 'border-line bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mist-100 text-navy-900 font-bold text-lg">
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">{org.name}</h3>
                    <p className="text-xs text-ink-500 capitalize">
                      {org.type === 'education'
                        ? 'Higher Education Institution'
                        : 'Corporate Enterprise Tenant'}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800">
                    Active Workspace
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-mist-50/60 p-4 text-xs">
                <div>
                  <span className="text-ink-400">Tenant Identifier:</span>
                  <p className="font-mono text-navy-900 font-bold mt-0.5">{org.id}</p>
                </div>
                <div>
                  <span className="text-ink-400">Status:</span>
                  <p className="text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                <span className="text-ink-500">Data Boundary: Isolated</span>
                <button className="font-bold text-sage-700 hover:text-sage-900 flex items-center gap-1">
                  Manage Tenant <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Register Organization Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h3 className="text-base font-bold text-navy-900">Register New Organization</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl p-1 text-ink-400 hover:bg-mist-100 hover:text-navy-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddCompany} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Apex Global University"
                    className="mt-1 w-full rounded-2xl border border-line bg-mist-50/50 px-4 py-2 text-xs font-medium text-navy-900 focus:border-sage-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-900">
                    Organization Type
                  </label>
                  <select
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-line bg-mist-50/50 px-3 py-2 text-xs font-medium text-navy-900 focus:border-sage-500 focus:bg-white focus:outline-none"
                  >
                    <option value="enterprise">Corporate Enterprise</option>
                    <option value="education">University / Academic Institution</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sage-700 text-white hover:bg-sage-800">
                    Create Workspace
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
