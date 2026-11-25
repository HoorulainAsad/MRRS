import { createReservation, createResource } from '../domain/models.js';
import { RESERVATION_STATUS } from '../domain/reservationStatus.js';

const DEMO_PASSWORD = 'demo123';
const NORTH = 'company-northstar';
const ACADEMY = 'company-greenfield';

const workflow = (steps) => ({ requiresApproval: true, steps });
const noWorkflow = { requiresApproval: false, steps: [] };
const managerThenHod = [
  { id: 'manager-review', label: 'Manager review', roleIds: ['role-manager'] },
  { id: 'hod-review', label: 'Head of department review', roleIds: ['role-hod'] },
];

function user(id, companyId, name, email) {
  return { id, companyId, name, email, demoPassword: DEMO_PASSWORD };
}

function assignment(id, userId, companyId, roleId, scope, scopeId) {
  return { id, userId, companyId, roleId, scope, scopeId };
}

function event(historyId, reservation, action, message, timestamp, actorId = reservation.requesterId) {
  return {
    id: historyId,
    companyId: reservation.companyId,
    reservationId: reservation.id,
    actorId,
    action,
    fromStatus: null,
    toStatus: reservation.status,
    message,
    timestamp,
  };
}

function notificationPair(reservation, suffix, message, timestamp) {
  return ['in_app', 'email_request'].map((channel, index) => ({
    id: `notification-${reservation.id}-${suffix}-${index + 1}`,
    companyId: reservation.companyId,
    userId: reservation.requesterId,
    reservationId: reservation.id,
    channel,
    type: 'reservation_update',
    message,
    createdAt: timestamp,
    deliveryStatus: channel === 'email_request' ? 'simulated' : 'recorded',
    readAt: null,
  }));
}

/** A fresh deterministic graph for every repository/test instance. */
export function createSeedState() {
  const companies = [
    { id: NORTH, name: 'Northstar Labs', type: 'enterprise' },
    { id: ACADEMY, name: 'Greenfield Academy', type: 'education' },
  ];

  const departments = [
    { id: 'department-engineering', companyId: NORTH, name: 'Engineering' },
    { id: 'department-facilities', companyId: NORTH, name: 'Facilities' },
    { id: 'department-science', companyId: ACADEMY, name: 'Science' },
    { id: 'department-arts', companyId: ACADEMY, name: 'Creative Arts' },
  ];

  const teams = [
    { id: 'team-alpha', companyId: NORTH, departmentId: 'department-engineering', name: 'Alpha Product' },
    { id: 'team-beta', companyId: NORTH, departmentId: 'department-engineering', name: 'Beta Platform' },
    { id: 'team-operations', companyId: NORTH, departmentId: 'department-facilities', name: 'Operations' },
    { id: 'team-research', companyId: ACADEMY, departmentId: 'department-science', name: 'Student Research' },
    { id: 'team-design', companyId: ACADEMY, departmentId: 'department-arts', name: 'Design Cohort' },
  ];

  const roles = [
    {
      id: 'role-platform-super-admin',
      name: 'Platform Super Admin',
      isGlobal: true,
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'override', 'manage_users'],
    },
    {
      id: 'role-company-admin',
      name: 'Company Admin',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'override', 'manage_users'],
    },
    {
      id: 'role-hod',
      name: 'HOD',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'override', 'manage_users'],
    },
    {
      id: 'role-manager',
      name: 'Manager',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'override', 'manage_users'],
    },
    {
      id: 'role-team-lead',
      name: 'Team Lead',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign'],
    },
    {
      id: 'role-employee',
      name: 'Employee',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete'],
    },
    {
      id: 'role-student',
      name: 'Student',
      isGlobal: false,
      permissions: ['view', 'create', 'edit', 'delete'],
    },
  ];

  const users = [
    user('user-platform', NORTH, 'Avery Stone', 'platform@demo.test'),
    user('user-north-admin', NORTH, 'Nora Bennett', 'north.admin@demo.test'),
    user('user-north-hod', NORTH, 'Hector Owens', 'north.hod@demo.test'),
    user('user-north-manager', NORTH, 'Maya Morgan', 'north.manager@demo.test'),
    user('user-north-lead', NORTH, 'Liam Chen', 'north.lead@demo.test'),
    user('user-north-employee', NORTH, 'Elena Rivera', 'north.employee@demo.test'),
    user('user-north-employee-2', NORTH, 'Noah Williams', 'north.employee2@demo.test'),
    user('user-academy-admin', ACADEMY, 'Grace Patel', 'academy.admin@demo.test'),
    user('user-academy-hod', ACADEMY, 'Samira Holt', 'academy.hod@demo.test'),
    user('user-academy-student', ACADEMY, 'Theo Brooks', 'academy.student@demo.test'),
  ];

  const memberships = [
    { id: 'membership-platform', userId: 'user-platform', companyId: NORTH, departmentId: 'department-engineering', teamId: 'team-alpha' },
    { id: 'membership-north-admin', userId: 'user-north-admin', companyId: NORTH, departmentId: 'department-facilities', teamId: 'team-operations' },
    { id: 'membership-north-hod', userId: 'user-north-hod', companyId: NORTH, departmentId: 'department-engineering', teamId: null },
    { id: 'membership-north-manager', userId: 'user-north-manager', companyId: NORTH, departmentId: 'department-engineering', teamId: null },
    { id: 'membership-north-lead', userId: 'user-north-lead', companyId: NORTH, departmentId: 'department-engineering', teamId: 'team-alpha' },
    { id: 'membership-north-employee', userId: 'user-north-employee', companyId: NORTH, departmentId: 'department-engineering', teamId: 'team-alpha' },
    { id: 'membership-north-employee-2', userId: 'user-north-employee-2', companyId: NORTH, departmentId: 'department-engineering', teamId: 'team-alpha' },
    { id: 'membership-academy-admin', userId: 'user-academy-admin', companyId: ACADEMY, departmentId: 'department-science', teamId: 'team-research' },
    { id: 'membership-academy-hod', userId: 'user-academy-hod', companyId: ACADEMY, departmentId: 'department-science', teamId: null },
    { id: 'membership-academy-student', userId: 'user-academy-student', companyId: ACADEMY, departmentId: 'department-science', teamId: 'team-research' },
  ];

  const roleAssignments = [
    assignment('assignment-platform', 'user-platform', null, 'role-platform-super-admin', 'platform', 'platform'),
    assignment('assignment-north-admin', 'user-north-admin', NORTH, 'role-company-admin', 'company', NORTH),
    assignment('assignment-north-hod', 'user-north-hod', NORTH, 'role-hod', 'department', 'department-engineering'),
    assignment('assignment-north-manager', 'user-north-manager', NORTH, 'role-manager', 'department', 'department-engineering'),
    assignment('assignment-north-lead', 'user-north-lead', NORTH, 'role-team-lead', 'team', 'team-alpha'),
    assignment('assignment-north-employee', 'user-north-employee', NORTH, 'role-employee', 'own', 'user-north-employee'),
    assignment('assignment-north-employee-2', 'user-north-employee-2', NORTH, 'role-employee', 'own', 'user-north-employee-2'),
    assignment('assignment-academy-admin', 'user-academy-admin', ACADEMY, 'role-company-admin', 'company', ACADEMY),
    assignment('assignment-academy-hod', 'user-academy-hod', ACADEMY, 'role-hod', 'department', 'department-science'),
    assignment('assignment-academy-student', 'user-academy-student', ACADEMY, 'role-student', 'own', 'user-academy-student'),
  ];

  const resources = [
    createResource({
      id: 'resource-neptune', companyId: NORTH, name: 'The Nook', category: 'Meeting room',
      kind: 'reusable', departmentIds: ['department-engineering'], teamIds: ['team-alpha'],
      location: 'Northstar · Level 2', utilization: 72,
      capacity: 4, floor: 'Floor 2',
      description: 'A quiet collaboration room for focused conversations and small product sessions.',
      image: '/assets/spaces/the-nook.jpg',
      imageAlt: 'Warm private meeting room with a timber table and soft daylight',
      photoCredit: 'Unsplash', approvalPolicy: workflow(managerThenHod),
    }),
    createResource({
      id: 'resource-atlas', companyId: NORTH, name: 'The Studio', category: 'Meeting room',
      kind: 'reusable', departmentIds: ['department-engineering'], teamIds: ['team-alpha', 'team-beta'],
      location: 'Northstar · Level 1', utilization: 48,
      capacity: 6, floor: 'Floor 1',
      description: 'A creative studio with shared work tables for brainstorming and design sessions.',
      image: '/assets/spaces/the-studio.jpg',
      imageAlt: 'Bright creative studio with shared work tables',
      photoCredit: 'Office Lovin', approvalPolicy: noWorkflow,
    }),
    createResource({
      id: 'resource-garden', companyId: NORTH, name: 'The Garden', category: 'Meeting room',
      kind: 'reusable', departmentIds: ['department-engineering'], teamIds: ['team-alpha', 'team-beta'],
      location: 'Northstar · Level 2', utilization: 38,
      capacity: 4, floor: 'Floor 2',
      description: 'A plant-filled focus room for quiet work and small team sessions.',
      image: '/assets/spaces/the-garden.jpg',
      imageAlt: 'Calm meeting room with greenery and natural light',
      photoCredit: 'Servcorp', approvalPolicy: noWorkflow,
    }),
    createResource({
      id: 'resource-boardroom', companyId: NORTH, name: 'The Boardroom', category: 'Meeting room',
      kind: 'reusable', departmentIds: ['department-engineering'], teamIds: ['team-alpha', 'team-beta'],
      location: 'Northstar · Level 3', utilization: 54,
      capacity: 10, floor: 'Floor 3',
      description: 'An executive meeting room with a long conference table and presentation facilities.',
      image: '/assets/spaces/the-boardroom.jpg',
      imageAlt: 'Contemporary boardroom with a long conference table',
      photoCredit: 'Unsplash', approvalPolicy: workflow(managerThenHod),
    }),
    createResource({
      id: 'resource-workshop', companyId: NORTH, name: 'Innovation Workshop', category: 'Event space',
      kind: 'reusable', departmentIds: ['department-facilities'], teamIds: ['team-operations'],
      location: 'Northstar · Level 1', utilization: 61,
      capacity: 12, floor: 'Floor 1',
      description: 'A flexible event space for workshops, planning sessions, and team collaborations.',
      image: '/assets/spaces/the-studio.jpg',
      imageAlt: 'Open workshop with shared tables and presentation screens',
      photoCredit: 'Office Lovin',
      approvalPolicy: workflow([{ id: 'facilities-review', label: 'Facilities review', roleIds: ['role-company-admin'] }]),
    }),
    createResource({
      id: 'resource-adapters', companyId: NORTH, name: 'USB-C Presentation Adapters', category: 'Equipment',
      kind: 'consumable', departmentIds: ['department-engineering'], teamIds: ['team-alpha', 'team-beta'],
      location: 'Northstar · Equipment desk', utilization: 83, totalStock: 6, threshold: 3, unit: 'adapters',
      approvalPolicy: noWorkflow,
    }),
    createResource({
      id: 'resource-aurora', companyId: ACADEMY, name: 'Aurora Science Lab', category: 'Laboratory',
      kind: 'reusable', departmentIds: ['department-science'], teamIds: ['team-research'],
      location: 'Greenfield · Science Wing', utilization: 67,
      capacity: 16, floor: 'Ground floor',
      description: 'A practical science lab with shared benches for experiments and research groups.',
      image: '/assets/spaces/the-studio.jpg',
      imageAlt: 'Flexible science workspace with shared benches and natural light',
      photoCredit: 'Unsplash',
      approvalPolicy: workflow([{ id: 'science-review', label: 'Science HOD review', roleIds: ['role-hod'] }]),
    }),
    createResource({
      id: 'resource-studio', companyId: ACADEMY, name: 'Willow Design Studio', category: 'Studio',
      kind: 'reusable', departmentIds: ['department-arts'], teamIds: ['team-design'],
      location: 'Greenfield · Arts Building', utilization: 35,
      capacity: 8, floor: 'Floor 1',
      description: 'A bright design studio for creative projects, critiques, and collaborative making.',
      image: '/assets/spaces/the-studio.jpg',
      imageAlt: 'Bright design studio with shared work tables',
      photoCredit: 'Office Lovin', approvalPolicy: noWorkflow,
    }),
    createResource({
      id: 'resource-sensors', companyId: ACADEMY, name: 'Environmental Sensor Kits', category: 'Equipment',
      kind: 'consumable', departmentIds: ['department-science'], teamIds: ['team-research'],
      location: 'Greenfield · Lab stores', utilization: 55, totalStock: 8, threshold: 2, unit: 'kits',
      approvalPolicy: noWorkflow,
    }),
  ];

  const reservations = [
    createReservation({
      id: 'reservation-north-pending', companyId: NORTH, resourceId: 'resource-neptune',
      requesterId: 'user-north-employee', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-24T09:00:00.000Z', end: '2026-11-24T10:00:00.000Z', date: '2026-11-24', startTime: '09:00', endTime: '10:00',
      purpose: 'Product planning', priority: 'normal', status: RESERVATION_STATUS.pending, requiresApproval: true, currentApprovalStep: 0,
    }),
    createReservation({
      id: 'reservation-north-confirmed', companyId: NORTH, resourceId: 'resource-atlas',
      requesterId: 'user-north-employee', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-24T11:00:00.000Z', end: '2026-11-24T12:00:00.000Z', date: '2026-11-24', startTime: '11:00', endTime: '12:00',
      purpose: 'Design review', priority: 'high', status: RESERVATION_STATUS.confirmed, requiresApproval: false, currentApprovalStep: null,
    }),
    createReservation({
      id: 'reservation-north-teammate', companyId: NORTH, resourceId: 'resource-neptune',
      requesterId: 'user-north-employee-2', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-25T14:00:00.000Z', end: '2026-11-25T15:00:00.000Z', date: '2026-11-25', startTime: '14:00', endTime: '15:00',
      purpose: 'Project sync', priority: 'urgent', status: RESERVATION_STATUS.confirmed, requiresApproval: true, currentApprovalStep: 2,
      approvals: [
        { stepId: 'manager-review', actorId: 'user-north-manager', decision: 'approved', timestamp: '2026-11-22T10:00:00.000Z' },
        { stepId: 'hod-review', actorId: 'user-north-hod', decision: 'approved', timestamp: '2026-11-22T11:00:00.000Z' },
      ],
    }),
    createReservation({
      id: 'reservation-north-adapters', companyId: NORTH, resourceId: 'resource-adapters',
      requesterId: 'user-north-employee-2', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-24T09:00:00.000Z', end: '2026-11-24T17:00:00.000Z', date: '2026-11-24', startTime: '09:00', endTime: '17:00',
      quantity: 4, priority: 'normal', status: RESERVATION_STATUS.confirmed, requiresApproval: false, currentApprovalStep: null,
    }),
    createReservation({
      id: 'reservation-academy-pending', companyId: ACADEMY, resourceId: 'resource-aurora',
      requesterId: 'user-academy-student', departmentId: 'department-science', teamId: 'team-research',
      start: '2026-12-03T10:00:00.000Z', end: '2026-12-03T12:00:00.000Z', date: '2026-12-03', startTime: '10:00', endTime: '12:00',
      priority: 'high', status: RESERVATION_STATUS.pending, requiresApproval: true, currentApprovalStep: 0,
    }),
    createReservation({
      id: 'reservation-academy-sensors', companyId: ACADEMY, resourceId: 'resource-sensors',
      requesterId: 'user-academy-student', departmentId: 'department-science', teamId: 'team-research',
      start: '2026-12-04T09:00:00.000Z', end: '2026-12-04T15:00:00.000Z', date: '2026-12-04', startTime: '09:00', endTime: '15:00',
      quantity: 2, priority: 'normal', status: RESERVATION_STATUS.confirmed, requiresApproval: false, currentApprovalStep: null,
    }),
    createReservation({
      id: 'reservation-north-garden-teammate', companyId: NORTH, resourceId: 'resource-garden',
      requesterId: 'user-north-employee-2', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-24T13:00:00.000Z', end: '2026-11-24T14:00:00.000Z', date: '2026-11-24', startTime: '13:00', endTime: '14:00',
      purpose: 'Focus session', priority: 'normal', status: RESERVATION_STATUS.confirmed, requiresApproval: false, currentApprovalStep: null,
    }),
    createReservation({
      id: 'reservation-north-boardroom-teammate', companyId: NORTH, resourceId: 'resource-boardroom',
      requesterId: 'user-north-employee-2', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-26T10:00:00.000Z', end: '2026-11-26T11:00:00.000Z', date: '2026-11-26', startTime: '10:00', endTime: '11:00',
      purpose: 'Leadership review', priority: 'high', status: RESERVATION_STATUS.confirmed, requiresApproval: true, currentApprovalStep: 2,
      approvals: [
        { stepId: 'manager-review', actorId: 'user-north-manager', decision: 'approved', timestamp: '2026-11-23T09:00:00.000Z' },
        { stepId: 'hod-review', actorId: 'user-north-hod', decision: 'approved', timestamp: '2026-11-23T10:00:00.000Z' },
      ],
    }),
    createReservation({
      id: 'reservation-north-garden-confirmed', companyId: NORTH, resourceId: 'resource-garden',
      requesterId: 'user-north-employee', departmentId: 'department-engineering', teamId: 'team-alpha',
      start: '2026-11-27T15:00:00.000Z', end: '2026-11-27T16:00:00.000Z', date: '2026-11-27', startTime: '15:00', endTime: '16:00',
      purpose: 'Weekly wrap-up', priority: 'normal', status: RESERVATION_STATUS.confirmed, requiresApproval: false, currentApprovalStep: null,
    }),
  ];

  const history = [
    event('history-north-pending', reservations[0], 'submitted', 'Elena Rivera submitted The Nook for product planning review.', '2026-11-24T08:15:00.000Z'),
    event('history-north-confirmed', reservations[1], 'confirmed', 'The Studio was confirmed under the no-workflow policy.', '2026-11-23T13:30:00.000Z'),
    event('history-north-teammate', reservations[2], 'confirmed', 'Noah Williams confirmed The Nook for a project sync.', '2026-11-23T11:10:00.000Z'),
    event('history-north-adapters', reservations[3], 'confirmed', 'Four presentation adapters were allocated.', '2026-11-22T09:20:00.000Z'),
    event('history-academy-pending', reservations[4], 'submitted', 'Theo Brooks submitted Aurora Science Lab for review.', '2026-11-24T07:45:00.000Z'),
    event('history-academy-sensors', reservations[5], 'confirmed', 'Two environmental sensor kits were allocated.', '2026-11-21T15:05:00.000Z'),
    event('history-north-garden-teammate', reservations[6], 'confirmed', 'Noah Williams confirmed The Garden for a focus session.', '2026-11-23T14:15:00.000Z'),
    event('history-north-boardroom-teammate', reservations[7], 'confirmed', 'Noah Williams confirmed The Boardroom for a leadership review.', '2026-11-23T10:05:00.000Z'),
    event('history-north-garden-confirmed', reservations[8], 'confirmed', 'Elena Rivera confirmed The Garden for the weekly wrap-up.', '2026-11-20T16:00:00.000Z'),
  ];

  const notifications = reservations.flatMap((reservation, index) =>
    notificationPair(
      reservation,
      'seed',
      history[index].message,
      history[index].timestamp,
    ));

  return {
    companies,
    departments,
    teams,
    roles,
    users,
    memberships,
    roleAssignments,
    resources,
    reservations,
    history,
    notifications,
  };
}
