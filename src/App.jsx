import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { CheckInPage } from './pages/CheckInPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FoundationPage } from './pages/FoundationPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { NotFoundPage, UnauthorizedPage } from './pages/StatusPages';
import {
  ProtectedRoute,
  PublicOnlyRoute,
  RouteGuard,
} from './routes/RouteGuards';
import { APP_ROUTES } from './routes/registry';

const PAGE_COMPONENTS = {
  '/app/dashboard': DashboardPage,
  '/app/resources': ResourcesPage,
  '/app/availability': AvailabilityPage,
  '/app/reservations': ReservationsPage,
  '/app/check-in': CheckInPage,
  '/app/approvals': ApprovalsPage,
  '/app/notifications': NotificationsPage,
  '/app/reports': ReportsPage,
  '/app/profile': ProfilePage,
  '/app/organizations': OrganizationsPage,
  '/app/users': UsersPage,
  '/app/roles': RolesPage,
  '/app/workflows': WorkflowsPage,
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
      <Route path="/register-organization" element={<FoundationPage publicMode />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          {APP_ROUTES.map((route) => {
            const Component = PAGE_COMPONENTS[route.path] || FoundationPage;
            return (
              <Route
                key={route.path}
                path={route.path.replace('/app/', '')}
                element={(
                  <RouteGuard route={route}>
                    <Component route={route} />
                  </RouteGuard>
                )}
              />
            );
          })}
        </Route>
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
