import { beforeEach, describe, expect, it } from 'vitest';
import { MockRepository } from '../../src/data/mockRepository.js';
import { createSeedState } from '../../src/data/seed.js';
import { RESERVATION_STATUS } from '../../src/domain/reservationStatus.js';
import { ReservationService } from '../../src/services/reservationService.js';
import { getDemoSession } from '../../src/services/sessionService.js';

const NOW = '2026-11-24T12:00:00.000Z';
const companyId = 'company-northstar';

function request(resourceId, overrides = {}) {
  return {
    resourceId,
    date: '2026-12-10',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'normal',
    ...overrides,
  };
}

describe('reservation commands', () => {
  let repository;
  let service;
  let employee;
  let otherEmployee;
  let manager;
  let hod;

  beforeEach(() => {
    repository = new MockRepository(createSeedState());
    service = new ReservationService({ repository, clock: () => NOW });
    employee = getDemoSession('user-north-employee');
    otherEmployee = getDemoSession('user-north-employee-2');
    manager = getDemoSession('user-north-manager');
    hod = getDemoSession('user-north-hod');
  });

  it('uses the explicit seed workflow/no-workflow policy and denies cross-tenant resources', async () => {
    const confirmed = await service.submit(employee, request('resource-atlas'));
    expect(confirmed.status).toBe(RESERVATION_STATUS.confirmed);
    expect(confirmed.currentApprovalStep).toBeNull();

    const pending = await service.submit(employee, request('resource-neptune', {
      date: '2026-12-11', startTime: '09:00', endTime: '10:00',
    }));
    expect(pending.status).toBe(RESERVATION_STATUS.pending);
    expect(pending.currentApprovalStep).toBe(0);

    const before = repository.listReservations(companyId).length;
    await expect(service.submit(employee, request('resource-aurora')))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(repository.listReservations(companyId)).toHaveLength(before);
  });

  it('requires sequential approval roles and atomically appends history/notifications', async () => {
    const historyBefore = repository.listHistory(companyId).length;
    const notificationsBefore = repository.listNotifications(companyId).length;
    const original = repository.getReservation(companyId, 'reservation-north-pending');

    await expect(service.approve(hod, original.id)).rejects.toMatchObject({ code: 'OUT_OF_ORDER_APPROVAL' });
    expect(repository.getReservation(companyId, original.id)).toEqual(original);
    expect(repository.listHistory(companyId)).toHaveLength(historyBefore);
    expect(repository.listNotifications(companyId)).toHaveLength(notificationsBefore);

    const managerResult = await service.approve(manager, original.id);
    expect(managerResult.status).toBe(RESERVATION_STATUS.pending);
    expect(managerResult.currentApprovalStep).toBe(1);
    const finalResult = await service.approve(hod, original.id);
    expect(finalResult.status).toBe(RESERVATION_STATUS.confirmed);
    expect(finalResult.approvals.map((approval) => approval.stepId)).toEqual(['manager-review', 'hod-review']);
    expect(repository.listHistory(companyId)).toHaveLength(historyBefore + 2);
    expect(repository.listNotifications(companyId)).toHaveLength(notificationsBefore + 4);
    expect(repository.listNotifications(companyId).slice(-4).every((entry) => entry.companyId === companyId)).toBe(true);
  });

  it('releases a pending slot on rejection', async () => {
    const pending = await service.submit(employee, request('resource-neptune'));
    await expect(service.submit(otherEmployee, request('resource-neptune')))
      .rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE' });

    await service.reject(manager, pending.id, 'Project schedule changed.');
    expect(repository.getReservation(companyId, pending.id).status).toBe(RESERVATION_STATUS.rejected);
    const replacement = await service.submit(otherEmployee, request('resource-neptune'));
    expect(replacement.status).toBe(RESERVATION_STATUS.pending);
  });

  it('releases a confirmed slot on cancellation', async () => {
    const existing = repository.getReservation(companyId, 'reservation-north-confirmed');
    const sameSlot = request('resource-atlas', {
      date: existing.date, startTime: existing.startTime, endTime: existing.endTime,
    });
    await expect(service.submit(otherEmployee, sameSlot)).rejects.toMatchObject({ code: 'SLOT_UNAVAILABLE' });
    await service.cancel(employee, existing.id, 'No longer needed');
    const replacement = await service.submit(otherEmployee, sameSlot);
    expect(replacement.status).toBe(RESERVATION_STATUS.confirmed);
  });

  it('allows exact stock, rejects excess, and releases stock on cancellation', async () => {
    const allocated = await service.submit(employee, request('resource-adapters', { quantity: 6 }));
    expect(allocated.status).toBe(RESERVATION_STATUS.confirmed);
    await expect(service.submit(otherEmployee, request('resource-adapters', { quantity: 1 })))
      .rejects.toMatchObject({ code: 'STOCK_UNAVAILABLE' });
    await service.cancel(employee, allocated.id);
    await expect(service.submit(otherEmployee, request('resource-adapters', { quantity: 6 })))
      .resolves.toMatchObject({ status: RESERVATION_STATUS.confirmed, quantity: 6 });
  });

  it('enforces override permission, reason, and strictly higher priority without partial writes', async () => {
    const targetId = 'reservation-north-confirmed';
    const incoming = request('resource-atlas', {
      date: '2026-12-01', startTime: '11:00', endTime: '12:00', priority: 'urgent',
    });
    const before = repository.listReservations(companyId);

    await expect(service.override(employee, targetId, incoming, 'Emergency'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(service.override(manager, targetId, incoming, '   '))
      .rejects.toMatchObject({ code: 'OVERRIDE_REASON_REQUIRED' });
    await expect(service.override(manager, targetId, { ...incoming, priority: 'high' }, 'Same priority'))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_PRIORITY' });
    expect(repository.listReservations(companyId)).toEqual(before);
  });

  it('overrides the target and follows the incoming no-workflow confirmation policy', async () => {
    const historyBefore = repository.listHistory(companyId).length;
    const notificationsBefore = repository.listNotifications(companyId).length;
    const result = await service.override(manager, 'reservation-north-confirmed', request('resource-atlas', {
      date: '2026-12-01', startTime: '11:00', endTime: '12:00', priority: 'urgent',
    }), 'Urgent executive incident review');

    expect(result.target.status).toBe(RESERVATION_STATUS.overridden);
    expect(result.target.overrideReason).toBe('Urgent executive incident review');
    expect(result.target.overriddenBy).toBe(result.incoming.id);
    expect(result.incoming.status).toBe(RESERVATION_STATUS.confirmed);
    expect(repository.listHistory(companyId)).toHaveLength(historyBefore + 2);
    expect(repository.listNotifications(companyId)).toHaveLength(notificationsBefore + 4);
  });

  it('requires a confirmed override target and keeps the incoming request pending when its policy requires approval', async () => {
    const incoming = request('resource-neptune', {
      date: '2026-12-01', startTime: '09:00', endTime: '10:00', priority: 'high',
    });
    await expect(service.override(manager, 'reservation-north-pending', incoming, 'Higher-priority client workshop'))
      .rejects.toMatchObject({ code: 'INVALID_STATE' });

    await service.approve(manager, 'reservation-north-pending');
    await service.approve(hod, 'reservation-north-pending');
    const result = await service.override(manager, 'reservation-north-pending', incoming, 'Higher-priority client workshop');
    expect(result.target.status).toBe(RESERVATION_STATUS.overridden);
    expect(result.incoming.status).toBe(RESERVATION_STATUS.pending);
    expect(result.incoming.currentApprovalStep).toBe(0);
  });

  it('checks in only the owner of a valid confirmed reservation, once', async () => {
    await expect(service.checkIn(otherEmployee, 'reservation-north-confirmed'))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(service.checkIn(employee, 'reservation-north-pending'))
      .rejects.toMatchObject({ code: 'INVALID_STATE' });

    const checkedIn = await service.checkIn(employee, 'reservation-north-confirmed');
    expect(checkedIn.checkedInAt).toBe(NOW);
    await expect(service.checkIn(employee, checkedIn.id)).rejects.toMatchObject({ code: 'ALREADY_CHECKED_IN' });
  });

  it('rolls back reservation, permanent history, and notifications when a late id fails', async () => {
    let calls = 0;
    const failingService = new ReservationService({
      repository,
      clock: () => NOW,
      idGenerator: (prefix) => {
        calls += 1;
        if (calls === 4) throw new Error('Simulated notification id failure');
        return `${prefix}-atomic-test`;
      },
    });
    const before = {
      reservations: repository.listReservations(companyId),
      history: repository.listHistory(companyId),
      notifications: repository.listNotifications(companyId),
    };

    await expect(failingService.submit(employee, request('resource-atlas')))
      .rejects.toThrow('Simulated notification id failure');
    expect(repository.listReservations(companyId)).toEqual(before.reservations);
    expect(repository.listHistory(companyId)).toEqual(before.history);
    expect(repository.listNotifications(companyId)).toEqual(before.notifications);
    expect(repository.updateHistory).toBeUndefined();
    expect(repository.deleteHistory).toBeUndefined();
  });
});
