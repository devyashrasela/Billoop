import { api } from '../api';

export const healthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;

