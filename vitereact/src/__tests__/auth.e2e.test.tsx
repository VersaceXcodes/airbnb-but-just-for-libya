import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import UV_Login from '@/components/views/UV_Login';
import UV_Registration from '@/components/views/UV_Registration';
import { useAppStore } from '@/store/main';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Auth E2E Flow (real API)', () => {
  const uniqueEmail = `user${Date.now()}@example.com`;
  const testPhone = `+218910${Date.now().toString().slice(-6)}`;
  const testPassword = 'testpass123';
  const testName = 'E2E Test User';

  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState((state) => ({
      authentication_state: {
        ...state.authentication_state,
        auth_token: null,
        current_user: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: false,
        },
        error_message: null,
      },
      user_role: {
        role: null,
      },
    }));
  });

  it('completes full auth flow: register -> logout -> login', async () => {
    const user = userEvent.setup();

    render(<UV_Registration />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(nameInput, testName);
    await user.type(emailInput, uniqueEmail);
    await user.type(phoneInput, testPhone);
    await user.type(passwordInput, testPassword);

    const termsCheckboxes = [
      screen.getByLabelText(/terms of service/i),
      screen.getByLabelText(/privacy policy/i),
      screen.getByLabelText(/libya-specific terms/i),
      screen.getByLabelText(/content guidelines/i),
      screen.getByLabelText(/local accommodation laws/i),
    ];

    for (const checkbox of termsCheckboxes) {
      await user.click(checkbox);
    }

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
        expect(state.authentication_state.current_user).toBeTruthy();
        expect(state.authentication_state.current_user?.email).toBe(uniqueEmail.toLowerCase().trim());
      },
      { timeout: 20000 }
    );

    const logoutUser = useAppStore.getState().logout_user;
    logoutUser();

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
      expect(state.authentication_state.auth_token).toBeNull();
      expect(state.authentication_state.current_user).toBeNull();
    });

    cleanup();
    render(<UV_Login />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    const loginEmailInput = await screen.findByLabelText(/email address/i);
    const loginPasswordInput = await screen.findByLabelText(/^password$/i);
    const loginSubmitButton = await screen.findByRole('button', { name: /sign in/i });

    await waitFor(() => {
      expect(loginEmailInput).not.toBeDisabled();
      expect(loginPasswordInput).not.toBeDisabled();
    });

    await user.type(loginEmailInput, uniqueEmail);
    await user.type(loginPasswordInput, testPassword);

    await waitFor(() => expect(loginSubmitButton).not.toBeDisabled());
    await user.click(loginSubmitButton);

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
        expect(state.authentication_state.current_user).toBeTruthy();
        expect(state.authentication_state.current_user?.email).toBe(uniqueEmail.toLowerCase().trim());
      },
      { timeout: 20000 }
    );
  }, 60000);

  it('registers a new user successfully', async () => {
    const user = userEvent.setup();
    const regEmail = `reg${Date.now()}@example.com`;
    const regPhone = `+218911${Date.now().toString().slice(-6)}`;

    render(<UV_Registration />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/full name/i), 'Registration Test');
    await user.type(screen.getByLabelText(/email address/i), regEmail);
    await user.type(screen.getByLabelText(/phone number/i), regPhone);
    await user.type(screen.getByLabelText(/^password$/i), 'regpass123');

    const termsCheckboxes = [
      screen.getByLabelText(/terms of service/i),
      screen.getByLabelText(/privacy policy/i),
      screen.getByLabelText(/libya-specific terms/i),
      screen.getByLabelText(/content guidelines/i),
      screen.getByLabelText(/local accommodation laws/i),
    ];

    for (const checkbox of termsCheckboxes) {
      await user.click(checkbox);
    }

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
      },
      { timeout: 20000 }
    );
  }, 30000);

  it('logs out successfully', async () => {
    const logoutEmail = `logout${Date.now()}@example.com`;
    const logoutPhone = `+218912${Date.now().toString().slice(-6)}`;

    const registerUser = useAppStore.getState().register_user;
    await registerUser({
      email: logoutEmail,
      phone_number: logoutPhone,
      password_hash: 'logoutpass123',
      name: 'Logout Test',
      profile_picture_url: null,
      bio: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      role: 'traveler',
    });

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
      expect(state.authentication_state.auth_token).toBeTruthy();
    });

    const logoutUser = useAppStore.getState().logout_user;
    logoutUser();

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
      expect(state.authentication_state.auth_token).toBeNull();
      expect(state.authentication_state.current_user).toBeNull();
    });
  }, 30000);

  it('logs in with valid credentials', async () => {
    const user = userEvent.setup();
    const loginEmail = `login${Date.now()}@example.com`;
    const loginPhone = `+218913${Date.now().toString().slice(-6)}`;
    const loginPassword = 'loginpass123';

    const registerUser = useAppStore.getState().register_user;
    await registerUser({
      email: loginEmail,
      phone_number: loginPhone,
      password_hash: loginPassword,
      name: 'Login Test',
      profile_picture_url: null,
      bio: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      role: 'traveler',
    });

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
    });

    const logoutUser = useAppStore.getState().logout_user;
    logoutUser();

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
    });

    render(<UV_Login />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    const emailInput = await screen.findByLabelText(/email address/i);
    const passwordInput = await screen.findByLabelText(/^password$/i);
    const submitButton = await screen.findByRole('button', { name: /sign in/i });

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });

    await user.type(emailInput, loginEmail);
    await user.type(passwordInput, loginPassword);

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.auth_token).toBeTruthy();
        expect(state.authentication_state.current_user?.email).toBe(loginEmail.toLowerCase().trim());
      },
      { timeout: 20000 }
    );
  }, 30000);

  it('handles invalid login credentials', async () => {
    const user = userEvent.setup();

    render(<UV_Login />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    const emailInput = await screen.findByLabelText(/email address/i);
    const passwordInput = await screen.findByLabelText(/^password$/i);
    const submitButton = await screen.findByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'nonexistent@example.com');
    await user.type(passwordInput, 'wrongpassword');

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      },
      { timeout: 20000 }
    );

    const state = useAppStore.getState();
    expect(state.authentication_state.authentication_status.is_authenticated).toBe(false);
    expect(state.authentication_state.auth_token).toBeNull();
  }, 30000);

  it('registers as host role', async () => {
    const user = userEvent.setup();
    const hostEmail = `host${Date.now()}@example.com`;
    const hostPhone = `+218914${Date.now().toString().slice(-6)}`;

    render(<UV_Registration />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    const hostButton = screen.getByRole('button', { name: /host guests/i });
    await user.click(hostButton);

    await user.type(screen.getByLabelText(/full name/i), 'Host Test');
    await user.type(screen.getByLabelText(/email address/i), hostEmail);
    await user.type(screen.getByLabelText(/phone number/i), hostPhone);
    await user.type(screen.getByLabelText(/^password$/i), 'hostpass123');

    const termsCheckboxes = [
      screen.getByLabelText(/terms of service/i),
      screen.getByLabelText(/privacy policy/i),
      screen.getByLabelText(/libya-specific terms/i),
      screen.getByLabelText(/content guidelines/i),
      screen.getByLabelText(/local accommodation laws/i),
    ];

    for (const checkbox of termsCheckboxes) {
      await user.click(checkbox);
    }

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(
      () => {
        const state = useAppStore.getState();
        expect(state.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(state.authentication_state.current_user?.role).toBe('host');
        expect(state.user_role.role).toBe('host');
      },
      { timeout: 20000 }
    );
  }, 30000);
});
