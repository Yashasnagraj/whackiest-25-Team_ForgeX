import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = 'http://localhost:8080/api/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (name: string, email: string, password: string) => Promise<{ requiresVerification?: boolean; email?: string }>;
  login: (email: string, password: string) => Promise<{ requiresVerification?: boolean; email?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          set({ isLoading: false });
          return { requiresVerification: data.requiresVerification, email: data.email };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Signup failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.status === 403 && data.requiresVerification) {
            set({ isLoading: false });
            return { requiresVerification: true, email: data.email };
          }

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return {};
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, otp }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
          }

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Verification failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      resendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to resend OTP');
          }

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include',
          });

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          // Still logout locally even if server fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/check-session`, {
            method: 'GET',
            credentials: 'include',
          });

          const data = await response.json();

          if (data.isAuthenticated) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'wanderforge-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
