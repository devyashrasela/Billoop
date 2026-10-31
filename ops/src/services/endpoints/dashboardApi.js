import { api } from '../api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: () => '/ops/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
    triggerBillingSweep: builder.mutation({
      query: (body = {}) => ({
        url: '/ops/billing/run-now',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dashboard', 'Invoice', 'Subscription'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery, useTriggerBillingSweepMutation } = dashboardApi;
