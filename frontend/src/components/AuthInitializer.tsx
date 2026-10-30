import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { User, Company } from '@/types';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/**
 * Runs once on app boot.
 * 1. Calls POST /auth/refresh using the HttpOnly cookie.
 * 2. If successful, calls GET /auth/me with the new access token.
 * 3. Restores full auth state so a page refresh doesn't log the user out.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized } = useAuthStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        // Step 1: try to get a fresh access token from the cookie
        const refreshRes = await axios.post<{ data: { accessToken: string } }>(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newAccessToken = refreshRes.data.data.accessToken;

        // Step 2: fetch full user + company with that token
        const meRes = await axios.get<{ data: { user: User; company: Company } }>(
          `${API_URL}/api/auth/me`,
          { headers: { Authorization: `Bearer ${newAccessToken}` }, withCredentials: true },
        );
        const { user, company } = meRes.data.data;

        // Restore auth state — no logout on refresh
        setAuth(user, company, newAccessToken);
      } catch {
        // No valid session — just mark initialization done so ProtectedRoute can redirect
        setInitialized();
      }
    })();
  }, [setAuth, setInitialized]);

  return <>{children}</>;
}
