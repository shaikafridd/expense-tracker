// apiClient.ts
// ─────────────────────────────────────────────────────────────────
// Custom API Client replacing Supabase.
// Handles auth state, token storage, and fetch helper methods.
// ─────────────────────────────────────────────────────────────────

export interface UserMetadata {
  full_name: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

export interface Session {
  user: User;
  access_token: string;
}

type AuthChangeListener = (event: string, session: Session | null) => void;

// @ts-ignore
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'sage_wealth_jwt';
const USER_KEY = 'sage_wealth_user';

let currentUser: User | null = null;
let currentToken: string | null = null;
const listeners = new Set<AuthChangeListener>();

// Load initial state from LocalStorage (synchronous bootstrap)
try {
  currentToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);
  if (savedUser) {
    currentUser = JSON.parse(savedUser) as User;
  }
} catch (e) {
  console.error('Failed to load auth state from local storage', e);
}

// Helper to notify listeners
function notify(event: string) {
  const session: Session | null = currentUser && currentToken ? {
    user: currentUser,
    access_token: currentToken
  } : null;
  
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Error in auth state listener', e);
    }
  });
}

// API request wrapper
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid - force logout
    auth.signOut();
    throw new Error('Not authenticated');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data as T;
}

export const auth = {
  // Check if credentials are set up
  isConfigured(): boolean {
    return true; // Node backend is always available in this migration
  },

  // Get active session
  async getSession(): Promise<{ data: { session: Session | null } }> {
    if (!currentToken || !currentUser) {
      return { data: { session: null } };
    }
    
    try {
      // Validate token with backend on startup
      const data = await apiFetch<{ user: User }>('/auth/profile');
      currentUser = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      const session: Session = { user: currentUser, access_token: currentToken };
      notify('SIGNED_IN');
      return { data: { session } };
    } catch (err) {
      // If validation fails, clear credentials
      auth.signOut();
      return { data: { session: null } };
    }
  },

  // Get current user profile
  async getUser(): Promise<{ data: { user: User | null }, error: any }> {
    if (!currentToken) {
      return { data: { user: null }, error: new Error('No session') };
    }
    if (currentUser) {
      return { data: { user: currentUser }, error: null };
    }
    try {
      const data = await apiFetch<{ user: User }>('/auth/profile');
      currentUser = data.user;
      return { data: { user: currentUser }, error: null };
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  },

  // Sign up new user
  async signUp(payload: { email: string; password: string; options: { data: { full_name: string } } }) {
    try {
      const data = await apiFetch<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          full_name: payload.options.data.full_name,
        }),
      });

      currentUser = data.user;
      currentToken = data.token;
      localStorage.setItem(TOKEN_KEY, currentToken);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      notify('SIGNED_IN');

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Sign in existing user
  async signInWithPassword(payload: { email: string; password: string }) {
    try {
      const data = await apiFetch<{ user: User; token: string }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      currentUser = data.user;
      currentToken = data.token;
      localStorage.setItem(TOKEN_KEY, currentToken);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      notify('SIGNED_IN');

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Sign out user
  signOut() {
    currentUser = null;
    currentToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notify('SIGNED_OUT');
    return { error: null };
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: AuthChangeListener) {
    listeners.add(callback);
    
    // Trigger immediate callback with current state
    const session: Session | null = currentUser && currentToken ? {
      user: currentUser,
      access_token: currentToken
    } : null;
    callback('INITIAL_STATE', session);

    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback);
          }
        }
      }
    };
  }
};
