module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: ['src/domain/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
