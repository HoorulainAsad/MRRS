import { describe, expect, it } from 'vitest';
import { can, hasAnyRole, isPlatformAdmin } from '../../src/services/authorization.js';
import { getDemoAccounts, getDemoSession, loginDemo } from '../../src/services/sessionService.js';

const target = {
  companyId: 'company-northstar',
  departmentId: 'department-engineering',
  teamId: 'team-alpha',
  ownerId: 'user-north-employee',
};

describe('session and authorization', () => {
  it('provides safe demo accounts and complete sessions without passwords', async () => {
    const accounts = getDemoAccounts();
    const roles = accounts.map((account) => account.role);
    expect(roles).toEqual(expect.arrayContaining([
      'Platform Super Admin', 'Company Admin', 'HOD', 'Manager', 'Team Lead', 'Employee', 'Student',
    ]));
    expect(new Set(accounts.map((account) => account.companyId)).size).toBeGreaterThanOrEqual(2);
    expect(accounts[0]).toEqual(expect.objectContaining({
      id: expect.any(String), name: expect.any(String), email: expect.any(String),
      role: expect.any(String), companyName: expect.any(String), companyId: expect.any(String),
    }));
    expect(accounts[0]).not.toHaveProperty('password');

    const session = await loginDemo({ email: 'NORTH.EMPLOYEE@demo.test ', password: 'demo123' });
    expect(session).toMatchObject({
      userId: 'user-north-employee',
      companyId: 'company-northstar',
      isDemo: true,
      membership: { departmentName: 'Engineering', teamName: 'Alpha Product' },
    });
    expect(session).not.toHaveProperty('password');
    expect(session.roleAssignments[0].permissions).toEqual(['view', 'create', 'edit', 'delete']);
    expect(can(session, 'delete', target)).toBe(true);
    expect(can(session, 'delete', { ...target, ownerId: 'user-north-employee-2' })).toBe(false);
    await expect(loginDemo({ email: 'north.employee@demo.test', password: 'wrong' }))
      .rejects.toThrow('Invalid demo email or password.');
  });

  it('enforces own, team, department, and company scopes', () => {
    const employee = getDemoSession('user-north-employee');
    const otherEmployee = getDemoSession('user-north-employee-2');
    const lead = getDemoSession('user-north-lead');
    const hod = getDemoSession('user-north-hod');
    const admin = getDemoSession('user-north-admin');

    expect(can(employee, 'view', target)).toBe(true);
    expect(can(employee, 'view', { ...target, ownerId: otherEmployee.userId })).toBe(false);
    expect(can(employee, 'view', { companyId: 'company-northstar' })).toBe(false);
    expect(can(lead, 'approve', target)).toBe(true);
    expect(can(lead, 'approve', { ...target, teamId: 'team-beta' })).toBe(false);
    expect(can(hod, 'approve', target)).toBe(true);
    expect(can(hod, 'approve', { ...target, departmentId: 'department-facilities' })).toBe(false);
    expect(can(admin, 'manage_users', target)).toBe(true);
    expect(can(admin, 'view', { ...target, companyId: 'company-greenfield' })).toBe(false);
    expect(hasAnyRole(hod, ['Manager', 'HOD'])).toBe(true);
  });

  it('denies cross-tenant access and non-global platform scope', () => {
    const employee = getDemoSession('user-north-employee');
    expect(can(employee, 'view', { ...target, companyId: 'company-greenfield' })).toBe(false);

    const forged = {
      ...employee,
      roleAssignments: [{
        roleId: 'role-company-admin', roleName: 'Company Admin', scope: 'platform', scopeId: 'platform',
        permissions: ['view', 'manage_users'],
      }],
    };
    expect(can(forged, 'view', target)).toBe(false);
    expect(isPlatformAdmin(forged)).toBe(false);

    const platform = getDemoSession('user-platform');
    expect(can(platform, 'view', { ...target, companyId: 'company-greenfield' })).toBe(true);
  });
});
