module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  'verbose': true,
  'forceExit': true,
  coveragePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '/node_modules/',
    '_support'
  ],
  coverageReporters: ['lcov', 'text'],
  globals: {
    'ts-jest': {
      'isolatedModules': false,
      // 'preferTsExts': true,
      'tsconfig': '<rootDir>/test/tsconfig.json'
    }
  },
  moduleNameMapper: {
    '^@sqb/(.*)$': ['<rootDir>/../$1/src'],
    "(\\..+)\\.js": "$1"
  },
};
