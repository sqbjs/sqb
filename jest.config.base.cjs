module.exports = {
  testEnvironment: 'node',
  maxWorkers: '1',
  transform: {
    '^.+.ts?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/test/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@sqb/(.*)$': ['<rootDir>/../$1/src'],
    '(\\..+)\\.js': '$1',
  },
};
