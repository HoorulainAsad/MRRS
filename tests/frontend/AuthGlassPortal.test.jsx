import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SessionProvider } from '../../src/context/SessionProvider';
import { AuthGlassPortal } from '../../src/components/auth/AuthGlassPortal';
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

function renderPortal() {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <AuthGlassPortal />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('AuthGlassPortal', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('renders the glass sign-in card with demo account selection', () => {
    renderPortal();

    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Choose a demo account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('demo123');
    expect(screen.getByText(/Demo data only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeEnabled();
  });

  it('fills credentials when another demo account is selected', async () => {
    const user = userEvent.setup();
    const accounts = getDemoAccounts();
    renderPortal();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Choose a demo account' }), accounts[1].id);

    expect(screen.getByLabelText('Email address')).toHaveValue(accounts[1].email);
    expect(screen.getByLabelText('Password')).toHaveValue('demo123');
  });

  it('switches to the sign-up form', async () => {
    const user = userEvent.setup();
    renderPortal();

    await user.click(screen.getByRole('tab', { name: 'Sign Up' }));

    expect(await screen.findByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });
});