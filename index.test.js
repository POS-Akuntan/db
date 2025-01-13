// index.test.js
const { parseJwt } = require('./index'); // Impor fungsi jika disusun modular. Sesuaikan path.

test('parseJwt decodes valid token', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvZSIsImVtYWlsIjoiam9lQGV4YW1wbGUuY29tIiwiaXNfYWN0aXZlIjp0cnVlfQ.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const result = parseJwt(token);
  expect(result).toEqual({
    userId: '1234567890',
    name: 'Joe',
    email: 'joe@example.com',
    is_active: true,
  });
});

test('parseJwt returns null for invalid token', () => {
  const invalidToken = 'invalid.token';
  const result = parseJwt(invalidToken);
  expect(result).toBeNull();
});
