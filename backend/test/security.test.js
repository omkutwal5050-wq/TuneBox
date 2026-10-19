const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-that-is-longer-than-32-characters';
const { getSecret } = require('../middleware/auth');
const { validateCredentials } = require('../middleware/validate');

test('JWT secret can sign and verify user claims', () => {
  const token = jwt.sign({ userId: 'user-1', role: 'user' }, getSecret(), { expiresIn: '1m' });
  assert.equal(jwt.verify(token, getSecret()).userId, 'user-1');
});

test('credential validation rejects short passwords', () => {
  const request = { path: '/register', body: { username: 'Test', email: 'test@example.com', password: 'short' } };
  let statusCode;
  let payload;
  const response = {
    status(code) {
      statusCode = code;
      return { json(value) { payload = value; } };
    }
  };
  validateCredentials(request, response, () => {
    throw new Error('validation should stop the request');
  });
  assert.equal(statusCode, 400);
  assert.match(payload.error, /8 characters/);
});

test('credential validation accepts valid registration data', () => {
  const request = { path: '/register', body: { username: 'Test', email: 'test@example.com', password: 'correct-password' } };
  let called = false;
  validateCredentials(request, {}, () => { called = true; });
  assert.equal(called, true);
});

test('credential validation keeps legacy short-password login compatible', () => {
  const request = { path: '/login', body: { email: 'legacy@example.com', password: 'old' } };
  let called = false;
  validateCredentials(request, {}, () => { called = true; });
  assert.equal(called, true);
});
