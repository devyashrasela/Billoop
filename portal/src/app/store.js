import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: authReducer, ui: uiReducer },
  middleware: (gdm) => gdm().concat(api.middleware),
  devTools: import.meta.env.DEV,
});

