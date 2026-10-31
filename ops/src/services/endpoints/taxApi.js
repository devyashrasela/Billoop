import { api } from '../api';

export const taxApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTaxes: builder.query({
      query: (params) => ({
        url: '/ops/taxes',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Tax', id })),
              { type: 'Tax', id: 'LIST' },
            ]
          : [{ type: 'Tax', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
    getTax: builder.query({
      query: (id) => `/ops/taxes/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Tax', id }],
    }),
    createTax: builder.mutation({
      query: (body) => ({
        url: '/ops/taxes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Tax', id: 'LIST' }],
    }),
    updateTax: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/taxes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Tax', id },
        { type: 'Tax', id: 'LIST' },
      ],
    }),
    deleteTax: builder.mutation({
      query: (id) => ({
        url: `/ops/taxes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tax', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTaxesQuery,
  useGetTaxQuery,
  useCreateTaxMutation,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
} = taxApi;
