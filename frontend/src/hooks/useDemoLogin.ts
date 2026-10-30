import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/api/config';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse, Company, User } from '@/types';

/** Signs in as the demo company's admin. The server rebuilds the demo data each time. */
export function useDemoLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<ApiResponse<{ user: User; company: Company; accessToken: string }>>(
        `${API_URL}/api/demo/login`,
        { withCredentials: true },
      );
      const { user, company, accessToken } = res.data.data;
      setAuth(user, company, accessToken);
      navigate('/dashboard');
    } catch {
      setError('The demo could not open. The server may be waking up, try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return { start, loading, error };
}
