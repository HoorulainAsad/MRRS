import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  GitBranch,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { can } from '../services/authorization';

export const ROLES = {
  PLATFORM_ADMIN: 'Platform Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  HOD: 'HOD',
  MANAGER: 'Manager',
  TEAM_LEAD: 'Team Lead',
  EMPLOYEE: 'Employee',
  STUDENT: 'Student',
};

const ALL_ROLES = Object.values(ROLES);
const APPROVER_ROLES = [
  ROLES.PLATFORM_ADMIN,
  ROLES.COMPANY_ADMIN,
  ROLES.HOD,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
];
const ADMIN_ROLES = [ROLES.PLATFORM_ADMIN, ROLES.COMPANY_ADMIN];

function sessionTarget(session) {
  return {
    companyId: session.companyId,
    departmentId: session.membership?.departmentId,
    teamId: session.membership?.teamId,
    ownerId: session.userId,
  };
}

export const APP_ROUTES = [
  {
    path: '/app/dashboard',
    label: 'Dashboard',
    description: 'Your workspace at a glance',
    icon: LayoutDashboard,
    section: 'Overview',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/resources',
    label: 'Resources',
    description: 'Rooms, desks, and shared equipment',
    icon: Building2,
    section: 'Workspace',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/availability',
    label: 'Availability',
    description: 'Explore resource schedules and capacity',
    icon: CalendarDays,
    section: 'Workspace',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/reservations',
    label: 'Reservations',
    description: 'Reservation requests and confirmations',
    icon: CalendarCheck2,
    section: 'Workspace',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/check-in',
    label: 'Check-in',
    description: 'Arrival and resource check-in status',
    icon: MapPin,
    section: 'Workspace',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/approvals',
    label: 'Approvals',
    description: 'Requests awaiting an authorized review',
    icon: ClipboardCheck,
    section: 'Workspace',
    roles: APPROVER_ROLES,
    action: 'approve',
  },
  {
    path: '/app/notifications',
    label: 'Notifications',
    description: 'Workspace updates and reservation notices',
    icon: Bell,
    section: 'Overview',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/reports',
    label: 'Reports',
    description: 'Utilization and workspace insights',
    icon: BarChart3,
    section: 'Insights',
    roles: APPROVER_ROLES,
    action: 'view',
  },
  {
    path: '/app/profile',
    label: 'Profile',
    description: 'Your account and workspace membership',
    icon: UserRound,
    section: 'Account',
    roles: ALL_ROLES,
    action: 'view',
  },
  {
    path: '/app/organizations',
    label: 'Organizations',
    description: 'Platform organization administration',
    icon: Building2,
    section: 'Administration',
    roles: [ROLES.PLATFORM_ADMIN],
    action: 'view',
    target: () => ({}),
  },
  {
    path: '/app/users',
    label: 'Users',
    description: 'People, teams, and workspace access',
    icon: UsersRound,
    section: 'Administration',
    roles: [ROLES.PLATFORM_ADMIN, ROLES.COMPANY_ADMIN, ROLES.HOD, ROLES.MANAGER],
    action: 'manage_users',
  },
  {
    path: '/app/roles',
    label: 'Roles & access',
    description: 'Role assignments and permission scopes',
    icon: ShieldCheck,
    section: 'Administration',
    roles: ADMIN_ROLES,
    action: 'manage_users',
  },
  {
    path: '/app/workflows',
    label: 'Workflows',
    description: 'Reservation review and approval policies',
    icon: GitBranch,
    section: 'Administration',
    roles: [ROLES.PLATFORM_ADMIN, ROLES.COMPANY_ADMIN],
    action: 'approve',
  },
];

export const NAV_SECTIONS = ['Overview', 'Workspace', 'Insights', 'Administration', 'Account'];

export function getPrimaryRole(session) {
  return session?.roleAssignments?.[0]?.roleName || 'Workspace member';
}

export function getRouteByPath(path) {
  return APP_ROUTES.find((route) => route.path === path);
}

export function canAccessRoute(session, route) {
  if (!session || !route) return false;
  const roleAllowed = session.roleAssignments?.some(({ roleName }) => route.roles.includes(roleName));
  if (!roleAllowed) return false;
  return can(session, route.action, route.target ? route.target(session) : sessionTarget(session));
}

export function getAccessibleRoutes(session) {
  return APP_ROUTES.filter((route) => canAccessRoute(session, route));
}

export const DEFAULT_AUTHENTICATED_PATH = APP_ROUTES[0].path;
