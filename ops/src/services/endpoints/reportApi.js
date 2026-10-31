import { api } from '../api';

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRevenueReport: builder.query({
      query: (params) => ({
        url: '/ops/reports/revenue',
        params,
      }),
    }),
    getGrowthReport: builder.query({
      query: (params) => ({
        url: '/ops/reports/growth',
        params,
      }),
    }),
    getAgingReport: builder.query({
      query: () => '/ops/reports/aging',
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRevenueReportQuery,
  useGetGrowthReportQuery,
  useGetAgingReportQuery,
} = reportApi;
