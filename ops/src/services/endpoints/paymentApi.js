import { api } from '../api';

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({
        url: '/ops/payments',
        params,
      }),
      providesTags: (result) =>
        result && result.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Payment', id })),
              { type: 'Payment', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }],
    }),

    recordPayment: builder.mutation({
      query: ({ invoiceId, ...paymentData }) => ({
        url: `/ops/invoices/${invoiceId}/payments`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { invoiceId }) => [
        { type: 'Invoice', id: invoiceId },
        { type: 'Invoice', id: 'LIST' },
        { type: 'Payment', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaymentsQuery,
  useRecordPaymentMutation,
} = paymentApi;
