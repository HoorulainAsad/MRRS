import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Check,
  X,
  Lock,
  Layers,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'reject',
  'assign',
  'override',
  'manage_users',
];

const ROLE_PERMISSIONS_MATRIX = [
  {
    role: 'Platform Super Admin',
    scope: 'Platform-wide',
    permissions: {
      view: 'Yes',
      create: 'Yes',
      edit: 'Yes',
      delete: 'Yes',
      approve: 'Yes',
      reject: 'Yes',
      assign: 'Yes',
      override: 'Yes',
      manage_users: 'Yes',
    },
  },
  {
    role: 'Company Admin',
    scope: 'Company-wide',
    permissions: {
      view: 'Yes',
      create: 'Yes',
      edit: 'Yes',
      delete: 'Yes',
      approve: 'Yes',
      reject: 'Yes',
      assign: 'Yes',
      override: 'Yes',
      manage_users: 'Yes',
    },
  },
  {
    role: 'HOD',
    scope: 'Department-level',
    permissions: {
      view: 'Yes',
      create: 'Dept',
      edit: 'Dept',
      delete: 'Dept',
      approve: 'Dept',
      reject: 'Dept',
      assign: 'Dept',
      override: 'Dept',
      manage_users: 'Dept',
    },
  },
  {
    role: 'Manager (Lab/Studio)',
    scope: 'Team / Assigned',
    permissions: {
      view: 'Yes',
      create: 'Assigned',
      edit: 'Assigned',
      delete: 'Assigned',
      approve: 'Assigned',
      reject: 'Assigned',
      assign: 'Team',
      override: 'Assigned',
      manage_users: 'Team',
    },
  },
  {
    role: 'Team Lead',
    scope: 'Team-level',
    permissions: {
      view: 'Yes',
      create: 'Own/Team',
      edit: 'Own',
      delete: 'Own',
      approve: '1st-Level',
      reject: '1st-Level',
      assign: 'Team',
      override: 'No',
      manage_users: 'No',
    },
  },
  {
    role: 'Employee (Faculty/Staff)',
    scope: 'Own records',
    permissions: {
      view: 'Permitted',
      create: 'Own',
      edit: 'Own',
      delete: 'Own',
      approve: 'No',
      reject: 'No',
      assign: 'No',
      override: 'No',
      manage_users: 'Profile',
    },
  },
  {
    role: 'Student (Optional)',
    scope: 'Own records',
    permissions: {
      view: 'Permitted',
      create: 'Own',
      edit: 'Own',
      delete: 'Own',
      approve: 'No',
      reject: 'No',
      assign: 'No',
      override: 'No',
      manage_users: 'Profile',
    },
  },
];

export function RolesPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
            <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
            Security & Governance
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Role-Based Access Control (RBAC) Matrix
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          SRS-enforced authorization rules specifying action boundaries and access scopes across all 7 user roles.
        </p>
      </div>

      {/* Info Notice */}
      <div className="rounded-3xl border border-sage-200 bg-sage-50/50 p-5 flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-800">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-navy-900">
            Granular Scope-Based Evaluation
          </h2>
          <p className="mt-1 text-xs text-ink-600 leading-relaxed">
            Permissions are evaluated against the target entity's organization, department, or team boundaries. A user can never access, edit, or override records outside their authorized scope.
          </p>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-base font-bold text-navy-900">
            Official SRS Role & Permission Matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mist-50/80 text-ink-500 border-b border-line">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Access Scope</th>
                {ACTIONS.map((action) => (
                  <th key={action} className="px-4 py-4 font-bold uppercase tracking-wider text-center">
                    {action.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROLE_PERMISSIONS_MATRIX.map((row) => (
                <tr key={row.role} className="hover:bg-mist-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-navy-900">{row.role}</td>
                  <td className="px-6 py-4 font-semibold text-sage-700">{row.scope}</td>
                  {ACTIONS.map((action) => {
                    const val = row.permissions[action];
                    const isYes = val === 'Yes' || val === 'Permitted';
                    const isNo = val === 'No';

                    return (
                      <td key={action} className="px-4 py-4 text-center">
                        <span
                          className={`inline-block rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                            isYes
                              ? 'bg-sage-100 text-sage-800'
                              : isNo
                              ? 'bg-mist-100 text-ink-400'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
