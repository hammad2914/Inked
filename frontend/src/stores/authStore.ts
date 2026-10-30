import { create } from 'zustand';
import type { User, Company } from '../types';

interface AuthState {
  user: User | null;
  company: Company | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true while we're checking the stored refresh-token on first load */
  isInitializing: boolean;
  setAuth: (user: User, company: Company, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateCompany: (updates: Partial<Company>) => void;
  setInitialized: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user, company, accessToken) =>
    set({ user, company, accessToken, isAuthenticated: true, isInitializing: false }),

  setAccessToken: (token) => set({ accessToken: token }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  updateCompany: (updates) =>
    set((state) => ({
      company: state.company ? { ...state.company, ...updates } : null,
    })),

  setInitialized: () => set({ isInitializing: false }),

  logout: () =>
    set({ user: null, company: null, accessToken: null, isAuthenticated: false, isInitializing: false }),
}));
