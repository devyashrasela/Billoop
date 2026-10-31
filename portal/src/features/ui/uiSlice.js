import { createSlice } from '@reduxjs/toolkit';

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [], modal: null, sidebarOpen: true },
  reducers: {
    addToast: (state, { payload }) => {
      state.toasts.push({ id: ++toastId, ...payload });
    },
    removeToast: (state, { payload }) => {
      state.toasts = state.toasts.filter((t) => t.id !== payload);
    },
    openModal: (state, { payload }) => {
      state.modal = payload;
    },
    closeModal: (state) => {
      state.modal = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { addToast, removeToast, openModal, closeModal, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;

