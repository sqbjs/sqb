const base = require('./jest.config.base.cjs');

module.exports = {
  ...base,
  // verbose: true,
  projects: ['<rootDir>/packages/*/jest.config.cjs'],
  globalSetup: '<rootDir>/support/jest-setup.cjs',
  coveragePathIgnorePatterns: [
    '/build/',
    '/dist/',
    '/packages/oracle/',
    '/node_modules/',
    '_support',
    '_shared',
  ],
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: '<rootDir>/coverage/',
};
