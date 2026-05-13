/**
 * React hooks for SIWE authentication
 */

import { useMutation } from '@tanstack/react-query';
import type { ApiResponse, AuthNonceResponse, AuthVerifyResponse } from '../types';
import type { IndexerClient } from '../network/IndexerClient';
import { useAuthStore } from '../stores/auth-store';

/**
 * Hook for getting a SIWE nonce from the server.
 */
export function useAuthNonce(client: IndexerClient) {
  return useMutation({
    mutationFn: async (): Promise<ApiResponse<AuthNonceResponse>> => {
      return await client.getNonce();
    },
  });
}

/**
 * Hook for verifying a SIWE signature and establishing a session.
 * On success, stores the JWT in the auth store.
 */
export function useAuthVerify(client: IndexerClient) {
  const { setSession } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      message,
      signature,
    }: {
      message: string;
      signature: string;
    }): Promise<ApiResponse<AuthVerifyResponse>> => {
      return await client.verifySiwe(message, signature);
    },
    onSuccess: (response) => {
      if (response.data) {
        setSession(response.data.token, response.data.address, response.data.expiresAt);
      }
    },
  });
}

/**
 * Hook to access auth state.
 * Returns current auth status and logout function.
 */
export function useAuthSession() {
  const { address, isAuthenticated, getToken, clearSession } = useAuthStore();

  return {
    address,
    isAuthenticated: isAuthenticated(),
    token: getToken(),
    logout: clearSession,
  };
}
