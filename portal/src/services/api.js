import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subscription','Invoice','Payment','Product','Plan','Tax','Discount','Template','Customer','Staff','Dashboard'],
  endpoints: () => ({}),
});

