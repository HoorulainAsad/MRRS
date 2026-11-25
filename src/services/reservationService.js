import { assertAvailability, DomainError } from '../domain/availability.js';
import { createReservation } from '../domain/models.js';
import { ACTIVE_RESERVATION_STATUSES, RESERVATION_STATUS } from '../domain/reservationStatus.js';
import { mockRepository } from '../data/mockRepository.js';
import { can, reservationTarget } from './authorization.js';

export const PRIORITY_RANK = Object.freeze({ low: 1, normal: 2, high: 3, urgent: 4 });

export function createSequentialIdGenerator() {
  let sequence = 0;
  return (prefix = 'mock') => `${prefix}-${++sequence}`;
}

function isoTimestamp(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new DomainError('Clock returned an invalid timestamp.', 'INVALID_CLOCK');
  return date.toISOString();
}

function normalizeInterval(input) {
  let { start, end } = input;
  if ((!start || !end) && input.date && input.startTime && input.endTime) {
    const time = (value) => {
      if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
        throw new DomainError('Invalid reservation time.', 'INVALID_INTERVAL');
      }
      return `${value.length === 5 ? `${value}:00` : value}.000Z`;
    };
    start = `${input.date}T${time(input.startTime)}`;
    end = `${input.date}T${time(input.endTime)}`;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new DomainError('A valid start and end are required.', 'INVALID_INTERVAL');
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    date: input.date ?? startDate.toISOString().slice(0, 10),
    startTime: input.startTime ?? startDate.toISOString().slice(11, 16),
    endTime: input.endTime ?? endDate.toISOString().slice(11, 16),
  };
}

function tenantReservations(draft, companyId) {
  return draft.reservations.filter((reservation) => reservation.companyId === companyId);
}

function draftReservation(draft, companyId, reservationId) {
  const reservation = draft.reservations.find(
    (candidate) => candidate.companyId === companyId && candidate.id === reservationId,
  );
  if (!reservation) throw new DomainError('Reservation not found.', 'NOT_FOUND');
  return reservation;
}

function draftResource(draft, companyId, resourceId) {
  const resource = draft.resources.find(
    (candidate) => candidate.companyId === companyId && candidate.id === resourceId,
  );
  if (!resource) throw new DomainError('Resource not found.', 'NOT_FOUND');
  return resource;
}

function requireActive(reservation) {
  if (!ACTIVE_RESERVATION_STATUSES.includes(reservation.status)) {
    throw new DomainError('Reservation is no longer active.', 'INVALID_STATE');
  }
}

export class ReservationService {
  constructor({
    repository = mockRepository,
    clock = () => new Date(),
    idGenerator = createSequentialIdGenerator(),
  } = {}) {
    this.repository = repository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  _id(prefix) {
    const id = this.idGenerator(prefix);
    if (typeof id !== 'string' || !id.trim()) {
      throw new DomainError('ID generator returned an invalid id.', 'INVALID_ID');
    }
    return id;
  }

  _record(draft, reservation, actorId, action, fromStatus, message, timestamp, details = {}) {
    draft.history.push({
      id: this._id('history'),
      companyId: reservation.companyId,
      reservationId: reservation.id,
      actorId,
      action,
      fromStatus,
      toStatus: reservation.status,
      message,
      details,
      timestamp,
    });

    for (const channel of ['in_app', 'email_request']) {
      draft.notifications.push({
        id: this._id('notification'),
        companyId: reservation.companyId,
        userId: reservation.requesterId,
        reservationId: reservation.id,
        channel,
        type: 'reservation_update',
        message,
        createdAt: timestamp,
        deliveryStatus: channel === 'email_request' ? 'simulated' : 'recorded',
        readAt: null,
      });
    }
  }

  _buildReservation(draft, session, input, {
    excludeReservationIds = [],
    requireCreatePermission = true,
    id,
    timestamp,
  } = {}) {
    const resource = draftResource(draft, session.companyId, input.resourceId);
    const interval = normalizeInterval(input);
    const priority = input.priority ?? 'normal';
    if (!Object.hasOwn(PRIORITY_RANK, priority)) {
      throw new DomainError('Invalid reservation priority.', 'INVALID_PRIORITY');
    }
    const purpose = String(input.purpose ?? '').trim();

    const memberDepartment = session.membership?.departmentId;
    const memberTeam = session.membership?.teamId;
    const departmentId = input.departmentId ??
      (resource.departmentIds.includes(memberDepartment) ? memberDepartment : resource.departmentIds[0] ?? null);
    const teamId = input.teamId ??
      (resource.teamIds.includes(memberTeam) ? memberTeam : resource.teamIds[0] ?? null);

    if ((departmentId && !resource.departmentIds.includes(departmentId)) ||
        (teamId && !resource.teamIds.includes(teamId))) {
      throw new DomainError('Reservation organization links do not match the resource.', 'INVALID_SCOPE');
    }

    const target = {
      companyId: session.companyId,
      departmentId,
      teamId,
      ownerId: session.userId,
    };
    if (requireCreatePermission && !can(session, 'create', target)) {
      throw new DomainError('You do not have permission to create this reservation.', 'FORBIDDEN');
    }

    const quantity = input.quantity ?? 1;
    assertAvailability({
      resource,
      reservations: tenantReservations(draft, session.companyId),
      ...interval,
      quantity,
      excludeReservationIds,
    });

    return createReservation({
      id,
      companyId: session.companyId,
      resourceId: resource.id,
      requesterId: session.userId,
      departmentId,
      teamId,
      ...interval,
      quantity,
      purpose,
      priority,
      status: resource.approvalPolicy.requiresApproval
        ? RESERVATION_STATUS.pending
        : RESERVATION_STATUS.confirmed,
      requiresApproval: resource.approvalPolicy.requiresApproval,
      currentApprovalStep: resource.approvalPolicy.requiresApproval ? 0 : null,
      submittedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async submit(session, input) {
    const timestamp = isoTimestamp(this.clock);
    const id = this._id('reservation');
    return this.repository.transaction(session?.companyId, (draft) => {
      const reservation = this._buildReservation(draft, session, input, { id, timestamp });
      draft.reservations.push(reservation);
      const requiresReview = reservation.status === RESERVATION_STATUS.pending;
      this._record(
        draft,
        reservation,
        session.userId,
        'submitted',
        null,
        requiresReview
          ? 'Reservation submitted; review is required before confirmation.'
          : 'Reservation confirmed under the resource no-workflow policy.',
        timestamp,
      );
      return reservation;
    });
  }

  _assertCurrentApprover(session, reservation, resource, action) {
    if (reservation.status !== RESERVATION_STATUS.pending) {
      throw new DomainError('Only pending reservations can be reviewed.', 'INVALID_STATE');
    }
    if (!can(session, action, reservationTarget(reservation))) {
      throw new DomainError('You do not have permission to review this reservation.', 'FORBIDDEN');
    }
    const step = resource.approvalPolicy.steps[reservation.currentApprovalStep];
    if (!resource.approvalPolicy.requiresApproval || !step) {
      throw new DomainError('Reservation has no active approval step.', 'INVALID_STATE');
    }
    const hasStepRole = session.roleAssignments.some(
      (assignment) => step.roleIds.includes(assignment.roleId),
    );
    if (!hasStepRole) {
      throw new DomainError('Approval steps must be completed sequentially by the assigned role.', 'OUT_OF_ORDER_APPROVAL');
    }
    return step;
  }

  async approve(session, reservationId) {
    const timestamp = isoTimestamp(this.clock);
    return this.repository.transaction(session?.companyId, (draft) => {
      const reservation = draftReservation(draft, session.companyId, reservationId);
      const resource = draftResource(draft, session.companyId, reservation.resourceId);
      const step = this._assertCurrentApprover(session, reservation, resource, 'approve');
      const fromStatus = reservation.status;
      reservation.approvals.push({
        stepId: step.id,
        actorId: session.userId,
        decision: 'approved',
        timestamp,
      });
      reservation.currentApprovalStep += 1;
      if (reservation.currentApprovalStep >= resource.approvalPolicy.steps.length) {
        reservation.status = RESERVATION_STATUS.confirmed;
      }
      reservation.updatedAt = timestamp;
      this._record(
        draft, reservation, session.userId, 'approved', fromStatus,
        reservation.status === RESERVATION_STATUS.confirmed
          ? 'Final approval completed; reservation confirmed.'
          : `${step.label} completed; the next approval step is now pending.`,
        timestamp,
        { stepId: step.id },
      );
      return reservation;
    });
  }

  async reject(session, reservationId, reason = '') {
    const timestamp = isoTimestamp(this.clock);
    return this.repository.transaction(session?.companyId, (draft) => {
      const reservation = draftReservation(draft, session.companyId, reservationId);
      const resource = draftResource(draft, session.companyId, reservation.resourceId);
      const step = this._assertCurrentApprover(session, reservation, resource, 'reject');
      const fromStatus = reservation.status;
      reservation.status = RESERVATION_STATUS.rejected;
      reservation.currentApprovalStep = null;
      reservation.rejectionReason = String(reason).trim();
      reservation.updatedAt = timestamp;
      this._record(
        draft, reservation, session.userId, 'rejected', fromStatus,
        `Reservation rejected at ${step.label}.${reservation.rejectionReason ? ` ${reservation.rejectionReason}` : ''}`,
        timestamp,
        { stepId: step.id, reason: reservation.rejectionReason },
      );
      return reservation;
    });
  }

  async cancel(session, reservationId, reason = '') {
    const timestamp = isoTimestamp(this.clock);
    return this.repository.transaction(session?.companyId, (draft) => {
      const reservation = draftReservation(draft, session.companyId, reservationId);
      requireActive(reservation);
      if (!can(session, 'edit', reservationTarget(reservation))) {
        throw new DomainError('You do not have permission to cancel this reservation.', 'FORBIDDEN');
      }
      if (reservation.checkedInAt) {
        throw new DomainError('Checked-in reservations cannot be cancelled.', 'INVALID_STATE');
      }
      const fromStatus = reservation.status;
      reservation.status = RESERVATION_STATUS.cancelled;
      reservation.currentApprovalStep = null;
      reservation.cancellationReason = String(reason).trim();
      reservation.updatedAt = timestamp;
      this._record(
        draft, reservation, session.userId, 'cancelled', fromStatus,
        'Reservation cancelled; its slot or stock allocation was released.', timestamp,
        { reason: reservation.cancellationReason },
      );
      return reservation;
    });
  }

  async override(session, targetReservationId, incomingInput, reason) {
    const normalizedReason = String(reason ?? '').trim();
    if (!normalizedReason) {
      throw new DomainError('An override reason is required.', 'OVERRIDE_REASON_REQUIRED');
    }
    const timestamp = isoTimestamp(this.clock);
    const incomingId = this._id('reservation');

    return this.repository.transaction(session?.companyId, (draft) => {
      const target = draftReservation(draft, session.companyId, targetReservationId);
      if (target.status !== RESERVATION_STATUS.confirmed) {
        throw new DomainError('Only confirmed reservations can be overridden.', 'INVALID_STATE');
      }
      if (!can(session, 'override', reservationTarget(target))) {
        throw new DomainError('You do not have permission to override this reservation.', 'FORBIDDEN');
      }
      if (incomingInput.resourceId !== target.resourceId) {
        throw new DomainError('An override must reserve the same resource as its target.', 'INVALID_OVERRIDE');
      }
      if (!Object.hasOwn(PRIORITY_RANK, incomingInput.priority) ||
          PRIORITY_RANK[incomingInput.priority] <= PRIORITY_RANK[target.priority]) {
        throw new DomainError('Override priority must be strictly higher than the target priority.', 'INSUFFICIENT_PRIORITY');
      }

      const incoming = this._buildReservation(draft, session, incomingInput, {
        excludeReservationIds: [target.id],
        requireCreatePermission: false,
        id: incomingId,
        timestamp,
      });
      if (!can(session, 'override', reservationTarget(incoming))) {
        throw new DomainError('The incoming reservation is outside your override scope.', 'FORBIDDEN');
      }

      const previousTargetStatus = target.status;
      target.status = RESERVATION_STATUS.overridden;
      target.currentApprovalStep = null;
      target.overrideReason = normalizedReason;
      target.overriddenBy = incoming.id;
      target.updatedAt = timestamp;
      this._record(
        draft, target, session.userId, 'overridden', previousTargetStatus,
        `Reservation overridden: ${normalizedReason}`, timestamp,
        { reason: normalizedReason, incomingReservationId: incoming.id },
      );
      draft.reservations.push(incoming);
      this._record(
        draft, incoming, session.userId, 'override_submitted', null,
        incoming.status === RESERVATION_STATUS.confirmed
          ? 'Higher-priority replacement confirmed under the no-workflow policy.'
          : 'Higher-priority replacement submitted for its configured approval workflow.',
        timestamp,
        { overriddenReservationId: target.id, reason: normalizedReason },
      );
      return { target, incoming };
    });
  }

  async checkIn(session, reservationId) {
    const timestamp = isoTimestamp(this.clock);
    return this.repository.transaction(session?.companyId, (draft) => {
      const reservation = draftReservation(draft, session.companyId, reservationId);
      if (reservation.requesterId !== session.userId) {
        throw new DomainError('You may only check in to your own reservation.', 'FORBIDDEN');
      }
      if (reservation.status !== RESERVATION_STATUS.confirmed) {
        throw new DomainError('Only confirmed reservations can be checked in.', 'INVALID_STATE');
      }
      if (reservation.checkedInAt) {
        throw new DomainError('Reservation is already checked in.', 'ALREADY_CHECKED_IN');
      }
      reservation.checkedInAt = timestamp;
      reservation.updatedAt = timestamp;
      this._record(
        draft, reservation, session.userId, 'checked_in', reservation.status,
        'Reservation checked in.', timestamp, { checkedInAt: timestamp },
      );
      return reservation;
    });
  }

  async getHistory(session, reservationId) {
    const reservation = this.repository.getReservation(session?.companyId, reservationId);
    if (!reservation || !can(session, 'view', reservationTarget(reservation))) {
      throw new DomainError('Reservation history is not available.', 'FORBIDDEN');
    }
    return this.repository.listHistory(session.companyId)
      .filter((entry) => entry.reservationId === reservationId);
  }
}

export function createReservationService(options) {
  return new ReservationService(options);
}

const defaultService = new ReservationService();

export const submitReservation = (session, input) => defaultService.submit(session, input);
export const approveReservation = (session, reservationId) => defaultService.approve(session, reservationId);
export const rejectReservation = (session, reservationId, reason) => defaultService.reject(session, reservationId, reason);
export const cancelReservation = (session, reservationId, reason) => defaultService.cancel(session, reservationId, reason);
export const overrideReservation = (session, targetId, input, reason) => defaultService.override(session, targetId, input, reason);
export const checkInReservation = (session, reservationId) => defaultService.checkIn(session, reservationId);
