# 神谕聊天界面最佳实践

## 组件间通信与事件处理

### 问题
在多组件嵌套的聊天界面中，事件传递链路可能变得复杂，导致回调函数无法正确执行。特别是在以下场景：
- ShenyuInputArea组件提交消息
- ShenyuChatInterface组件处理消息并生成ID
- AgentConfigPanel需要获取消息ID并调用API

### 解决方案 - 全局函数注册
使用全局函数注册是一种简单有效的方法，可以绕过复杂的组件通信链路：

```typescript
// 在AgentConfigPanel组件中注册全局函数
useEffect(() => {
  console.log('[AgentConfigPanel] 设置全局生成函数');
  
  // 在全局对象上设置generateAgent函数引用
  (window as any).shenyuGenerateAgent = (content: string) => {
    console.log('[全局函数] 直接调用generateAgent:', content);
    return generateAgent(content);
  };
  
  // 组件卸载时清理全局函数
  return () => {
    delete (window as any).shenyuGenerateAgent;
    console.log('[AgentConfigPanel] 全局生成函数已移除');
  };
}, [generateAgent]); // 依赖于generateAgent确保它已定义
```

### 输入组件中直接调用全局函数
在输入组件中检测并使用全局函数：

```typescript
// 在ShenyuInputArea组件的handleSubmit方法中
const handleSubmit = () => {
  const trimmedMessage = message.trim();
  if (trimmedMessage && !disabled) {
    // 尝试通过直接方式调用生成函数
    try {
      const agentGenerateFn = (window as any).shenyuGenerateAgent;
      
      if (typeof agentGenerateFn === 'function') {
        // 直接调用模式 - 绕过事件链路
        console.log('[ShenyuInputArea] 检测到全局生成函数，使用直接模式');
        agentGenerateFn(trimmedMessage);
        setMessage('');
        return;
      }
      
      // 如果没有找到全局函数，回退到默认模式
      console.log('[ShenyuInputArea] 未找到全局生成函数，使用标准提交模式');
      // 标准onSubmit逻辑...
    } catch (error) {
      console.error('[ShenyuInputArea] 提交处理错误:', error);
    }
  }
};
```

### 调试技巧 - 模拟阶段调用
在开发过程中，可以添加调试按钮来直接调用不同阶段的生成函数：

```typescript
// 第一阶段生成（初次创建）
const simulateFirstStage = () => {
  setHasGenerated(false);
  generateAgent("我要造飞机"); // 示例输入
};

// 第二阶段生成（修改已有内容）
const simulateSecondStage = () => {
  // 确保状态为第二阶段
  if (!firstStagePrompt) {
    setFirstStagePrompt(activeTemplates.firstStage.replace('{#input}', '我要造飞机'));
  }
  if (!latestJsonOutput && !jsonOutput) {
    setJsonOutput('{"adminInputs": {}, "promptBlocks": {}}');
  }
  setHasGenerated(true);
  generateAgent("我要大一点的飞机"); // 示例修改输入
};
```

## 最佳实践总结

1. **直接连接优于复杂事件链** - 在多组件嵌套的情况下，考虑使用全局函数或Context API来直接连接关键功能点，避免通过多层组件传递事件。

2. **优先使用已验证的工作流程** - 如果发现某种模式（如直接调用）更可靠，应考虑将其作为主要实现方式。

3. **保留回退机制** - 即使采用直接调用，也应保留原有的事件传递机制作为回退，确保兼容性。

4. **日志追踪关键节点** - 在复杂的交互流程中添加详细的日志，特别是在调用链的关键环节，方便问题定位。

5. **组件卸载时清理** - 如使用全局注册等方法，确保在组件卸载时正确清理，避免内存泄漏或不必要的函数调用。
