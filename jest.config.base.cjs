module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  'verbose': true,
  'forceExit': true,
  coveragePathIgnorePatterns: [
    '/build/',
    '/dist/',
    '/packages/oracle/',
    '/node_modules/',
    '_support',
    '_shared'
  ],
  coverageReporters: ['lcov', 'text'],
  globals: {
    'ts-jest': {
      'isolatedModules': false,
      'preferTsExts': true,
      'tsconfig': '<rootDir>/test/tsconfig.json'
    }
  },
  moduleNameMapper: {
    '^@sqb/(.*)$': ['<rootDir>/../$1/src'],
    '(\\..+)\\.js': '$1'
  }
};
