import type { Config } from 'jest';
import { resolve } from 'path';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.test.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['./setup.ts'],
  detectOpenHandles: true,
  testPathIgnorePatterns: ['<rootDir>/test-suites/'],
  globalSetup: resolve(__dirname, './globalSetup.ts'),
  globalTeardown: resolve(__dirname, './globalTeardown.ts')
};

export default config;
