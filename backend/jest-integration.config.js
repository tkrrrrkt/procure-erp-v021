module.exports = {
  displayName: 'integration-tests',
  testMatch: [
    '**/src/integration-tests/**/*.spec.ts',
    '**/src/integration-tests/**/*.test.ts'
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/integration-tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // 統合テストは順次実行
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  preset: 'ts-jest',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverage: false,
};
