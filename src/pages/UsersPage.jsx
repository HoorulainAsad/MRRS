import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Plus, Search, Shield, Users, X } from 'lucide-react';
import { mockRepository } from '../data/mockRepository';
import { useSession } from '../hooks/useSession';

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-[#E8F5EC] text-[#1f7a3c]' : 'bg-[#F5F5F5] text-[#637068]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#1f7a3c]' : 'bg-[#637068]'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function AddMemberModal({ departments, roles, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', departmentId: '', role: 'Employee' });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-[#e4e8f0] bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e4e8f0] px-5 py-4">
          <h2 className="text-base font-bold text-[#26364A]">Add Member</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#637068] hover:bg-[#F7F8F4]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          {error && <p className="rounded-lg bg-[#FDE8E8] px-3 py-2 text-sm text-[#b04040]">{error}</p>}
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Jane Smith' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'jane@company.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-[#26364A]">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-[#e4e8f0] px-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30] focus:ring-2 focus:ring-[#203D30]/10"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#26364A]">Department</label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#e4e8f0] px-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30]"
            >
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#26364A]">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#e4e8f0] px-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30]"
            >
              {['Employee', 'Team Lead', 'Manager', 'HOD', 'Company Admin'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#e4e8f0] py-2.5 text-sm font-semibold text-[#637068] hover:bg-[#F7F8F4]">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-[#203D30] py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]">
              Add Member
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function UsersPage() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [localUsers, setLocalUsers] = useState(null);

  const baseUsers = useMemo(() => mockRepository.listUsers(session.companyId), [session.companyId]);
  const departments = useMemo(() => mockRepository.listDepartments(session.companyId), [session.companyId]);

  const displayUsers = useMemo(() => {
    const users = localUsers ?? baseUsers;
    return users.filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [localUsers, baseUsers, search]);

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d.name])), [departments]);

  const handleAdd = (form) => {
    const newUser = {
      id: `local-${Date.now()}`,
      name: form.name,
      email: form.email,
      active: true,
      departmentId: form.departmentId,
      role: form.role,
    };
    setLocalUsers((prev) => [newUser, ...(prev ?? baseUsers)]);
  };

  const handleDeactivate = (userId) => {
    setLocalUsers((prev) => (prev ?? baseUsers).map((u) => u.id === userId ? { ...u, active: !u.active } : u));
  };

  function getInitials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#26364A]">Members</h1>
          <p className="mt-1 text-sm text-[#637068]">{displayUsers.length} member{displayUsers.length !== 1 ? 's' : ''} in {session.company?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#203D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Member
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 shadow-soft">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#637068]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] pl-9 pr-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30] focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#637068]">
          <Users className="h-4 w-4" aria-hidden="true" />
          {displayUsers.filter((u) => u.active !== false).length} active
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e4e8f0] text-sm">
            <thead className="bg-[#F7F8F4]">
              <tr>
                {['Member', 'Email', 'Department', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[#637068]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e8f0]">
              {displayUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#637068]">No members found.</td>
                </tr>
              )}
              {displayUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#F7F8F4]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#26364A] text-[11px] font-bold text-white">
                        {getInitials(u.name)}
                      </span>
                      <span className="font-medium text-[#1e2a24]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#637068]">{u.email}</td>
                  <td className="px-4 py-3 text-[#637068]">{deptMap[u.departmentId] || u.departmentId || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEF1F8] px-2 py-0.5 text-[11px] font-semibold text-[#26364A]">
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      {u.role || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot active={u.active !== false} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button className="rounded-md border border-[#e4e8f0] px-2.5 py-1 text-[11px] font-semibold text-[#26364A] hover:bg-[#F7F8F4]">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${u.active !== false ? 'border-[#e4e8f0] text-[#b04040] hover:bg-[#FDE8E8]' : 'border-[#e4e8f0] text-[#1f7a3c] hover:bg-[#E8F5EC]'}`}
                      >
                        {u.active !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add member modal */}
      <AnimatePresence>
        {showAdd && (
          <AddMemberModal
            departments={departments}
            onClose={() => setShowAdd(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
