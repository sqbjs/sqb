const base = require('./jest.config.base.cjs');

module.exports = {
  ...base,
  projects: [
    '<rootDir>/packages/*/jest.config.cjs'
  ],
  globalSetup: '<rootDir>/support/jest-setup.js'
};
