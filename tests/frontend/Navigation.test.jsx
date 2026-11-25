import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { SessionProvider } from '../../src/context/SessionProvider';
import { getDemoAccounts } from '../../src/services/sessionService';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('role-scoped navigation', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
    const employee = getDemoAccounts().find((account) => account.role === 'Employee');
    window.localStorage.setItem('smart-workspace.demo-user', employee.id);
  });

  it('adds administrative navigation after switching to an authorized demo role', async () => {
    const user = userEvent.setup();
    const employee = getDemoAccounts().find((account) => account.role === 'Employee');
    const admin = getDemoAccounts().find((account) => account.role === 'Company Admin');
    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <SessionProvider><App /></SessionProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Approvals' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Open profile menu for ${employee.name}` }));
    await user.click(screen.getByRole('button', { name: new RegExp(admin.name) }));

    expect(await screen.findByRole('link', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Organizations' })).not.toBeInTheDocument();
  });
});
