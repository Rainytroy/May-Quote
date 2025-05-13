# 神谕提示词块运行最佳实践

## 概述

本文档记录了神谕(Shenyu)组件运行提示词块的最佳实践，包括执行流程、格式处理和错误处理等方面的考虑。

## 执行流程

### 提示词块运行顺序

提示词块应当严格按照定义的顺序依次执行，每个块的执行结果会影响后续块的上下文。执行流程如下：

1. 初始化一个系统消息，定义神谕助手的角色
2. 添加用户初始请求消息
3. **依次**执行每个提示词块:
   - 替换提示词中的占位符
   - 创建一个隐藏的用户消息
   - 调用API获取回复
   - 更新消息历史记录
   - 展示AI响应
   - 在继续下一个块之前添加短暂延迟，提高用户体验

### 消息历史管理

在执行提示词块时，应当维护一个完整的消息历史记录，包括：

```typescript
const messageHistory = [
  { role: 'system', content: `你是神谕(Shenyu)助手，正在协助运行Agent: ${agentName}` },
  { role: 'user', content: `运行：${agentName}` },
  // 随后会添加每个提示词块及其响应
  { role: 'user', content: processedText }, // 处理后的提示词
  { role: 'assistant', content: aiResponse }, // AI响应
  // ... 依此类推
];
```

## 显示与格式

### 正确的消息格式

当使用`updateAiMessage`方法更新消息时，参数顺序和用途非常重要：

```typescript
chatInterfaceRef.current.updateAiMessage(
  aiMessageId,       // 消息ID
  aiResponse,        // 显示内容 - 将以markdown渲染
  aiResponse,        // 原始响应内容
  "May the 神谕 be with you" // 自定义发送者名称
);
```

注意：**不要**将内容处理为JSON格式，应保留原始文本格式，以便ShenyuMessageItem组件能够正确渲染markdown。

### 日志记录

在关键步骤添加详细日志，便于调试和监控：

- 替换占位符前后
- API请求发送前
- 响应接收后
- 块执行开始和结束时
- 发生错误时

## 错误处理

每个提示词块的执行都应当单独进行错误处理，一个块的失败不应影响其他块的执行。

```typescript
try {
  // 执行提示词块
} catch (error) {
  console.error(`[PromptRunner] 运行提示词块 ${i+1}/${promptBlocks.length} 时出错:`, error);
  
  // 更新UI显示错误信息
  chatInterfaceRef.current?.updateAiMessage(
    aiMessageId,
    `运行错误: ${error instanceof Error ? error.message : '未知错误'}`,
    `运行错误: ${error instanceof Error ? error.message : '未知错误'}`,
    "May the 神谕 be with you"
  );
}
```

## 性能考虑

1. 对于大量提示词块，考虑添加延迟机制避免API请求过于频繁
2. 长时间运行时，考虑分批处理或添加进度指示器
3. 避免在UI线程中进行耗时计算，特别是提示词替换逻辑

## 常见问题与解决方案

### 1. 只执行第一个提示词块

**问题**：循环提前退出，只执行了第一个提示词块。  
**解决方案**：确保循环逻辑正确，在每个块处理完成后添加明确的日志，标记块已完成并继续下一个。

### 2. 响应显示为JSON而非渲染markdown

**问题**：AI响应以代码块方式显示，而非渲染markdown。  
**解决方案**：正确调用updateAiMessage方法，直接传递文本内容而非JSON：

```typescript
// 错误用法
chatInterfaceRef.current.updateAiMessage(aiMessageId, JSON.stringify(aiResponse));

// 正确用法
chatInterfaceRef.current.updateAiMessage(aiMessageId, aiResponse);
```

### 3. 提示词占位符替换不完全

**问题**：某些占位符未被正确替换。  
**解决方案**：使用详细日志记录替换过程，确保所有占位符模式都被正确定义和处理。
