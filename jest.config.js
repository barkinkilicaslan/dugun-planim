module.exports = {
  preset: 'jest-expo',
  cacheDirectory: '<rootDir>/.jest-cache',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: ['src/domain/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/abyss-', '<rootDir>/dist/', '<rootDir>/legal-site/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
