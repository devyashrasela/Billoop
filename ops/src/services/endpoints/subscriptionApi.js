import { api } from '../api';

export const subscriptionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query({
      query: (params) => ({
        url: '/ops/subscriptions',
        params,
      }),
      providesTags: (result) =>
        result && result.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Subscription', id })),
              { type: 'Subscription', id: 'LIST' },
            ]
          : [{ type: 'Subscription', id: 'LIST' }],
    }),

    getSubscription: builder.query({
      query: (id) => `/ops/subscriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    createSubscription: builder.mutation({
      query: (body) => ({
        url: '/ops/subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Subscription', id: 'LIST' }, 'Dashboard'],
    }),

    createFromTemplate: builder.mutation({
      query: ({ templateId, customerId, startDate }) => ({
        url: `/ops/subscriptions/from-template/${templateId}`,
        method: 'POST',
        body: { customerId, startDate },
      }),
      invalidatesTags: [{ type: 'Subscription', id: 'LIST' }, 'Dashboard'],
    }),

    transitionSubscription: builder.mutation({
      query: ({ id, to, closeReason }) => ({
        url: `/ops/subscriptions/${id}/transition`,
        method: 'POST',
        body: { to, closeReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
        'Dashboard',
      ],
    }),

    pauseSubscription: builder.mutation({
      query: (id) => ({
        url: `/ops/subscriptions/${id}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
        'Dashboard',
      ],
    }),

    resumeSubscription: builder.mutation({
      query: (id) => ({
        url: `/ops/subscriptions/${id}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
        'Dashboard',
      ],
    }),

    renewSubscription: builder.mutation({
      query: (id) => ({
        url: `/ops/subscriptions/${id}/renew`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
        'Dashboard',
      ],
    }),

    closeSubscription: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/ops/subscriptions/${id}/close`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subscription', id },
        { type: 'Subscription', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionMutation,
  useCreateFromTemplateMutation,
  useTransitionSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useRenewSubscriptionMutation,
  useCloseSubscriptionMutation,
} = subscriptionApi;
