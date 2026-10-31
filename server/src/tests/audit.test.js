import test from 'node:test';
import assert from 'node:assert/strict';
import { serverTiming } from '../middleware/serverTiming.js';

test('Security & Hardening - Server-Timing middleware', (t, done) => {
  const req = { method: 'GET', originalUrl: '/api/health' };
  let headerSet = null;

  const res = {
    headersSent: false,
    statusCode: 200,
    setHeader(key, value) {
      if (key === 'Server-Timing') {
        headerSet = value;
      }
    },
    on(event, callback) {
      if (event === 'finish') {
        this.finishCallback = callback;
      }
    },
  };

  serverTiming(req, res, () => {
    // Simulate request completing
    res.finishCallback();
    assert.ok(headerSet && headerSet.startsWith('total;dur='), 'Server-Timing header should be set');
    done();
  });
});
