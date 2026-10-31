import { useStore } from 'react-redux';
import { printInvoice } from './printInvoice.js';

export function useInvoicePrint(baseQuery, addToast, scope) {
  const store = useStore();
  return (id) => printInvoice(
    () => baseQuery(
      { url: `/${scope}/invoices/${id}/print`, responseHandler: 'text' },
      { dispatch: store.dispatch, getState: store.getState, type: 'query' },
      {},
    ),
    (message) => store.dispatch(addToast({ type: 'error', message })),
  );
}
