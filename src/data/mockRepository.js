import { createSeedState } from './seed.js';

function clone(value) {
  return value === undefined
    ? undefined
    : typeof structuredClone === 'function'
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
}

function requireTenant(companyId) {
  if (typeof companyId !== 'string' || !companyId.trim()) {
    throw new Error('An explicit companyId is required for tenant data access.');
  }
}

function requireUnique(items, label) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Duplicate ${label} ids are not allowed.`);
  }
}

/** Validates tenant ownership and unique resource organization links. */
export function validateMockState(state) {
  for (const [key, label] of [
    ['companies', 'company'], ['departments', 'department'], ['teams', 'team'],
    ['users', 'user'], ['resources', 'resource'], ['reservations', 'reservation'],
  ]) {
    requireUnique(state[key], label);
  }

  const companyIds = new Set(state.companies.map((company) => company.id));
  const departments = new Map(state.departments.map((department) => [department.id, department]));
  const teams = new Map(state.teams.map((team) => [team.id, team]));
  const users = new Map(state.users.map((user) => [user.id, user]));
  const resources = new Map(state.resources.map((resource) => [resource.id, resource]));

  for (const department of state.departments) {
    if (!companyIds.has(department.companyId)) throw new Error('Department has an invalid tenant.');
  }
  for (const team of state.teams) {
    if (!companyIds.has(team.companyId) || departments.get(team.departmentId)?.companyId !== team.companyId) {
      throw new Error('Team has an invalid tenant or department.');
    }
  }
  for (const resource of state.resources) {
    if (!companyIds.has(resource.companyId)) throw new Error('Resource has an invalid tenant.');
    if (new Set(resource.departmentIds).size !== resource.departmentIds.length ||
        new Set(resource.teamIds).size !== resource.teamIds.length) {
      throw new Error('Resource department/team links must not contain duplicates.');
    }
    for (const departmentId of resource.departmentIds) {
      if (departments.get(departmentId)?.companyId !== resource.companyId) {
        throw new Error('Resource department link crosses a tenant boundary.');
      }
    }
    for (const teamId of resource.teamIds) {
      if (teams.get(teamId)?.companyId !== resource.companyId) {
        throw new Error('Resource team link crosses a tenant boundary.');
      }
    }
  }
  for (const reservation of state.reservations) {
    const resource = resources.get(reservation.resourceId);
    if (!companyIds.has(reservation.companyId) || resource?.companyId !== reservation.companyId ||
        users.get(reservation.requesterId)?.companyId !== reservation.companyId) {
      throw new Error('Reservation ownership crosses a tenant boundary.');
    }
  }
  for (const collection of [state.history, state.notifications]) {
    for (const record of collection) {
      if (!companyIds.has(record.companyId)) throw new Error('Audit record has an invalid tenant.');
    }
  }
  return true;
}

/**
 * Browser mock repository, not a security boundary or concurrency guarantee.
 * Tenant reads require companyId. Commands clone, validate, then atomically
 * replace state; thrown validation/id/clock errors leave the original intact.
 */
export class MockRepository {
  constructor(initialState = createSeedState()) {
    const state = clone(initialState);
    validateMockState(state);
    this.state = state;
  }

  listCompanies() {
    return clone(this.state.companies);
  }

  listRoles() {
    return clone(this.state.roles);
  }

  findUserForLogin(email) {
    const normalized = String(email ?? '').trim().toLowerCase();
    return clone(this.state.users.find((user) => user.email.toLowerCase() === normalized) ?? null);
  }

  getSessionBundle(userId) {
    const user = this.state.users.find((candidate) => candidate.id === userId);
    if (!user) return null;
    const membership = this.state.memberships.find(
      (candidate) => candidate.userId === userId && candidate.companyId === user.companyId,
    );
    const company = this.state.companies.find((candidate) => candidate.id === user.companyId);
    const department = this.state.departments.find((candidate) => candidate.id === membership?.departmentId);
    const team = this.state.teams.find((candidate) => candidate.id === membership?.teamId);
    const assignments = this.state.roleAssignments.filter((candidate) => candidate.userId === userId);
    const roles = assignments.map((item) => this.state.roles.find((role) => role.id === item.roleId));
    return clone({ user, membership, company, department, team, assignments, roles });
  }

  listResources(companyId) {
    requireTenant(companyId);
    return clone(this.state.resources.filter((resource) => resource.companyId === companyId));
  }

  getResource(companyId, resourceId) {
    requireTenant(companyId);
    return clone(this.state.resources.find(
      (resource) => resource.companyId === companyId && resource.id === resourceId,
    ) ?? null);
  }

  listReservations(companyId) {
    requireTenant(companyId);
    return clone(this.state.reservations.filter((reservation) => reservation.companyId === companyId));
  }

  getReservation(companyId, reservationId) {
    requireTenant(companyId);
    return clone(this.state.reservations.find(
      (reservation) => reservation.companyId === companyId && reservation.id === reservationId,
    ) ?? null);
  }

  listHistory(companyId) {
    requireTenant(companyId);
    return clone(this.state.history.filter((entry) => entry.companyId === companyId));
  }

  listNotifications(companyId) {
    requireTenant(companyId);
    return clone(this.state.notifications.filter((entry) => entry.companyId === companyId));
  }

  listUsers(companyId) {
    requireTenant(companyId);
    return clone(this.state.users
      .filter((user) => user.companyId === companyId)
      .map((user) => {
        const safeUser = { ...user };
        delete safeUser.demoPassword;
        return safeUser;
      }));
  }

  listDepartments(companyId) {
    requireTenant(companyId);
    return clone(this.state.departments.filter((dept) => dept.companyId === companyId));
  }

  listTeams(companyId) {
    requireTenant(companyId);
    return clone(this.state.teams.filter((team) => team.companyId === companyId));
  }

  listMemberships(companyId) {
    requireTenant(companyId);
    return clone(this.state.memberships.filter((m) => m.companyId === companyId));
  }

  listRoleAssignments(companyId) {
    if (companyId) {
      return clone(this.state.roleAssignments.filter((r) => r.companyId === companyId || !r.companyId));
    }
    return clone(this.state.roleAssignments);
  }

  markNotificationRead(companyId, notificationId) {
    return this.transaction(companyId, (draft) => {
      const item = draft.notifications.find((n) => n.id === notificationId && n.companyId === companyId);
      if (item) {
        item.readAt = new Date().toISOString();
      }
      return item;
    });
  }

  markAllNotificationsRead(companyId, userId) {
    return this.transaction(companyId, (draft) => {
      const now = new Date().toISOString();
      draft.notifications
        .filter((n) => n.companyId === companyId && (!userId || n.userId === userId))
        .forEach((n) => {
          if (!n.readAt) n.readAt = now;
        });
      return true;
    });
  }

  addResource(companyId, resourceData) {
    return this.transaction(companyId, (draft) => {
      draft.resources.push(resourceData);
      return resourceData;
    });
  }

  updateResource(companyId, resourceId, updates) {
    return this.transaction(companyId, (draft) => {
      const idx = draft.resources.findIndex((r) => r.id === resourceId && r.companyId === companyId);
      if (idx !== -1) {
        draft.resources[idx] = { ...draft.resources[idx], ...updates };
        return draft.resources[idx];
      }
      return null;
    });
  }

  updateApprovalPolicy(companyId, resourceId, policy) {
    return this.transaction(companyId, (draft) => {
      const resource = draft.resources.find((r) => r.id === resourceId && r.companyId === companyId);
      if (resource) {
        resource.approvalPolicy = policy;
        return resource;
      }
      return null;
    });
  }

  transaction(companyId, mutator) {
    requireTenant(companyId);
    if (!this.state.companies.some((company) => company.id === companyId)) {
      throw new Error('Unknown tenant.');
    }
    if (typeof mutator !== 'function') throw new Error('A transaction mutator is required.');

    const draft = clone(this.state);
    const result = mutator(draft);
    if (result && typeof result.then === 'function') {
      throw new Error('Mock transactions must be synchronous to preserve atomic commits.');
    }
    validateMockState(draft);
    this.state = draft;
    return clone(result);
  }
}

export const mockRepository = new MockRepository();
