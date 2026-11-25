export const PERMISSIONS = Object.freeze([
  'view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'override', 'manage_users',
]);

const GLOBAL_ROLE_IDS = new Set(['role-platform-super-admin']);
const VALID_SCOPES = new Set(['platform', 'company', 'department', 'team', 'own']);

function validSession(session) {
  return Boolean(
    session?.userId && session?.companyId && session?.user?.id === session.userId &&
    Array.isArray(session.roleAssignments),
  );
}

function validAssignment(assignment) {
  return VALID_SCOPES.has(assignment?.scope) &&
    typeof assignment?.scopeId === 'string' &&
    Array.isArray(assignment?.permissions);
}

export function isPlatformAdmin(session) {
  return validSession(session) && session.roleAssignments.some(
    (assignment) => assignment.scope === 'platform' && GLOBAL_ROLE_IDS.has(assignment.roleId),
  );
}

/**
 * Permission + tenant + scope authorization. Missing scope attributes fail
 * closed. Only the explicitly global role may use platform scope.
 */
export function can(session, action, target = {}) {
  if (!validSession(session) || !PERMISSIONS.includes(action)) return false;
  const companyId = target.companyId ?? session.companyId;

  return session.roleAssignments.some((assignment) => {
    if (!validAssignment(assignment) || !assignment.permissions.includes(action)) return false;

    if (assignment.scope === 'platform') {
      return GLOBAL_ROLE_IDS.has(assignment.roleId) && assignment.scopeId === 'platform';
    }
    if (GLOBAL_ROLE_IDS.has(assignment.roleId)) return false;
    if (companyId !== session.companyId) return false;

    switch (assignment.scope) {
      case 'company':
        return assignment.scopeId === session.companyId;
      case 'department':
        return Boolean(target.departmentId) && target.departmentId === assignment.scopeId;
      case 'team':
        return Boolean(target.teamId) && target.teamId === assignment.scopeId;
      case 'own':
        return assignment.scopeId === session.userId && target.ownerId === session.userId;
      default:
        return false;
    }
  });
}

/** Route-menu helper only; use can() with a target for actual data decisions. */
export function hasPermission(session, action) {
  if (!validSession(session) || !PERMISSIONS.includes(action)) return false;
  return session.roleAssignments.some((assignment) =>
    validAssignment(assignment) &&
    assignment.permissions.includes(action) &&
    (assignment.scope !== 'platform' || GLOBAL_ROLE_IDS.has(assignment.roleId)),
  );
}

export function hasAnyRole(session, roles = []) {
  if (!validSession(session)) return false;
  const accepted = (Array.isArray(roles) ? roles : [roles])
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());
  return session.roleAssignments.some((assignment) =>
    accepted.includes(String(assignment.roleId).toLowerCase()) ||
    accepted.includes(String(assignment.roleName).toLowerCase()),
  );
}

export function reservationTarget(reservation) {
  return {
    companyId: reservation.companyId,
    departmentId: reservation.departmentId,
    teamId: reservation.teamId,
    ownerId: reservation.requesterId,
  };
}
