import { describe, expect, it } from 'vitest';
import {
  assertAvailability,
  findReusableConflict,
  getAvailableStock,
  intervalsOverlap,
} from '../../src/domain/availability.js';
import { RESERVATION_STATUS } from '../../src/domain/reservationStatus.js';

const reusable = { id: 'room', kind: 'reusable' };
const consumable = { id: 'stock', kind: 'consumable', totalStock: 2 };
const interval = { start: '2026-12-10T09:00:00.000Z', end: '2026-12-10T10:00:00.000Z' };

function reservation(overrides = {}) {
  return {
    id: 'existing', resourceId: 'room', quantity: 1, status: RESERVATION_STATUS.confirmed,
    ...interval, ...overrides,
  };
}

describe('availability projections', () => {
  it('uses half-open intervals and allows touching endpoints', () => {
    expect(intervalsOverlap(interval.start, interval.end, interval.end, '2026-12-10T11:00:00.000Z')).toBe(false);
    expect(intervalsOverlap('2026-12-10T08:00:00.000Z', interval.start, interval.start, interval.end)).toBe(false);
    expect(intervalsOverlap(interval.start, interval.end, '2026-12-10T09:30:00.000Z', '2026-12-10T11:00:00.000Z')).toBe(true);
    expect(intervalsOverlap(interval.start, interval.end, '2026-12-10T09:15:00.000Z', '2026-12-10T09:45:00.000Z')).toBe(true);
    expect(() => intervalsOverlap(interval.end, interval.start, interval.start, interval.end)).toThrow();
  });

  it('rejects reusable overlaps but ignores released and non-overlapping reservations', () => {
    expect(findReusableConflict('room', [reservation()], interval.start, interval.end)).not.toBeNull();
    expect(findReusableConflict('room', [reservation({ status: RESERVATION_STATUS.cancelled })], interval.start, interval.end)).toBeNull();
    expect(findReusableConflict('room', [reservation({
      start: interval.end, end: '2026-12-10T11:00:00.000Z',
    })], interval.start, interval.end)).toBeNull();
    expect(() => assertAvailability({ resource: reusable, reservations: [reservation()], ...interval }))
      .toThrowError(expect.objectContaining({ code: 'SLOT_UNAVAILABLE' }));
  });

  it('accepts exact stock, rejects excess, and releases terminal allocations', () => {
    const allocated = reservation({ resourceId: 'stock', quantity: 2, status: RESERVATION_STATUS.pending });
    expect(() => assertAvailability({ resource: consumable, reservations: [allocated], quantity: 0, ...interval }))
      .toThrowError(expect.objectContaining({ code: 'INVALID_QUANTITY' }));
    expect(assertAvailability({ resource: consumable, reservations: [], quantity: 2, ...interval }))
      .toEqual({ available: true, remaining: 0 });
    expect(() => assertAvailability({ resource: consumable, reservations: [allocated], quantity: 1, ...interval }))
      .toThrowError(expect.objectContaining({ code: 'STOCK_UNAVAILABLE' }));
    expect(getAvailableStock(consumable, [allocated])).toBe(0);
    expect(getAvailableStock(consumable, [{ ...allocated, status: RESERVATION_STATUS.rejected }])).toBe(2);
    expect(getAvailableStock(consumable, [{ ...allocated, status: RESERVATION_STATUS.overridden }])).toBe(2);
  });
});
