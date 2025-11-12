import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/entities/*.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
};

export default config;
