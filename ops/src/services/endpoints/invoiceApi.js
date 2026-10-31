import { api } from '../api';

export const invoiceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({
        url: '/ops/invoices',
        params,
      }),
      providesTags: (result) =>
        result && result.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Invoice', id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),

    getInvoice: builder.query({
      query: (id) => `/ops/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    confirmInvoice: builder.mutation({
      query: (id) => ({
        url: `/ops/invoices/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
        'Dashboard',
      ],
    }),

    cancelInvoice: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/ops/invoices/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Invoice', id },
        { type: 'Invoice', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useConfirmInvoiceMutation,
  useCancelInvoiceMutation,
} = invoiceApi;
