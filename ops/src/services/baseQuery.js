import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { setCredentials, logout } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Wait if another refresh is in progress
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await baseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          api.dispatch(setCredentials(refreshResult.data));
          // Retry the original query
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      // Another refresh was in progress; wait then retry
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  // Auto-toast mutation failures (422 validation, 409 conflicts, 400/403/500 errors)
  if (result.error && result.error.status !== 401) {
    const isMutation =
      typeof args === 'object' &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(args.method?.toUpperCase());

    if (isMutation) {
      const errorData = result.error.data;
      let message = errorData?.message || errorData?.error;
      if (!message && errorData?.fieldErrors) {
        message = Object.entries(errorData.fieldErrors)
          .map(([f, msg]) => `${f}: ${msg}`)
          .join(', ');
      }
      if (!message) {
        message = `Request failed (${result.error.status})`;
      }
      api.dispatch(addToast({ type: 'error', message }));
    }
  }

  return result;
};
