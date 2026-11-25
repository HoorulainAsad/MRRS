/**
 * The only persisted reservation states in the mock domain.
 * Pending and confirmed reservations hold availability projections; all other
 * states release them.
 */
export const RESERVATION_STATUS = Object.freeze({
  pending: 'pending',
  confirmed: 'confirmed',
  rejected: 'rejected',
  cancelled: 'cancelled',
  overridden: 'overridden',
});

export const ACTIVE_RESERVATION_STATUSES = Object.freeze([
  RESERVATION_STATUS.pending,
  RESERVATION_STATUS.confirmed,
]);

export const TERMINAL_RESERVATION_STATUSES = Object.freeze([
  RESERVATION_STATUS.rejected,
  RESERVATION_STATUS.cancelled,
  RESERVATION_STATUS.overridden,
]);
