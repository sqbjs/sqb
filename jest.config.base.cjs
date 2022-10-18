module.exports = {
  testEnvironment: 'node',
  verbose: true,
  maxWorkers: '50%',
  coveragePathIgnorePatterns: [
    '/build/',
    '/dist/',
    '/packages/oracle/',
    '/node_modules/',
    '_support',
    '_shared'
  ],
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: "<rootDir>/coverage/",
  transform: {
    '^.+.ts?$': ['ts-jest', {
      tsconfig: '<rootDir>/test/tsconfig.json',
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    '^@sqb/(.*)$': ['<rootDir>/../$1/src'],
    '(\\..+)\\.js': '$1'
  }
};
