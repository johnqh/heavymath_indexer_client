/**
 * Zustand store for SIWE JWT authentication state.
 * Persists token to localStorage for session continuity.
 */

import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  address: string | null;
  expiresAt: number | null;

  setSession: (token: string, address: string, expiresAt: string) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  getToken: () => string | null;
}

interface PersistedAuthState {
  token: string | null;
  address: string | null;
  expiresAt: number | null;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getAuthStorage(): PersistStorage<PersistedAuthState> {
  const storage =
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem === 'function' &&
    typeof globalThis.localStorage.setItem === 'function' &&
    typeof globalThis.localStorage.removeItem === 'function'
      ? globalThis.localStorage
      : noopStorage;

  return {
    getItem: (name: string): StorageValue<PersistedAuthState> | null => {
      const value = storage.getItem(name);
      return value ? (JSON.parse(value) as StorageValue<PersistedAuthState>) : null;
    },
    setItem: (name: string, value: StorageValue<PersistedAuthState>): void => {
      storage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string): void => {
      storage.removeItem(name);
    },
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      address: null,
      expiresAt: null,

      setSession: (token: string, address: string, expiresAt: string) => {
        set({
          token,
          address: address.toLowerCase(),
          expiresAt: new Date(expiresAt).getTime(),
        });
      },

      clearSession: () => {
        set({ token: null, address: null, expiresAt: null });
      },

      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return Date.now() < expiresAt;
      },

      getToken: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return null;
        if (Date.now() >= expiresAt) {
          set({ token: null, address: null, expiresAt: null });
          return null;
        }
        return token;
      },
    }),
    {
      name: 'heavymath-auth',
      storage: getAuthStorage(),
      partialize: (state) => ({
        token: state.token,
        address: state.address,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
