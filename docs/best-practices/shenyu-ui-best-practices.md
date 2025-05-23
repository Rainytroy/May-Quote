# 神谕组件UI最佳实践

## 概述

神谕组件是May应用中的关键功能模块，负责处理AI提示词的创建、编辑和执行。本文档总结了神谕组件UI开发过程中的最佳实践和经验，以确保UI的一致性、可用性和可维护性。

## 布局与对齐

### 最佳实践

1. **内容区域采用顶部对齐（flex-start）**
   - 使用`justifyContent: 'flex-start'`而非垂直居中布局
   - 确保在卡片渲染时保持稳定的布局，避免因内容变化导致的视觉跳动
   - 可以更好地处理溢出滚动

2. **使用Fragment(`<>...</>`)组合相关但独立的UI元素**
   - 标题和内容容器分离时使用Fragment保持逻辑关联
   - 减少不必要的嵌套div层级

3. **内容分离与层次结构**
   - 标题放在内容容器外部，增强视觉层次感
   - 每个功能块通过语义化、清晰的容器划分

## 颜色和样式

### 最佳实践

1. **使用统一的颜色变量**
   - 文本颜色与图标保持一致`var(--text-light-gray)`
   - 标题使用适当的中等灰度`#666666`增强可读性
   - 次要内容使用`var(--text-light-gray)`而非硬编码的颜色值

2. **连接线和图标颜色一致性**
   - 连接线颜色使用`var(--text-light-gray)`和图标保持一致
   - 线型和粗细选择得当（2px dashed）

3. **内容容器与背景对比**
   - 内容区背景使用`var(--main-bg)`
   - 边框圆角使用`var(--radius-md)`
   - 内边距使用`calc(var(--space-md) + 20px)`提供足够的呼吸空间

## 交互状态和反馈

### 最佳实践

1. **按钮状态**
   - 禁用状态使用`cursor: 'not-allowed'`和降低透明度`opacity: 0.5`
   - 使用`disabled`属性防止意外点击

2. **状态同步机制**
   - 使用自定义事件进行组件间通信：`window.dispatchEvent(new CustomEvent('shenyu-cards-change', { detail: { hasCards: cardsArray.length > 0 } }))`
   - 在状态更改点（加载数据、清空数据）触发事件
   - 监听方在初始化和销毁时注册/注销事件处理

3. **视觉引导**
   - 步骤指示器使用图标+文本组合增强直观性
   - 使用连接线表达流程和顺序

## 性能和可维护性

### 最佳实践

1. **依赖管理**
   - 在useEffect依赖数组中包含所有使用的状态值，例如`[cards, globalPromptBlocks, configName, inputValues]`
   - 将事件处理函数定义在useEffect内部，避免不必要的重渲染

2. **格式化和注释**
   - 使用明确的块注释区分不同功能区域
   - 每个主要功能组件都有功能描述的注释

3. **错误处理**
   - 使用try/catch处理JSON解析
   - 解析失败时提供清晰的回退行为

## 组件间通信

### 最佳实践

1. **使用自定义事件进行松耦合通信**
   - `shenyu-view-prompt` - 查看提示词请求
   - `shenyu-run` - 执行神谕请求
   - `shenyu-cards-change` - 卡片状态变更通知

2. **事件载荷标准化**
   - 使用detail传递必要数据
   - 明确的类型定义和数据结构

## 未来改进方向

1. 考虑使用Context API代替全局事件，增强类型安全
2. 组件分解为更小的单元，提高可复用性
3. 使用CSS Module或Styled Components替代内联样式，提高可维护性
