import { api } from '../api';

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/ops/products',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Product', id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
    getProduct: builder.query({
      query: (id) => `/ops/products/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/ops/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/ops/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    addVariant: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/ops/products/${productId}/variants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    deleteVariant: builder.mutation({
      query: ({ productId, variantId }) => ({
        url: `/ops/products/${productId}/variants/${variantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddVariantMutation,
  useDeleteVariantMutation,
} = productApi;
