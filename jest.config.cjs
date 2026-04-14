module.exports = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/server.test.js'],
      transform: {
        '^.+\\.jsx?$': ['babel-jest', {
          presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
        }]
      },
    },
    {
      displayName: 'react',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/unit/**/*.test.{js,jsx}',
        '<rootDir>/tests/integration/Library.test.{js,jsx}'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|svg|png)$': 'identity-obj-proxy',
        '^@/config$': '<rootDir>/__mocks__/@/config.js',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transform: {
        '^.+\\.[jt]sx?$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            ['@babel/preset-react', { runtime: 'automatic' }]
          ]
        }]
      },
      setupFiles: ['<rootDir>/tests/setup-pre.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-after.js'],
      transformIgnorePatterns: ['node_modules/(?!(lucide-react|clsx)/)'],
    }
  ],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/']
}

// Note: transformIgnorePatterns is set per project above
