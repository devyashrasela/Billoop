export async function printInvoice(fetchHtml, onError) {
  const preview = window.open('about:blank', '_blank');
  if (!preview) {
    onError('Please allow pop-ups to print the invoice.');
    return;
  }
  preview.opener = null;
  preview.document.body.textContent = 'Loading invoice…';
  try {
    const { data, error } = await fetchHtml();
    if (error) throw new Error('Unable to load the invoice. Please try again.');
    if (preview.closed) return;
    preview.document.open();
    preview.document.write(data);
    preview.document.close();
    preview.focus();
    preview.print();
  } catch (error) {
    preview.close();
    onError(error.message || 'Unable to print the invoice.');
  }
}
