# 神谕组件单元测试指南

本目录包含神谕(Shenyu)组件的单元测试。测试使用Jest和React Testing Library框架，专门为神谕组件设计。

## 测试结构

```
src/components/Shenyu/
├── __tests__/            # 顶层测试目录
│   ├── setup.js          # 测试环境配置（模拟localStorage等）
│   └── README.md         # 本说明文件
├── core/                 # 核心服务
│   ├── __tests__/        # 核心服务测试目录
│   │   ├── JsonExtractor.test.ts   # JSON提取测试
│   │   └── PromptProcessor.test.ts # 提示词处理测试
│   ├── JsonExtractor.ts  # JSON提取服务
│   ├── PromptProcessor.ts # 提示词处理服务
│   └── ShenyuCore.ts     # 神谕核心服务
├── contexts/             # 上下文管理
│   └── PromptTemplateContext.tsx   # 提示词模板上下文
└── types.ts              # 类型定义
```

## 运行测试

已在package.json中添加以下命令。必须在May项目的chat-app目录下运行这些命令：

```bash
cd d:/May/chat-app
```

### 运行所有神谕组件测试

```bash
npm run test:shenyu
```

### 带有代码覆盖率报告的测试

```bash
npm run test:shenyu:coverage
```

覆盖率报告会生成在`d:/May/chat-app/coverage/shenyu/`目录下，可以打开`coverage/shenyu/lcov-report/index.html`查看详细报告。

### 监视模式（持续运行测试）

```bash
npm run test:shenyu:watch
```

在此模式下，Jest会监视文件变化并自动重新运行相关测试。

## 测试内容说明

### 核心服务测试

1. **JsonExtractor.test.ts**
   - 测试JSON提取和验证功能
   - 包括正常JSON、边缘情况和错误处理测试
   - 测试JSON结构分析能力

2. **PromptProcessor.test.ts**
   - 测试提示词模板处理
   - 测试占位符替换功能
   - 测试首阶段和二阶段提示词生成

## 新增测试

对于新组件，可以遵循现有测试的模式添加新的测试文件：

1. 在相应组件的目录中创建`__tests__`文件夹
2. 在该文件夹中创建`ComponentName.test.tsx`文件
3. 编写符合Jest和React Testing Library模式的测试
4. 确保测试包含正常功能和边缘情况

## 模拟和测试技巧

1. 使用`jest.fn()`和`jest.mock()`创建模拟函数和模块
2. 使用`render`、`screen`和`fireEvent`测试React组件
3. 使用`beforeEach`和`afterEach`设置和清理测试环境
4. 使用局部测试数据，避免依赖全局状态
5. 将复杂组件分解为小型、可测试的单元进行测试

## 自动化与CI集成

这些测试可以集成到CI/CD流程中，确保每次代码提交或合并请求都会运行测试。可以使用以下命令行参数控制测试行为：

```bash
# 确保在chat-app目录下运行
cd d:/May/chat-app

# 仅运行特定文件
npm run test:shenyu -- JsonExtractor

# 更新快照
npm run test:shenyu -- -u

# 生成详细测试报告
npm run test:shenyu -- --verbose
```

## 测试最佳实践

1. 测试应该专注于组件的行为，而非实现细节
2. 每个测试应该只测试一个行为或功能点
3. 测试描述应清晰说明测试的内容和预期结果
4. 优先使用用户交互测试方法，如`fireEvent`
5. 测试应该处理边缘情况和异常情况
6. 避免在测试之间产生依赖，每个测试应该独立运行
