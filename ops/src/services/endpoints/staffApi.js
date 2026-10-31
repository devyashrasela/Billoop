import { api } from '../api';

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStaffList: builder.query({
      query: (params) => ({
        url: '/ops/staff',
        params,
      }),
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation({
      query: (body) => ({
        url: '/ops/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/ops/staff/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    deactivateStaff: builder.mutation({
      query: (id) => ({
        url: `/ops/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStaffListQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeactivateStaffMutation,
} = staffApi;
