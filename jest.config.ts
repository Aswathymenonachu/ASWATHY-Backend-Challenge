import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
  '!src/**/*.spec.ts',
  '!src/**/*.dto.ts',
  '!src/**/*.module.ts',
  '!src/**/*.controller.ts',
  '!src/**/index.ts',
  '!src/main.ts',
  '!src/app.module.ts',
  ],
  coverageDirectory: 'coverage',
};

export default config;
