import { api } from '../api';

export const portalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Profile ──
    getProfile: builder.query({
      query: () => '/portal/me',
      providesTags: ['Customer'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/portal/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),

    // ── Subscriptions ──
    getPortalSubscriptions: builder.query({
      query: (params) => ({
        url: '/portal/subscriptions',
        params,
      }),
      providesTags: (result) =>
        result && result.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Subscription', id })),
              { type: 'Subscription', id: 'PORTAL_LIST' },
            ]
          : [{ type: 'Subscription', id: 'PORTAL_LIST' }],
    }),

    getPortalSubscription: builder.query({
      query: (id) => `/portal/subscriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    pausePortalSubscription: builder.mutation({
      query: (id) => ({
        url: `/portal/subscriptions/${id}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'PORTAL_LIST' },
      ],
    }),

    resumePortalSubscription: builder.mutation({
      query: (id) => ({
        url: `/portal/subscriptions/${id}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'PORTAL_LIST' },
      ],
    }),

    renewPortalSubscription: builder.mutation({
      query: (id) => ({
        url: `/portal/subscriptions/${id}/renew`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'PORTAL_LIST' },
      ],
    }),

    closePortalSubscription: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/portal/subscriptions/${id}/close`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'PORTAL_LIST' },
      ],
    }),

    // ── Invoices ──
    getPortalInvoices: builder.query({
      query: (params) => ({
        url: '/portal/invoices',
        params,
      }),
      providesTags: (result) =>
        result && result.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Invoice', id })),
              { type: 'Invoice', id: 'PORTAL_LIST' },
            ]
          : [{ type: 'Invoice', id: 'PORTAL_LIST' }],
    }),

    getPortalInvoice: builder.query({
      query: (id) => `/portal/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    // ── Plans ──
    getPortalPlans: builder.query({
      query: () => '/portal/plans',
      providesTags: ['Plan'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPortalSubscriptionsQuery,
  useGetPortalSubscriptionQuery,
  usePausePortalSubscriptionMutation,
  useResumePortalSubscriptionMutation,
  useRenewPortalSubscriptionMutation,
  useClosePortalSubscriptionMutation,
  useGetPortalInvoicesQuery,
  useGetPortalInvoiceQuery,
  useGetPortalPlansQuery,
} = portalApi;
