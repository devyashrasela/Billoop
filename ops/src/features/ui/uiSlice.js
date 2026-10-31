import { createSlice } from '@reduxjs/toolkit';

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    modal: null,
    sidebarOpen: false,
    expandedGroups: {},
  },
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
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleGroup: (state, { payload }) => {
      state.expandedGroups[payload] = !state.expandedGroups[payload];
    },
    setGroupExpanded: (state, { payload }) => {
      const { key, expanded } = typeof payload === 'string' ? { key: payload, expanded: true } : payload;
      state.expandedGroups[key] = Boolean(expanded);
    },
    setExpandedOnlyGroup: (state, { payload }) => {
      state.expandedGroups = { [payload]: true };
    },
  },
});

export const {
  addToast,
  removeToast,
  openModal,
  closeModal,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  toggleGroup,
  setGroupExpanded,
  setExpandedOnlyGroup,
} = uiSlice.actions;

export const selectExpandedGroups = (state) => state.ui.expandedGroups || {};
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

export default uiSlice.reducer;
