import { mockRepository } from '../data/mockRepository.js';

const DEMO_PASSWORD = 'demo123';
const LOGIN_LATENCY_MS = 30;

export function getDemoAccounts() {
  const companies = new Map(mockRepository.listCompanies().map((company) => [company.id, company]));
  return mockRepository.listCompanies().flatMap((company) =>
    mockRepository.listUsers(company.id).map((user) => {
      const bundle = mockRepository.getSessionBundle(user.id);
      const primaryRole = bundle?.roles[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryRole?.name ?? 'Member',
        companyName: companies.get(user.companyId)?.name ?? company.name,
        companyId: user.companyId,
      };
    }),
  );
}

/** Synchronous session lookup for the demo account picker. */
export function getDemoSession(userId) {
  const bundle = mockRepository.getSessionBundle(userId);
  if (!bundle?.company || !bundle?.membership || bundle.assignments.length === 0) {
    throw new Error('Demo account is not available.');
  }

  const roleAssignments = bundle.assignments.map((assignment) => {
    const role = bundle.roles.find((candidate) => candidate?.id === assignment.roleId);
    if (!role) throw new Error('Demo account role is not available.');
    return {
      roleId: role.id,
      roleName: role.name,
      scope: assignment.scope,
      scopeId: assignment.scopeId,
      permissions: [...role.permissions],
    };
  });

  return {
    userId: bundle.user.id,
    companyId: bundle.company.id,
    user: { id: bundle.user.id, name: bundle.user.name, email: bundle.user.email },
    company: { id: bundle.company.id, name: bundle.company.name, type: bundle.company.type },
    membership: {
      departmentId: bundle.membership.departmentId ?? null,
      departmentName: bundle.department?.name ?? null,
      teamId: bundle.membership.teamId ?? null,
      teamName: bundle.team?.name ?? null,
    },
    roleAssignments,
    isDemo: true,
  };
}

/** Simulated latency only; this is a browser demo, not real authentication. */
export async function loginDemo({ email, password } = {}) {
  await new Promise((resolve) => setTimeout(resolve, LOGIN_LATENCY_MS));
  const account = mockRepository.findUserForLogin(email);
  if (!account || password !== DEMO_PASSWORD || account.demoPassword !== DEMO_PASSWORD) {
    throw new Error('Invalid demo email or password.');
  }
  return getDemoSession(account.id);
}
