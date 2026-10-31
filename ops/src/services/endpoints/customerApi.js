import { api } from '../api';

export const customerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({
        url: '/ops/customers',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Customer', id })),
              { type: 'Customer', id: 'LIST' },
            ]
          : [{ type: 'Customer', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
    getCustomer: builder.query({
      query: (id) => `/ops/customers/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation({
      query: (body) => ({
        url: '/ops/customers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/customers/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} = customerApi;

