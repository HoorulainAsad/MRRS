import { ACTIVE_RESERVATION_STATUSES } from './reservationStatus.js';

export class DomainError extends Error {
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function toTimestamp(value, label = 'date') {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new DomainError(`Invalid ${label}.`, 'INVALID_INTERVAL');
  }
  return timestamp;
}

export function assertValidInterval(start, end) {
  const startMs = toTimestamp(start, 'start time');
  const endMs = toTimestamp(end, 'end time');
  if (startMs >= endMs) {
    throw new DomainError('Reservation end must be after its start.', 'INVALID_INTERVAL');
  }
  return { startMs, endMs };
}

/** Half-open intervals: [start, end). Touching endpoints do not overlap. */
export function intervalsOverlap(startA, endA, startB, endB) {
  const a = assertValidInterval(startA, endA);
  const b = assertValidInterval(startB, endB);
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

function isActive(reservation) {
  return ACTIVE_RESERVATION_STATUSES.includes(reservation.status);
}

function isExcluded(reservation, excludedIds) {
  return excludedIds.has(reservation.id);
}

export function findReusableConflict(
  resourceId,
  reservations,
  start,
  end,
  { excludeReservationIds = [] } = {},
) {
  assertValidInterval(start, end);
  const excludedIds = new Set(excludeReservationIds);
  return reservations.find(
    (reservation) =>
      reservation.resourceId === resourceId &&
      isActive(reservation) &&
      !isExcluded(reservation, excludedIds) &&
      intervalsOverlap(start, end, reservation.start, reservation.end),
  ) ?? null;
}

export function getAllocatedStock(
  resourceId,
  reservations,
  { start, end, excludeReservationIds = [], overlappingOnly = true } = {},
) {
  if (overlappingOnly) {
    assertValidInterval(start, end);
  }
  const excludedIds = new Set(excludeReservationIds);

  return reservations
    .filter(
      (reservation) =>
        reservation.resourceId === resourceId &&
        isActive(reservation) &&
        !isExcluded(reservation, excludedIds) &&
        (!overlappingOnly || intervalsOverlap(start, end, reservation.start, reservation.end)),
    )
    .reduce((total, reservation) => total + reservation.quantity, 0);
}

export function getAvailableStock(resource, reservations, options = {}) {
  if (resource.kind !== 'consumable') {
    throw new DomainError('Stock is only applicable to consumable resources.', 'NOT_CONSUMABLE');
  }
  const allocated = getAllocatedStock(resource.id, reservations, {
    overlappingOnly: false,
    ...options,
  });
  return Math.max(0, resource.totalStock - allocated);
}

/**
 * Validates slot and stock projections against pending/confirmed reservations.
 * Exact stock is accepted; excess stock and any reusable overlap are rejected.
 */
export function assertAvailability({
  resource,
  reservations,
  start,
  end,
  quantity = 1,
  excludeReservationIds = [],
}) {
  assertValidInterval(start, end);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new DomainError('Quantity must be a positive integer.', 'INVALID_QUANTITY');
  }

  if (resource.kind === 'reusable') {
    if (quantity !== 1) {
      throw new DomainError('Reusable resources use a quantity of one.', 'INVALID_QUANTITY');
    }
    const conflict = findReusableConflict(resource.id, reservations, start, end, {
      excludeReservationIds,
    });
    if (conflict) {
      throw new DomainError('The resource is already reserved for this interval.', 'SLOT_UNAVAILABLE');
    }
    return { available: true, remaining: 0 };
  }

  if (resource.kind !== 'consumable') {
    throw new DomainError('Unsupported resource kind.', 'INVALID_RESOURCE');
  }

  const allocated = getAllocatedStock(resource.id, reservations, {
    start,
    end,
    excludeReservationIds,
  });
  const remaining = resource.totalStock - allocated;
  if (quantity > remaining) {
    throw new DomainError('Requested quantity exceeds available stock.', 'STOCK_UNAVAILABLE');
  }
  return { available: true, remaining: remaining - quantity };
}
