/**
 * Centralized API service with request interception and error handling.
 *
 * NOTE FOR FUTURE SUPABASE MIGRATION:
 * This client communicates with our backend REST endpoints.
 * In the future, database queries can either remain behind these API routes (recommended for RLS and business logic)
 * or be migrated to direct Supabase client calls by swapping this layer.
 */

import { auth } from '../config/firebase.js';

const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}, isRetry = false) {
  let token = localStorage.getItem('aicrm_token');

  // If Firebase user is active, synchronize token (Firebase automatically handles caching and refresh)
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
      localStorage.setItem('aicrm_token', token);
    } catch (tokenErr) {
      // Continue with stored token if silent refresh fails
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 401 Unauthorized occurs and Firebase user exists, force a token refresh and retry once
      if (response.status === 401 && !isRetry && auth?.currentUser) {
        console.warn(`[API Interceptor] 401 received on ${endpoint}. Refreshing Firebase token and retrying...`);
        try {
          const freshToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('aicrm_token', freshToken);
          return await apiRequest(endpoint, options, true);
        } catch (refreshErr) {
          console.error('[API Token Refresh Failed]:', refreshErr);
        }
      }

      const error = new Error(data.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Request Error] ${endpoint}:`, error);
    throw error;
  }
}
