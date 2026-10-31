import { api } from '../api';

export const paymentTermApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentTerms: builder.query({
      query: (params) => ({
        url: '/ops/payment-terms',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Plan', id: `term-${id}` })),
              { type: 'Plan', id: 'TERMS_LIST' },
            ]
          : [{ type: 'Plan', id: 'TERMS_LIST' }],
      keepUnusedDataFor: 300,
    }),
    getPaymentTerm: builder.query({
      query: (id) => `/ops/payment-terms/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Plan', id: `term-${id}` }],
    }),
    createPaymentTerm: builder.mutation({
      query: (body) => ({
        url: '/ops/payment-terms',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Plan', id: 'TERMS_LIST' }],
    }),
    updatePaymentTerm: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/payment-terms/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Plan', id: `term-${id}` },
        { type: 'Plan', id: 'TERMS_LIST' },
      ],
    }),
    deletePaymentTerm: builder.mutation({
      query: (id) => ({
        url: `/ops/payment-terms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'TERMS_LIST' }],
    }),
  }),
});

export const {
  useGetPaymentTermsQuery,
  useGetPaymentTermQuery,
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation,
} = paymentTermApi;
