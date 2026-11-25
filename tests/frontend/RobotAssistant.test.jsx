import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RobotAssistant } from '../../src/components/assistant/RobotAssistant';
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

describe('RobotAssistant', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
    const employee = getDemoAccounts().find((account) => account.role === 'Employee');
    window.localStorage.setItem('smart-workspace.demo-user', employee.id);
  });

  it('opens the demo guide and returns scoped guidance without submitting a booking', async () => {
    const user = userEvent.setup();
    render(<SessionProvider><RobotAssistant /></SessionProvider>);

    await user.click(screen.getByRole('button', { name: 'Open Orbit demo guide' }));

    expect(screen.getByRole('dialog', { name: 'Orbit' })).toBeInTheDocument();
    expect(screen.getByText('Workspace guidance, not live AI')).toBeInTheDocument();
    expect(screen.getByText(/reservations require review and confirmation/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Which rooms are available?' }));

    expect(await screen.findByText(/no booking has been submitted/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message to Orbit' })).toBeDisabled();
  });
});
