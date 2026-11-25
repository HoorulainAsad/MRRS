import { findReusableConflict, getAvailableStock } from '../domain/availability.js';
import { ACTIVE_RESERVATION_STATUSES, RESERVATION_STATUS } from '../domain/reservationStatus.js';
import { mockRepository } from '../data/mockRepository.js';
import { can, hasAnyRole, isPlatformAdmin, reservationTarget } from './authorization.js';

export const DEMO_TODAY = '2026-11-24';

const QUICK_BOOK_START = 9 * 60;
const QUICK_BOOK_LAST_START = 16 * 60;
const QUICK_BOOK_END = 18 * 60;
const POPULAR_SPACE_ORDER = ['resource-neptune', 'resource-atlas', 'resource-garden'];

function resourceIsVisible(session, resource) {
  if (resource.companyId !== session.companyId || isPlatformAdmin(session)) return false;
  return session.roleAssignments.some((assignment) => {
    if (!Array.isArray(assignment.permissions) || !assignment.permissions.includes('view')) return false;
    switch (assignment.scope) {
      case 'company':
        return assignment.scopeId === session.companyId;
      case 'department':
        return resource.departmentIds.includes(assignment.scopeId);
      case 'team':
        return resource.teamIds.includes(assignment.scopeId);
      case 'own':
        return resource.departmentIds.includes(session.membership?.departmentId) ||
          resource.teamIds.includes(session.membership?.teamId);
      default:
        return false;
    }
  });
}

export function getVisibleResources(session, repository = mockRepository) {
  if (isPlatformAdmin(session)) return [];
  return repository.listResources(session.companyId)
    .filter((resource) => resourceIsVisible(session, resource));
}

function isActionableApproval(session, reservation, resource) {
  if (reservation.status !== RESERVATION_STATUS.pending || !resource?.approvalPolicy.requiresApproval) {
    return false;
  }
  const step = resource.approvalPolicy.steps[reservation.currentApprovalStep];
  return Boolean(step && can(session, 'approve', reservationTarget(reservation)) &&
    session.roleAssignments.some((assignment) => step.roleIds.includes(assignment.roleId)));
}

function stat(id, label, value, detail, trend = 'steady') {
  return { id, label, value, detail, trend };
}

function reservationView(reservation, resource, users = new Map()) {
  return {
    id: reservation.id,
    requesterName: users.get(reservation.requesterId)?.name ?? 'Organization member',
    resourceName: resource?.name ?? 'Resource',
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    priority: reservation.priority,
    location: resource?.location ?? 'Location unavailable',
  };
}

function validDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function normalizeDate(value) {
  return validDateString(value) ? value : DEMO_TODAY;
}

function addUtcDays(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function weekBounds(weekDate) {
  const day = new Date(`${weekDate}T00:00:00.000Z`).getUTCDay();
  const start = addUtcDays(weekDate, -((day + 6) % 7));
  return { start, end: addUtcDays(start, 6) };
}

function calendarBounds(weekDate, calendarView) {
  if (calendarView !== 'month') return weekBounds(weekDate);
  const anchor = new Date(`${weekDate.slice(0, 7)}-01T00:00:00.000Z`);
  const start = anchor.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}

function numericOption(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return NaN;
}

function normalizeOptions(options) {
  const source = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  const requestedDuration = numericOption(source.duration);
  const requestedCapacity = numericOption(source.capacity);
  return {
    weekDate: normalizeDate(source.weekDate),
    quickBookDate: normalizeDate(source.quickBookDate),
    calendarView: source.calendarView === 'month' ? 'month' : 'week',
    duration: Number.isFinite(requestedDuration) && requestedDuration > 0
      ? Math.min(QUICK_BOOK_END - QUICK_BOOK_START, Math.max(1, Math.round(requestedDuration)))
      : 60,
    capacity: Number.isInteger(requestedCapacity) && requestedCapacity > 0 ? requestedCapacity : 1,
  };
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : NaN;
}

function durationMinutes(reservation) {
  const start = timeMinutes(reservation.startTime);
  const end = timeMinutes(reservation.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return end >= start ? end - start : 24 * 60 + end - start;
}

function reservationStart(reservation) {
  return `${reservation.date ?? ''}T${reservation.startTime ?? ''}`;
}

function sortByStart(reservations) {
  return [...reservations].sort((a, b) =>
    reservationStart(a).localeCompare(reservationStart(b)) || a.id.localeCompare(b.id));
}

function resourceCapacity(resource) {
  return Number.isInteger(resource.capacity) && resource.capacity > 0 ? resource.capacity : 4;
}

function buildSlots(resource, date, duration, activeReservations) {
  const slots = [];
  for (let start = QUICK_BOOK_START;
    start <= QUICK_BOOK_LAST_START && start + duration <= QUICK_BOOK_END;
    start += 30) {
    const startTime = formatTime(start);
    const endTime = formatTime(start + duration);
    const conflict = findReusableConflict(
      resource.id,
      activeReservations,
      `${date}T${startTime}:00.000Z`,
      `${date}T${endTime}:00.000Z`,
    );
    slots.push({ startTime, endTime, available: !conflict });
  }
  return slots;
}

function buildQuickBook(resources, activeReservations, options) {
  const spaces = resources
    .filter((resource) => resource.kind === 'reusable' && resourceCapacity(resource) >= options.capacity)
    .map((resource) => ({
      resourceId: resource.id,
      name: resource.name,
      capacity: resourceCapacity(resource),
      floor: resource.floor ?? 'Main floor',
      location: resource.location,
      image: resource.image ?? '',
      imageAlt: resource.imageAlt ?? '',
      status: resource.status ?? 'available',
      requiresApproval: Boolean(resource.approvalPolicy?.requiresApproval),
      slots: buildSlots(resource, options.quickBookDate, options.duration, activeReservations),
    }));
  return {
    date: options.quickBookDate,
    duration: options.duration,
    capacity: options.capacity,
    spaces,
  };
}

function buildPopularSpaces(resources, quickBook) {
  const quickSpaces = new Map(quickBook.spaces.map((space) => [space.resourceId, space]));
  return resources
    .map((resource, index) => ({ resource, index }))
    .sort((a, b) => {
      const aRank = POPULAR_SPACE_ORDER.indexOf(a.resource.id);
      const bRank = POPULAR_SPACE_ORDER.indexOf(b.resource.id);
      const aOrder = aRank === -1 ? POPULAR_SPACE_ORDER.length + a.index : aRank;
      const bOrder = bRank === -1 ? POPULAR_SPACE_ORDER.length + b.index : bRank;
      return aOrder - bOrder;
    })
    .filter(({ resource }) => resource.kind === 'reusable' && Boolean(resource.image))
    .slice(0, 3)
    .map(({ resource }) => ({
      id: resource.id,
      name: resource.name,
      category: resource.category,
      capacity: resourceCapacity(resource),
      floor: resource.floor ?? 'Main floor',
      location: resource.location,
      description: resource.description ?? '',
      image: resource.image,
      imageAlt: resource.imageAlt ?? '',
      status: resource.status ?? 'available',
      available: quickSpaces.get(resource.id)?.slots.some((slot) => slot.available) ?? false,
      requiresApproval: Boolean(resource.approvalPolicy?.requiresApproval),
    }));
}

function buildCalendarEvents(resources, resourceMap, activeReservations, bounds, session) {
  const reusableIds = new Set(resources.filter((resource) => resource.kind === 'reusable').map((resource) => resource.id));
  const { start, end } = bounds;
  // Visible rooms expose anonymous busy blocks only; details remain authorization-scoped.
  return sortByStart(activeReservations.filter((reservation) =>
    reusableIds.has(reservation.resourceId) && reservation.date >= start && reservation.date <= end))
    .map((reservation) => {
      const isOwn = reservation.requesterId === session.userId;
      return {
        id: reservation.id,
        resourceId: reservation.resourceId,
        resourceName: resourceMap.get(reservation.resourceId)?.name ?? 'Resource',
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        priority: reservation.priority,
        isOwn,
        category: isOwn ? 'own' : 'reserved',
      };
    });
}

function buildTodaySchedule(reservations, resourceMap, visibleResourceIds, session) {
  return sortByStart(reservations.filter((reservation) =>
    ACTIVE_RESERVATION_STATUSES.includes(reservation.status) &&
    reservation.date === DEMO_TODAY && visibleResourceIds.has(reservation.resourceId)))
    .map((reservation) => {
      const isOwn = reservation.requesterId === session.userId;
      return {
        id: reservation.id,
        resourceId: reservation.resourceId,
        resourceName: resourceMap.get(reservation.resourceId)?.name ?? 'Resource',
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        priority: reservation.priority,
        isOwn,
        purpose: isOwn ? String(reservation.purpose ?? '').trim() : '',
        durationMinutes: durationMinutes(reservation),
      };
    });
}

function buildMetrics(resources, allReservations, authorizedReservations, session) {
  const reusable = resources.filter((resource) => resource.kind === 'reusable');
  const reusableIds = new Set(reusable.map((resource) => resource.id));
  const visibleIds = new Set(resources.map((resource) => resource.id));
  const active = allReservations.filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status));
  const occupiedIds = new Set(active
    .filter((reservation) => reservation.date === DEMO_TODAY && reusableIds.has(reservation.resourceId))
    .map((reservation) => reservation.resourceId));
  const authorizedActive = authorizedReservations
    .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status));
  const personal = authorizedActive.filter((reservation) => reservation.requesterId === session.userId);
  const occupiedRooms = occupiedIds.size;
  const totalRooms = reusable.length;
  return {
    occupancyPercent: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    occupiedRooms,
    totalRooms,
    activeReservations: authorizedActive.length,
    activeToday: authorizedActive.filter((reservation) =>
      reservation.date === DEMO_TODAY && visibleIds.has(reservation.resourceId)).length,
    availableSpaces: reusable.filter((resource) =>
      !occupiedIds.has(resource.id) && resource.status === 'available').length,
    personalReservations: personal.length,
    personalConfirmed: personal.filter((reservation) => reservation.status === RESERVATION_STATUS.confirmed).length,
  };
}

function platformDashboard(repository, options) {
  const companies = repository.listCompanies();
  const snapshots = companies.map((company) => ({
    resources: repository.listResources(company.id),
    reservations: repository.listReservations(company.id),
  }));
  const resources = snapshots.flatMap((snapshot) => snapshot.resources);
  const reservations = snapshots.flatMap((snapshot) => snapshot.reservations);
  const active = reservations.filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status));
  const averageUtilization = resources.length
    ? Math.round(resources.reduce((sum, resource) => sum + resource.utilization, 0) / resources.length)
    : 0;

  return {
    platform: true,
    referenceDate: DEMO_TODAY,
    calendarEvents: [],
    quickBook: { date: options.quickBookDate, duration: options.duration, capacity: options.capacity, spaces: [] },
    todaySchedule: [],
    popularSpaces: [],
    metrics: null,
    stats: [
      stat('organizations', 'Organizations', companies.length, 'Aggregate tenant count only', 'steady'),
      stat('resources', 'Total resources', resources.length, 'Cross-tenant aggregate', 'up'),
      stat('active-reservations', 'Active reservations', active.length, 'No private booking details exposed', 'steady'),
      stat('utilization', 'Average utilization', `${averageUtilization}%`, 'Across tenant resource aggregates', 'up'),
    ],
    upcomingReservations: [],
    pendingApprovals: [],
    resourceAvailability: [],
    activities: [{
      id: 'platform-aggregate-activity',
      message: 'Tenant aggregate snapshot refreshed; private reservation details remain organization-scoped.',
      timestamp: '2026-11-24T09:00:00.000Z',
      type: 'system',
    }],
    stockAlerts: [],
  };
}

/** Asynchronous UI contract backed only by deterministic browser mock data. */
export async function getDashboardData(session, repository = mockRepository, options = {}) {
  if (!session?.companyId) throw new Error('A valid demo session is required.');
  const normalizedOptions = normalizeOptions(options);
  if (isPlatformAdmin(session)) return platformDashboard(repository, normalizedOptions);

  const resources = getVisibleResources(session, repository);
  const allTenantResources = repository.listResources(session.companyId);
  const allReservations = repository.listReservations(session.companyId);
  const activeReservations = allReservations
    .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status));
  const reservations = allReservations.filter((reservation) => can(session, 'view', reservationTarget(reservation)));
  const resourceMap = new Map(allTenantResources.map((resource) => [resource.id, resource]));
  const users = new Map(repository.listUsers(session.companyId).map((user) => [user.id, user]));
  const visibleReservationIds = new Set(reservations.map((reservation) => reservation.id));
  const visibleResourceIds = new Set(resources.map((resource) => resource.id));

  const quickBook = buildQuickBook(resources, activeReservations, normalizedOptions);
  const calendarEvents = buildCalendarEvents(
    resources,
    resourceMap,
    activeReservations,
    calendarBounds(normalizedOptions.weekDate, normalizedOptions.calendarView),
    session,
  );
  const todaySchedule = buildTodaySchedule(reservations, resourceMap, visibleResourceIds, session);
  const popularSpaces = buildPopularSpaces(resources, quickBook);
  const metrics = buildMetrics(resources, allReservations, reservations, session);

  const upcomingReservations = reservations
    .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((reservation) => {
      const view = reservationView(reservation, resourceMap.get(reservation.resourceId), users);
      delete view.requesterName;
      return view;
    });

  const pendingApprovals = allReservations
    .filter((reservation) => isActionableApproval(session, reservation, resourceMap.get(reservation.resourceId)))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((reservation) => {
      const view = reservationView(reservation, resourceMap.get(reservation.resourceId), users);
      delete view.location;
      return view;
    });

  const resourceAvailability = resources.map((resource) => {
    const available = resource.kind === 'consumable'
      ? getAvailableStock(resource, allReservations)
      : null;
    return {
      id: resource.id,
      name: resource.name,
      category: resource.category,
      kind: resource.kind,
      status: available === 0 ? 'out_of_stock' : resource.status,
      location: resource.location,
      capacity: resourceCapacity(resource),
      image: resource.image ?? '',
      imageAlt: resource.imageAlt ?? '',
      requiresApproval: Boolean(resource.approvalPolicy?.requiresApproval),
      utilization: resource.utilization,
    };
  });

  const activities = repository.listHistory(session.companyId)
    .filter((entry) => visibleReservationIds.has(entry.reservationId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6)
    .map((entry) => ({
      id: entry.id,
      message: entry.message,
      timestamp: entry.timestamp,
      type: entry.action,
    }));

  const stockAlerts = resources
    .filter((resource) => resource.kind === 'consumable')
    .map((resource) => ({
      id: resource.id,
      name: resource.name,
      available: getAvailableStock(resource, allReservations),
      unit: resource.unit,
      threshold: resource.threshold,
    }))
    .filter((resource) => resource.available <= resource.threshold);

  return {
    referenceDate: DEMO_TODAY,
    calendarEvents,
    quickBook,
    todaySchedule,
    popularSpaces,
    metrics,
    stats: [
      stat('occupancy', 'Room occupancy', `${metrics.occupancyPercent}%`,
        `${metrics.occupiedRooms} of ${metrics.totalRooms} visible rooms occupied today`),
      stat('active', 'Active reservations', metrics.activeReservations,
        `${metrics.activeToday} active in your authorized scope today`, 'up'),
      stat('available', 'Available spaces', metrics.availableSpaces,
        'Visible rooms with no active booking today'),
      stat('personal', 'Personal reservations', metrics.personalReservations,
        `${metrics.personalConfirmed} confirmed reservations owned by you`, 'up'),
    ],
    upcomingReservations,
    pendingApprovals,
    resourceAvailability,
    activities,
    stockAlerts,
  };
}
