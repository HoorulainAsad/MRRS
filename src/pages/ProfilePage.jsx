import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserRound,
  Building2,
  ShieldCheck,
  Mail,
  KeyRound,
  Layers,
  MapPin,
  Calendar,
  LogOut,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function ProfilePage() {
  const { session, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const primaryRole = session?.roleAssignments?.[0]?.roleName || 'Workspace Member';
  const roleScope = session?.roleAssignments?.[0]?.scope || 'own';

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
            <UserRound className="h-3.5 w-3.5 text-sage-600" />
            Account Overview
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          User Profile & Credentials
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Your organizational identity, assigned access scopes, and security permissions.
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-line bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-8">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-sage-700 text-white text-2xl font-bold shadow-md shadow-sage-900/10">
              {session?.user?.name ? session.user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">{session?.user?.name}</h2>
              <p className="text-xs text-ink-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {session?.user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleLogout}
            className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 text-xs px-4"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Details Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line/60 bg-mist-50/50 p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Current Organization
            </span>
            <p className="mt-1 text-base font-bold text-navy-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sage-700" />
              {session?.company?.name || 'Assigned Workspace'}
            </p>
            <p className="text-xs text-ink-500 mt-1">Tenant ID: {session?.companyId}</p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-mist-50/50 p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Assigned Role & Authority
            </span>
            <p className="mt-1 text-base font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sage-700" />
              {primaryRole}
            </p>
            <p className="text-xs text-ink-500 mt-1 capitalize">Access Scope: {roleScope}</p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-mist-50/50 p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Department
            </span>
            <p className="mt-1 text-base font-bold text-navy-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-sage-700" />
              {session?.department?.name || 'All Departments (Admin)'}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-mist-50/50 p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Team Assignment
            </span>
            <p className="mt-1 text-base font-bold text-navy-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sage-700" />
              {session?.team?.name || 'General Operations'}
            </p>
          </div>
        </div>

        {/* Granted Permissions List */}
        <div className="mt-8 pt-6 border-t border-line">
          <h3 className="text-sm font-bold text-navy-900">Active Permissions</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            System actions enabled for your current role and scope.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(session?.roleAssignments?.[0]?.permissions || [
              'view',
              'create',
              'edit',
              'delete',
            ]).map((perm) => (
              <span
                key={perm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sage-50 px-3 py-1.5 text-xs font-bold text-sage-800 ring-1 ring-inset ring-sage-200"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
                {perm.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
