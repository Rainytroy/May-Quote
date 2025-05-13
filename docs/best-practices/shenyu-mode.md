# 神谕模式集成最佳实践

本文档记录了神谕模式（Shenyu Mode）在May对话系统中的集成最佳实践，包括数据存储、状态管理和用户界面交互等方面。

## 架构设计

神谕模式是May对话系统的一个插件功能，允许用户通过`@神谕`前缀发送请求，获取结构化的JSON响应。神谕模式的核心架构包括以下组件：

### 1. 数据存储层
- 独立的`shenyu-data`数据存储，使用对话ID关联
- 使用复合键`[conversationId, id]`确保数据隔离
- 支持按对话ID查询和按时间戳排序

### 2. 状态管理层
- `ShenyuContext`提供集中式状态管理
- 与对话ID强关联，确保状态隔离
- 支持数据持久化和加载

### 3. UI交互层
- 在对话界面中直接集成神谕消息
- 提供加载状态和结果显示
- 支持结果编辑和查看

## 数据流程

神谕模式的典型数据流程如下：

1. 用户发送带有`@神谕`前缀的消息
2. 立即在UI中显示用户消息和AI加载气泡
3. 异步处理神谕请求
4. 处理完成后，更新UI显示JSON结果
5. 保存结果到数据库，与当前对话ID关联

## 最佳实践

### 状态隔离

每个对话拥有独立的神谕状态，确保不同对话之间的神谕数据不会互相干扰：

```typescript
// 设置当前对话ID
setConversationId(conversationId);

// 加载该对话关联的神谕数据
loadConversationShenyuData(conversationId);
```

### 数据持久化

神谕结果需要与所在对话强关联，确保数据的持久性和可恢复性：

```typescript
// 保存神谕结果到数据库
await saveShenyuResult(input, result, adjustment);
```

### 即时反馈

提供即时的用户界面反馈，确保良好的用户体验：

1. 用户输入后立即显示消息
2. 显示处理中状态
3. 结果生成后立即更新UI

### 错误处理

妥善处理可能的错误情况，确保应用程序稳定性：

1. 捕获并记录API错误
2. 提供用户友好的错误提示
3. 确保序列化安全，避免因JSON处理错误导致应用崩溃

## 与May对话系统集成

神谕模式作为插件功能与May对话系统无缝集成：

1. 在ChatInterface中拦截特定前缀的消息
2. 使用ShenyuContext管理状态
3. 通过专用UI组件显示神谕结果
4. 将神谕消息与普通消息一样保存在对话历史中

## 错误处理与状态管理

神谕模式涉及复杂的状态管理和数据库操作，需要特别注意以下几点：

### 数据库操作健壮性

数据库操作需要充分的错误处理和重试机制，确保在网络波动或其他问题时能够恢复：

```typescript
// 改进的数据库操作示例
openDatabase(retryCount = 2): Promise<IDBDatabase> {
  // 处理错误超过阈值的情况
  if (dbErrorCount >= MAX_DB_ERRORS) {
    setTimeout(() => {
      dbErrorCount = 0;
      // 重试
    }, 2000);
    return;
  }

  // 实现重试逻辑
  if (retryCount > 0) {
    // 短暂延迟后重试
    setTimeout(() => {
      openDatabase(retryCount - 1)
    }, 500);
  }
}
```

### 状态隔离与重置

在对话切换和新建时，必须确保神谕状态被完全重置：

```typescript
// 当对话ID变化时
useEffect(() => {
  // 先完全重置神谕状态
  resetShenyuState();
  
  // 然后设置新的对话ID并加载数据
  if (conversationId) {
    setConversationId(conversationId);
    loadConversationShenyuData(conversationId);
  }
}, [conversationId]);
```

### 防止UI状态缓存

创建新对话时，清除会话存储防止状态混淆：

```typescript
// 在创建新对话时清除UI状态缓存
sessionStorage.removeItem('shenyu-state');
```

### 错误降级处理

当数据加载或处理失败时，提供合理的降级方案：

1. 数据库操作失败时，提供更详细的错误信息
2. 在页面刷新后，能够从持久化存储恢复状态
3. 使用try-catch包装所有异步操作，确保应用稳定性

## 未来改进方向

1. 支持神谕模板管理
2. 增强结果编辑功能
3. 支持复杂查询和过滤
4. 提供结果导出功能
5. 实现更完善的缓存策略，提高性能
6. 增强错误恢复机制
