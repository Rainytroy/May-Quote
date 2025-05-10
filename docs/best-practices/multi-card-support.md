# 多卡片结构支持最佳实践

## 概述

本文档记录了 SN43Demo 组件中实现多卡片结构支持的最佳实践。这一功能允许用户使用两种模式的提示词模板：原版单卡片结构和迭代版多卡片结构。

## 实现思路

### 1. 类型定义扩展

在 `types.ts` 中，我们扩展了数据类型以支持多卡片结构：

```typescript
// 全局提示词块集合
export interface GlobalPromptBlocks {
  [key: string]: string;
}

// 卡片提示词块集合
export interface CardPromptBlocks {
  [key: string]: string;
}

// 卡片接口定义
export interface Card {
  id: string;                 // 卡片唯一标识符
  title: string;              // 卡片标题
  adminInputs: AdminInputs;   // 卡片特定的管理员配置
  promptBlocks: CardPromptBlocks; // 卡片特定的提示词块
}

// 在 SN43ConfigFile 中添加多卡片支持
export interface SN43ConfigFile {
  // ...原有字段
  
  // 单卡片模式的字段（兼容性）
  userInputs?: UserInputs;
  adminInputs?: AdminInputs;
  promptBlocks?: PromptBlock[];
  
  // 多卡片模式的字段
  cards?: Card[];
  globalPromptBlocks?: GlobalPromptBlocks;
  
  isMultiCard?: boolean;  // 是否多卡片模式
}
```

### 2. 视图组件

创建了专用的 `MultiCardView` 组件来渲染多卡片结构：

```typescript
interface MultiCardViewProps {
  cards: Card[];
  globalPromptBlocks?: GlobalPromptBlocks;
  isPreview?: boolean;
}

const MultiCardView: React.FC<MultiCardViewProps> = ({ cards, globalPromptBlocks, isPreview = false }) => {
  // 负责渲染卡片列表和全局提示词块
  return (
    <div className="multi-card-view">
      {/* 卡片依次罗列展示 */}
      {cards.map((card, index) => (
        <div key={card.id || index} className="card-container">
          {/* 卡片内容渲染... */}
        </div>
      ))}
      
      {/* 全局提示词块渲染... */}
    </div>
  );
};
```

### 3. 结构验证兼容

在 `AgentGenerator` 组件中，实现了灵活的JSON结构验证逻辑，同时支持三种结构：

```typescript
// 尝试解析JSON
const jsonData = JSON.parse(generatedJson);

// 多卡片结构处理
if (jsonData.cards && Array.isArray(jsonData.cards)) {
  // 验证每个卡片的必要字段
  for (const card of jsonData.cards) {
    if (!card.adminInputs || !card.promptBlocks) {
      throw new Error('每个卡片必须包含adminInputs和promptBlocks字段');
    }
  }
  
  // 处理多卡片结构...
}
// 单卡片结构处理
else if (jsonData.adminInputs && jsonData.promptBlocks) {
  // 处理单卡片结构...
}
// 控件数组结构处理
else if (Array.isArray(jsonData)) {
  // 处理控件数组...
}
else {
  throw new Error('JSON结构不正确，必须包含adminInputs和promptBlocks，或是cards数组，或是控件数组');
}
```

### 4. 配置面板预览

在 `ConfigPanel` 组件中，添加了预览模式切换功能：

```typescript
// 预览模式：单卡片或多卡片
const [previewMode, setPreviewMode] = useState<'single' | 'multi'>('single');

// 切换按钮
<div style={{ display: 'flex', alignItems: 'center' }}>
  <button onClick={() => setPreviewMode('single')}>单卡片模式</button>
  <button onClick={() => setPreviewMode('multi')}>多卡片模式</button>
</div>

// 条件渲染不同预览内容
{previewMode === 'single' && (
  // 单卡片预览...
)}

{previewMode === 'multi' && (
  <MultiCardView 
    cards={exampleCards} 
    globalPromptBlocks={exampleGlobalBlocks}
    isPreview={true}
  />
)}
```

## 最佳实践要点

1. **渐进式兼容策略**：
   - 保持对现有单卡片结构的完全兼容
   - 添加多卡片能力作为增强功能
   - 在UI中提供清晰的模式切换方式

2. **类型扩展原则**：
   - 为新结构添加专门的接口
   - 使现有接口中新字段为可选
   - 添加明确的标志字段（如`isMultiCard`）

3. **错误处理**：
   - 提供详细的错误信息
   - 根据结构类型给出针对性的验证失败消息
   - 在UI中清晰显示错误状态

4. **UI设计**：
   - 多卡片依次罗列展示
   - 清晰区分卡片和全局提示词块
   - 提供直观的预览模式切换

## 未来优化方向

1. **编辑体验提升**：
   - 添加拖拽重排卡片的能力
   - 支持卡片折叠/展开
   - 提供卡片模板选择

2. **性能优化**：
   - 大量卡片时的懒加载
   - 仅渲染可视区域的卡片

3. **交互增强**：
   - 卡片间关系可视化
   - 提示词引用高亮显示
   - 提供上下文相关的帮助提示
