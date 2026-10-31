import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isValidPassword } from '../../../shared/validators/password.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { generateAccessToken } from '../services/auth.service.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from '../utils/ApiError.js';

test('Password Complexity Validator', () => {
  assert.equal(isValidPassword('short'), false, 'Too short');
  assert.equal(isValidPassword('nouppercase1!'), false, 'Missing uppercase');
  assert.equal(isValidPassword('NOLOWERCASE1!'), false, 'Missing lowercase');
  assert.equal(isValidPassword('NoSpecialChar123'), false, 'Missing special char');
  assert.equal(isValidPassword('Valid@Password123'), true, 'Valid password passes');
});

test('Auth Zod Schemas Validation', async () => {
  // Invalid register: weak password & bad email
  const badRegister = await registerSchema.safeParseAsync({
    email: 'not-an-email',
    password: 'weak',
    name: '',
  });
  assert.equal(badRegister.success, false);
  assert.ok(badRegister.error.issues.some((i) => i.path.includes('email')));
  assert.ok(badRegister.error.issues.some((i) => i.path.includes('password')));

  // Valid register
  const goodRegister = await registerSchema.safeParseAsync({
    email: 'user@example.com',
    password: 'Secret#Password2026',
    name: 'Jane Doe',
    company: 'Acme Corp',
  });
  assert.equal(goodRegister.success, true);
  assert.equal(goodRegister.data.email, 'user@example.com');
});

test('JWT Access Token Generation and Verification', () => {
  const mockUser = {
    id: 42,
    email: 'admin@brightloop.test',
    role: 'admin',
    name: 'Admin User',
  };

  const token = generateAccessToken(mockUser, null);
  assert.ok(typeof token === 'string' && token.length > 20);

  const decoded = jwt.verify(token, env.jwt.accessSecret);
  assert.equal(decoded.sub, 42);
  assert.equal(decoded.email, 'admin@brightloop.test');
  assert.equal(decoded.role, 'admin');
});

test('Authorize Middleware Guard', () => {
  const adminGuard = authorize('admin');
  const staffOrAdminGuard = authorize('admin', 'staff');

  // Case 1: Unauthenticated
  let errorCaught = null;
  adminGuard({ user: null }, {}, (err) => {
    errorCaught = err;
  });
  assert.ok(errorCaught instanceof ApiError);
  assert.equal(errorCaught.status, 401);

  // Case 2: Insufficient permissions (customer trying to access admin)
  errorCaught = null;
  adminGuard({ user: { role: 'customer' } }, {}, (err) => {
    errorCaught = err;
  });
  assert.ok(errorCaught instanceof ApiError);
  assert.equal(errorCaught.status, 403);

  // Case 3: Authorized
  let nextCalled = false;
  staffOrAdminGuard({ user: { role: 'staff' } }, {}, (err) => {
    assert.equal(err, undefined);
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('Validate Middleware - throws 422 with fieldErrors', async () => {
  const schema = loginSchema;
  const middleware = validate({ body: schema });

  const mockReq = { body: { email: 'bad-email', password: '' } };
  let errorCaught = null;

  await middleware(mockReq, {}, (err) => {
    errorCaught = err;
  });

  assert.ok(errorCaught instanceof ApiError);
  assert.equal(errorCaught.status, 422);
  assert.ok(errorCaught.fieldErrors.email);
  assert.ok(errorCaught.fieldErrors.password);
});
