# 神谕界面组件化最佳实践

## 组件拆分原则

1. **按职责拆分**
   - 将不同功能区域拆分为独立组件
   - 确保每个组件只负责单一功能

2. **状态管理**
   - 核心状态保留在父组件
   - 子组件通过props接收数据和回调函数
   - 使用自定义hooks封装复杂逻辑

3. **组件间通信**
   - 通过props传递数据和回调
   - 使用Context API共享全局状态
   - 使用useRef和useImperativeHandle暴露方法

## 已实现组件

### 主界面组件
- **AgentConfigPanel**: 整体面板，管理状态和布局
  - 左侧聊天区域
  - 右侧卡片预览/调试区域
  - 管理全局状态和逻辑

### 子组件
- **CardPreviewPanel**: 卡片预览面板
  - 显示生成的Agent卡片
  - 提供Agent名称编辑功能
  - 提供运行按钮

- **InteractionHistoryPanel**: 交互历史面板
  - 显示提示词和响应历史
  - 用于调试和跟踪

- **ShenyuChatInterface**: 神谕聊天界面
  - 集成聊天输入和消息显示
  - 提供消息处理接口
  - 支持自定义发送者名称

### 功能钩子
- **usePromptRunner**: 提示词运行器
  - 替换占位符逻辑
  - 执行提示词块
  - 发送API请求

## API通信
- **mayApi**: API服务封装
  - executeShenyuRequest: 执行神谕请求生成Agent
  - sendChatMessage: 发送普通聊天消息

## 代码组织
- src/components/SN43Demo/
  - AgentConfigPanel/ (主组件)
    - index.tsx
    - components/ (子组件)
    - hooks/ (自定义钩子)
  - Chat/ (聊天相关组件)
  - api/ (API通信)

## 未来扩展方向
1. 提取更多可复用组件
2. 实现更细粒度的状态管理
3. 增强错误处理和用户反馈
