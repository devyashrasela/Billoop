import { api } from '../api';

export const planApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: (params) => ({
        url: '/ops/plans',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Plan', id })),
              { type: 'Plan', id: 'LIST' },
            ]
          : [{ type: 'Plan', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),
    getPlan: builder.query({
      query: (id) => `/ops/plans/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Plan', id }],
    }),
    createPlan: builder.mutation({
      query: (body) => ({
        url: '/ops/plans',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }],
    }),
    updatePlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/plans/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Plan', id },
        { type: 'Plan', id: 'LIST' },
      ],
    }),
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/ops/plans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = planApi;
