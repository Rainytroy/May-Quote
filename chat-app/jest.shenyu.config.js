/**
 * jest.shenyu.config.js
 * 
 * Jest配置文件，专门用于神谕组件的单元测试
 */

module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/components/Shenyu/**/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // 文件扩展名映射
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 转换器配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // 模块路径映射
  moduleNameMapper: {
    // 处理CSS模块
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 添加别名映射，如果项目使用了路径别名
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 测试覆盖率收集配置
  collectCoverageFrom: [
    'src/components/Shenyu/**/*.{js,jsx,ts,tsx}',
    '!src/components/Shenyu/**/*.d.ts',
    '!src/components/Shenyu/**/__tests__/**'
  ],
  
  // 设置覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 设置覆盖率报告目录
  coverageDirectory: '<rootDir>/coverage/shenyu',
  
  // 全局设置文件
  setupFilesAfterEnv: [
    '<rootDir>/src/components/Shenyu/__tests__/setup.js'
  ],
  
  // 测试超时设置（毫秒）
  testTimeout: 10000,
  
  // 是否显示每个测试的详细信息
  verbose: true
};
