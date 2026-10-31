import test from 'node:test';
import assert from 'node:assert/strict';
import { printInvoice } from './printInvoice.js';

test('print waits for the authenticated response and handles failures and blocked popups', async () => {
  const originalWindow = globalThis.window;
  const events = [];
  const preview = {
    document: {
      body: {},
      open() {},
      write(html) { events.push(html); },
      close() {},
    },
    focus() {},
    print() { events.push('print'); },
    close() { events.push('close'); },
  };
  try {
    globalThis.window = { open: () => preview };
    await printInvoice(async () => {
      assert.deepEqual(events, []);
      return { data: '<html>Invoice 6</html>' };
    }, assert.fail);
    assert.deepEqual(events, ['<html>Invoice 6</html>', 'print']);
    assert.equal(preview.opener, null);

    events.length = 0;
    await printInvoice(async () => ({ error: { status: 401 } }), (message) => events.push(message));
    assert.equal(events[0], 'close');
    assert.match(events[1], /Unable to load/);
    assert.ok(!events.includes('print'));

    globalThis.window.open = () => null;
    await printInvoice(assert.fail, (message) => assert.match(message, /allow pop-ups/));
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
