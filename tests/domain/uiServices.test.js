import { describe, expect, it } from 'vitest';
import { createReservation } from '../../src/domain/models.js';
import { RESERVATION_STATUS } from '../../src/domain/reservationStatus.js';
import { MockRepository } from '../../src/data/mockRepository.js';
import { createSeedState } from '../../src/data/seed.js';
import { getAssistantResponse, getAssistantSuggestions } from '../../src/services/assistantService.js';
import { getDashboardData } from '../../src/services/dashboardService.js';
import { getDemoSession } from '../../src/services/sessionService.js';

describe('tenant-scoped UI services', () => {
  it('requires explicit tenant reads and normalizes duplicate resource links', async () => {
    const repository = new MockRepository(createSeedState());
    expect(() => repository.listResources()).toThrow('explicit companyId');
    expect(repository.getResource('company-northstar', 'resource-aurora')).toBeNull();
    expect(repository.getResource('company-northstar', 'resource-neptune').departmentIds)
      .toEqual(['department-engineering']);

    const dashboard = await getDashboardData(getDemoSession('user-north-employee'), repository);
    expect(dashboard.upcomingReservations.length).toBeGreaterThan(0);
    expect(dashboard.upcomingReservations.every((item) => item.id !== 'reservation-north-teammate')).toBe(true);
    expect(dashboard.pendingApprovals).toEqual([]);
    expect(dashboard.stockAlerts).toEqual([
      expect.objectContaining({ id: 'resource-adapters', available: 2, threshold: 3 }),
    ]);
  });

  it('returns actionable department approvals without another tenant\'s details', async () => {
    const repository = new MockRepository(createSeedState());
    const dashboard = await getDashboardData(getDemoSession('user-north-manager'), repository);
    expect(dashboard.pendingApprovals.map((item) => item.id)).toContain('reservation-north-pending');
    expect(dashboard.pendingApprovals.map((item) => item.id)).not.toContain('reservation-academy-pending');
    expect(JSON.stringify(dashboard)).not.toContain('Theo Brooks');
    expect(dashboard.stats).toHaveLength(4);
    expect(dashboard.activities.length).toBeGreaterThan(0);
  });

  it('allows platform aggregates but no unrestricted private booking/resource details', async () => {
    const repository = new MockRepository(createSeedState());
    const dashboard = await getDashboardData(getDemoSession('user-platform'), repository);
    expect(dashboard.stats[0]).toMatchObject({ id: 'organizations', value: 2 });
    expect(dashboard.upcomingReservations).toEqual([]);
    expect(dashboard.pendingApprovals).toEqual([]);
    expect(dashboard.resourceAvailability).toEqual([]);
    expect(dashboard.stockAlerts).toEqual([]);
    expect(JSON.stringify(dashboard)).not.toContain('Elena Rivera');
  });

  it('guides availability with review and explicit confirmation without submitting', async () => {
    const repository = new MockRepository(createSeedState());
    const session = getDemoSession('user-north-employee');
    const before = repository.listReservations(session.companyId).length;
    const response = await getAssistantResponse(session, 'Is The Nook available?', repository);
    expect(response.text).toContain('The Nook');
    expect(response.text).toContain('review');
    expect(response.text).toContain('explicitly confirm');
    expect(response.text).toContain('not created or submitted');
    expect(repository.listReservations(session.companyId)).toHaveLength(before);
    expect(getAssistantSuggestions(session)).toContain('Find equipment');
  });

  it('excludes out-of-scope resources from assistant availability counts', async () => {
    const state = createSeedState();
    state.reservations.push(createReservation({
      id: 'reservation-workshop-out-of-scope',
      companyId: 'company-northstar',
      resourceId: 'resource-workshop',
      requesterId: 'user-north-employee-2',
      departmentId: 'department-facilities',
      teamId: 'team-operations',
      start: '2026-12-05T09:00:00.000Z',
      end: '2026-12-05T10:00:00.000Z',
      date: '2026-12-05',
      startTime: '09:00',
      endTime: '10:00',
      status: RESERVATION_STATUS.confirmed,
      requiresApproval: false,
      currentApprovalStep: null,
    }));
    const repository = new MockRepository(state);
    const response = await getAssistantResponse(
      getDemoSession('user-north-employee'),
      'Which rooms are available?',
      repository,
    );
    expect(response.text).toContain('7 active demo reservations');
    expect(response.text).not.toContain('8 active demo reservations');
  });

  it('scopes assistant status/equipment responses and provides an honest fallback', async () => {
    const repository = new MockRepository(createSeedState());
    const session = getDemoSession('user-north-employee');
    const status = await getAssistantResponse(session, 'Show my booking status', repository);
    expect(status.text).toContain('The Studio');
    expect(status.text).not.toContain('Aurora Science Lab');
    expect(status.text).not.toContain('Theo Brooks');

    const equipment = await getAssistantResponse(session, 'Find adapter equipment', repository);
    expect(equipment.text).toContain('USB-C Presentation Adapters');
    expect(equipment.text).not.toContain('Environmental Sensor Kits');

    const fallback = await getAssistantResponse(session, 'Tell me something unrelated', repository);
    expect(fallback.text).toContain('not a live AI or external API');
    expect(fallback.suggestions.length).toBeGreaterThan(0);
  });
});
