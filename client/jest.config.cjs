/** @type {import('jest').Config} */
module.exports = {
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/ARCHIVE_2026_02/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/ARCHIVE_2026_02/'
  ]
};

