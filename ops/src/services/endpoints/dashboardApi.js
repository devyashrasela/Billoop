import { api } from '../api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: () => '/ops/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
