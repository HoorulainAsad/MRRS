import { getAvailableStock } from '../domain/availability.js';
import { ACTIVE_RESERVATION_STATUSES } from '../domain/reservationStatus.js';
import { mockRepository } from '../data/mockRepository.js';
import { can, isPlatformAdmin, reservationTarget } from './authorization.js';
import { getVisibleResources } from './dashboardService.js';

const BASE_SUGGESTIONS = [
  'Which rooms are available?',
  'What is the status of my bookings?',
  'Find equipment',
];

export function getAssistantSuggestions(session) {
  if (isPlatformAdmin(session)) {
    return ['What can this demo assistant access?', 'Show aggregate guidance'];
  }
  return [...BASE_SUGGESTIONS];
}

function bookingGuidance(resource) {
  const policy = resource.approvalPolicy.requiresApproval
    ? 'The configured approval workflow must finish before confirmation.'
    : 'The seed policy confirms valid requests without an approval workflow.';
  return `${resource.name} is listed at ${resource.location}. ${policy} Choose your date, time, and quantity, review the complete request, and explicitly confirm it in the reservation form. This chat has not created or submitted a reservation.`;
}

function equipmentResponse(session, message, resources, reservations) {
  const ignored = new Set(['find', 'search', 'show', 'equipment', 'need', 'available', 'for', 'the', 'any']);
  const terms = message.split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !ignored.has(term));
  const equipment = resources.filter((resource) => resource.kind === 'consumable' || resource.category === 'Equipment');
  const matches = terms.length
    ? equipment.filter((resource) => terms.some((term) => `${resource.name} ${resource.category}`.toLowerCase().includes(term)))
    : equipment;
  const selected = (matches.length ? matches : equipment).slice(0, 3);
  if (!selected.length) {
    return 'No equipment matching that request is visible in your organization-scoped demo catalog.';
  }
  const items = selected.map((resource) => {
    if (resource.kind !== 'consumable') return `${resource.name} (${resource.location})`;
    const available = getAvailableStock(resource, reservations);
    return `${resource.name}: ${available} ${resource.unit} available in the current demo projection at ${resource.location}`;
  });
  return `${items.join('; ')}. Equipment requests still require review and explicit confirmation in the reservation form; nothing has been submitted here.`;
}

/** Deterministic pattern matching over tenant-scoped mocks; no AI/API calls. */
export async function getAssistantResponse(session, message, repository = mockRepository) {
  const normalized = String(message ?? '').trim().toLowerCase();
  const fallback = {
    text: 'I use deterministic demo patterns, not a live AI or external API. Ask about resource availability, booking status, or equipment in your current organization. I can guide you, but I never submit reservations.',
    suggestions: getAssistantSuggestions(session),
  };
  if (!session?.companyId || !normalized) return fallback;

  if (isPlatformAdmin(session)) {
    return {
      text: 'Platform demo access is limited to cross-tenant aggregate guidance. Private resource schedules, booking details, and inventory remain organization-scoped. This deterministic assistant does not call an AI service or submit reservations.',
      suggestions: getAssistantSuggestions(session),
    };
  }

  const resources = getVisibleResources(session, repository);
  const tenantResources = repository.listResources(session.companyId);
  const resourceNames = new Map(tenantResources.map((resource) => [resource.id, resource.name]));
  const reservations = repository.listReservations(session.companyId);

  if (/equipment|adapter|sensor|kit|device|cable/.test(normalized)) {
    return {
      text: equipmentResponse(session, normalized, resources, reservations),
      suggestions: ['What is the status of my bookings?', 'Which rooms are available?'],
    };
  }

  if (/status|booking|reservation|upcoming/.test(normalized)) {
    const visible = reservations
      .filter((reservation) => can(session, 'view', reservationTarget(reservation)))
      .sort((a, b) => a.start.localeCompare(b.start));
    if (!visible.length) {
      return {
        text: 'No reservations are visible in your current role and tenant scope. New requests must be reviewed and explicitly confirmed in the reservation form.',
        suggestions: BASE_SUGGESTIONS,
      };
    }
    const summaries = visible.slice(0, 4).map((reservation) =>
      `${resourceNames.get(reservation.resourceId)} on ${reservation.date} ${reservation.startTime}: ${reservation.status}`,
    );
    const pendingCount = visible.filter((reservation) => reservation.status === 'pending').length;
    return {
      text: `${summaries.join('; ')}. ${pendingCount ? `${pendingCount} still require configured review. ` : ''}Use the reservation detail view for any changes; this assistant cannot submit or modify a booking.`,
      suggestions: ['Which rooms are available?', 'Find equipment'],
    };
  }

  if (/available|availability|room|space|book|reserve/.test(normalized)) {
    const reusable = resources.filter((resource) => resource.kind === 'reusable');
    const named = reusable.find((resource) => normalized.includes(resource.name.toLowerCase())) ??
      reusable.find((resource) => resource.name.toLowerCase().split(/\s+/).some((word) => word.length > 4 && normalized.includes(word)));
    if (named) {
      return { text: bookingGuidance(named), suggestions: BASE_SUGGESTIONS };
    }
    if (reusable.length) {
      const visibleResourceIds = new Set(resources.map((resource) => resource.id));
      const activeCount = reservations.filter((reservation) =>
        visibleResourceIds.has(reservation.resourceId) && ACTIVE_RESERVATION_STATUSES.includes(reservation.status)).length;
      return {
        text: `Your scoped catalog includes ${reusable.slice(0, 3).map((resource) => resource.name).join(', ')}. There are ${activeCount} active demo reservations across your visible resources, but exact availability depends on your selected interval. Review the requested slot and explicitly confirm in the form; no booking has been submitted.`,
        suggestions: BASE_SUGGESTIONS,
      };
    }
    return {
      text: 'No reusable spaces are visible in your current scope. An organization administrator can review catalog access; this chat cannot submit a reservation.',
      suggestions: BASE_SUGGESTIONS,
    };
  }

  return fallback;
}
