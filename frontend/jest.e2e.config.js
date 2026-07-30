export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/e2e/setup.js'],
};
