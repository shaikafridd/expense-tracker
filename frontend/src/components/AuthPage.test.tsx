import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from './AuthPage';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

describe('AuthPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in screen by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Sage Wealth')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(document.getElementById('auth-name')).not.toBeInTheDocument();
  });

  it('shows error if submitting empty inputs', async () => {
    render(<AuthPage />);
    const submitBtn = document.getElementById('auth-submit-btn')!;
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Email is required./i)).toBeInTheDocument();
  });

  it('switches to sign up tab when clicked', () => {
    render(<AuthPage />);
    const signUpTab = document.getElementById('auth-tab-signup')!;
    fireEvent.click(signUpTab);

    expect(screen.getByText('Create your free account')).toBeInTheDocument();
    expect(document.getElementById('auth-name')).toBeInTheDocument();
  });

  it('calls signUp and shows success on sign up submit', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({ data: {}, error: null });

    render(<AuthPage />);
    
    // Switch to signup tab
    const signUpTab = document.getElementById('auth-tab-signup')!;
    fireEvent.click(signUpTab);

    // Fill form
    fireEvent.change(document.getElementById('auth-name')!, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(document.getElementById('auth-email')!, { target: { value: 'ada@example.com' } });
    fireEvent.change(document.getElementById('auth-password')!, { target: { value: 'password123' } });

    // Submit
    const submitBtn = document.getElementById('auth-submit-btn')!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
        options: { data: { full_name: 'Ada Lovelace' } },
      });
    });

    expect(screen.getByText(/Account created! Check your email to confirm/i)).toBeInTheDocument();
  });

  it('calls signInWithPassword on sign in submit', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({ data: {}, error: null });

    render(<AuthPage />);
    
    // Fill form
    fireEvent.change(document.getElementById('auth-email')!, { target: { value: 'ada@example.com' } });
    fireEvent.change(document.getElementById('auth-password')!, { target: { value: 'password123' } });

    // Submit
    const submitBtn = document.getElementById('auth-submit-btn')!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
      });
    });
  });
});
