import { api } from '../api';

export const templateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query({
      query: (params) => ({
        url: '/ops/templates',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Template', id })),
              { type: 'Template', id: 'LIST' },
            ]
          : [{ type: 'Template', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
    getTemplate: builder.query({
      query: (id) => `/ops/templates/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Template', id }],
    }),
    createTemplate: builder.mutation({
      query: (body) => ({
        url: '/ops/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),
    updateTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/templates/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Template', id },
        { type: 'Template', id: 'LIST' },
      ],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/ops/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = templateApi;
