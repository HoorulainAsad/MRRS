import { RESERVATION_STATUS } from './reservationStatus.js';

/**
 * @typedef {Object} TenantEntity
 * @property {string} id
 * @property {string} companyId Every tenant-owned entity carries its tenant key.
 *
 * @typedef {TenantEntity & {
 *   name: string,
 *   category: string,
 *   kind: 'reusable'|'consumable',
 *   departmentIds: string[],
 *   teamIds: string[],
 *   status: string,
 *   location: string,
 *   utilization: number,
 *   capacity?: number,
 *   floor?: string,
 *   description?: string,
 *   image?: string,
 *   imageAlt?: string,
 *   photoCredit?: string,
 *   totalStock?: number,
 *   threshold?: number,
 *   unit?: string,
 *   approvalPolicy: {requiresApproval: boolean, steps: Array<{id: string, label: string, roleIds: string[]}>}
 * }} Resource
 *
 * @typedef {TenantEntity & {
 *   resourceId: string,
 *   requesterId: string,
 *   departmentId: string|null,
 *   teamId: string|null,
 *   start: string,
 *   end: string,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   quantity: number,
 *   purpose: string,
 *   priority: 'low'|'normal'|'high'|'urgent',
 *   status: string,
 *   currentApprovalStep: number|null,
 *   approvals: Array,
 *   checkedInAt: string|null
 * }} Reservation
 *
 * History and notification records are tenant-owned append-only records. The
 * repository intentionally exposes reads, but no history update/delete API.
 */

export function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}

/** Build a resource while enforcing unique organizational links. */
export function createResource(input) {
  if (!input?.id || !input?.companyId || !input?.name) {
    throw new Error('A resource requires id, companyId, and name.');
  }

  const kind = input.kind ?? 'reusable';
  if (!['reusable', 'consumable'].includes(kind)) {
    throw new Error('Resource kind must be reusable or consumable.');
  }

  const requiresApproval = input.approvalPolicy?.requiresApproval ?? false;
  const steps = (input.approvalPolicy?.steps ?? []).map((step) => ({
    id: step.id,
    label: step.label,
    roleIds: uniqueStrings(step.roleIds),
  }));

  if (requiresApproval && steps.length === 0) {
    throw new Error('An approval workflow requires at least one step.');
  }

  return {
    ...input,
    kind,
    departmentIds: uniqueStrings(input.departmentIds),
    teamIds: uniqueStrings(input.teamIds),
    status: input.status ?? 'available',
    utilization: input.utilization ?? 0,
    ...(kind === 'reusable'
      ? {
          capacity: Number.isInteger(input.capacity) && input.capacity > 0 ? input.capacity : 4,
          floor: typeof input.floor === 'string' ? input.floor : 'Main floor',
          description: typeof input.description === 'string' ? input.description : '',
          image: typeof input.image === 'string' ? input.image : '',
          imageAlt: typeof input.imageAlt === 'string' ? input.imageAlt : '',
          photoCredit: typeof input.photoCredit === 'string' ? input.photoCredit : '',
        }
      : {}),
    ...(kind === 'consumable'
      ? {
          totalStock: input.totalStock ?? 0,
          threshold: input.threshold ?? 0,
          unit: input.unit ?? 'units',
        }
      : {}),
    approvalPolicy: { requiresApproval, steps },
  };
}

/** Build a reservation with explicit workflow state and safe defaults. */
export function createReservation(input) {
  if (!input?.id || !input?.companyId || !input?.resourceId || !input?.requesterId) {
    throw new Error('A reservation requires id, companyId, resourceId, and requesterId.');
  }

  const requiresApproval = input.requiresApproval ?? input.status === RESERVATION_STATUS.pending;

  return {
    priority: 'normal',
    quantity: 1,
    purpose: '',
    departmentId: null,
    teamId: null,
    status: requiresApproval ? RESERVATION_STATUS.pending : RESERVATION_STATUS.confirmed,
    currentApprovalStep: requiresApproval ? 0 : null,
    approvals: [],
    checkedInAt: null,
    overrideReason: null,
    overriddenBy: null,
    ...input,
  };
}
