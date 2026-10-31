import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, role: null, accessToken: null, bootstrapping: true },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.role = payload.role;
      state.accessToken = payload.accessToken;
      state.bootstrapping = false;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.bootstrapping = false;
    },
    setBootstrapped: (state) => {
      state.bootstrapping = false;
    },
  },
});

export const { setCredentials, logout, setBootstrapped } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectIsAdmin = (state) => state.auth.role === 'admin';

export default authSlice.reducer;

