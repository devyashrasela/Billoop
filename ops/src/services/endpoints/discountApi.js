import { api } from '../api';

export const discountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDiscounts: builder.query({
      query: (params) => ({
        url: '/ops/discounts',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Discount', id })),
              { type: 'Discount', id: 'LIST' },
            ]
          : [{ type: 'Discount', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
    getDiscount: builder.query({
      query: (id) => `/ops/discounts/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Discount', id }],
    }),
    createDiscount: builder.mutation({
      query: (body) => ({
        url: '/ops/discounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Discount', id: 'LIST' }],
    }),
    updateDiscount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/discounts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Discount', id },
        { type: 'Discount', id: 'LIST' },
      ],
    }),
    deleteDiscount: builder.mutation({
      query: (id) => ({
        url: `/ops/discounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Discount', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDiscountsQuery,
  useGetDiscountQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} = discountApi;
