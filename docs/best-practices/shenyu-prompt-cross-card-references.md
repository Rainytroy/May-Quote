# 神谕提示词跨卡片引用最佳实践

## 概述

跨卡片引用是神谕提示词系统的一个重要功能，允许一个卡片中的提示词引用另一个卡片中的内容。本文档记录了系统如何处理两种主要的跨卡片引用类型：
1. 跨卡片提示词块引用（promptBlock引用）
2. 跨卡片输入字段引用（input字段引用）

## 跨卡片引用格式

### 提示词块引用格式
```
{#card1.promptBlock1}
```

### 输入字段引用格式
```
{#card1.inputB13}
```

## 处理机制

### 跨卡片提示词块引用处理

系统使用字典方式存储已处理的提示词块，键名格式为 `"卡片ID.提示词块ID"`，例如 `"card1.promptBlock1"`。

处理流程：
1. 首先按顺序处理每个卡片的提示词块
2. 对于每个处理完成的提示词块，将其结果存入 `processedBlocksDict` 字典，键名为 `"{卡片ID}.{提示词块ID}"`
3. 当遇到跨卡片提示词块引用时，从字典中查找对应键名的已处理内容
4. 如果找到，则替换引用为已处理的内容；如果未找到，则记录为未替换的占位符

### 跨卡片输入字段引用处理

系统使用与提示词块处理完全相同的字典方式处理跨卡片输入字段引用，键名格式为 `"卡片ID.输入字段ID"`，例如 `"card1.inputB13"`。

改进后的处理流程：
1. 在处理开始时，构建卡片输入值字典 `cardInputValues`
   - 遍历所有卡片的 `adminInputs` 字段
   - 从 `<def>值</def>` 中提取默认值
   - 将值保存到字典中，键名为 `"{卡片ID}.{输入字段ID}"`，例如 `"card1.inputB13"`
   
2. 当遇到跨卡片输入引用时：
   - 标记为已处理，避免循环引用
   - 从占位符 `{#card1.inputB13}` 提取卡片ID和输入字段ID
   - 构建引用键 `card1.inputB13`，确保格式与字典构建时完全一致
   - 从卡片输入字典中查找该键对应的值
   - 如果找到，则使用该值替换占位符
   - 如果未找到，则尝试从 `controlValues` 中查找 `"inputB13"`（兼容旧逻辑）
   - 如果仍未找到，则记录为未替换的占位符并记录详细日志

## 解决的问题

此机制解决了以下问题：
1. **卡片间输入字段引用问题**：使用与提示词块引用完全相同的字典存储方法，确保一个卡片可以正确引用另一个卡片中的输入字段
2. **键名格式一致性**：确保构建字典和查找引用时使用完全相同的键名格式
3. **输入字段数据源冲突**：优先使用卡片输入字典，然后退化到控件值查找，提供双重保障
4. **循环引用处理**：使用与提示词块相同的机制标记已处理引用，避免无限递归
5. **调试支持**：详细记录尝试查找的键名路径，便于定位替换失败的原因

## 示例用法

### 典型的多卡片场景

```json
{
  "cards": [
    {
      "id": "card1",
      "title": "钓鱼地点选择",
      "adminInputs": {
        "inputB13": "鲫鱼 <def>鲫鱼</def>",
        "inputB14": "草鱼 <def>草鱼</def>"
      },
      "promptBlocks": {
        "promptBlock1": "备选鱼种：{#inputB13}和{#inputB14}"
      }
    },
    {
      "id": "card2",
      "title": "钓鱼装备准备",
      "adminInputs": {
        "inputB15": "红虫 <def>红虫</def>",
        "inputB16": "长竿 <def>长竿</def>",
        "inputB17": "嫩草 <def>嫩草</def>"
      },
      "promptBlocks": {
        "promptBlock2": "针对{#card1.inputB13}建议使用{#inputB15}，针对{#card1.inputB14}建议使用{#inputB16}和{#inputB17}"
      }
    }
  ],
  "globalPromptBlocks": {
    "promptBlockFinal": "完整装备方案：{#card1.promptBlock1} {#card2.promptBlock2}"
  }
}
```

## 注意事项

1. 跨卡片引用依赖于卡片处理的顺序，确保被引用的卡片在引用卡片之前处理
2. 当使用跨卡片引用时，确保引用的卡片ID和字段ID正确无误
3. 构建和查找键名格式必须严格一致，包括大小写和前缀
4. 引用链深度上限为10层，超过会导致处理停止，防止循环引用导致的无限递归
5. 系统自动标记处理过的引用，避免重复处理导致的循环
6. 详细的日志输出包含所有查找的路径，极大方便调试

## 关键代码示例

### 构建卡片输入字典
```typescript
// 构建卡片输入值字典，键名格式与processedBlocksDict一致
const cardInputValues: Record<string, string> = {};
cards.forEach(card => {
  if (card.adminInputs) {
    Object.entries(card.adminInputs).forEach(([inputKey, inputValue]) => {
      if (inputValue) {
        // 提取默认值
        const valueStr = String(inputValue);
        const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
        const value = defaultMatch ? defaultMatch[1] : valueStr;
        
        // 键名格式: "card1.inputB13"
        cardInputValues[`${card.id}.${inputKey}`] = value;
      }
    });
  }
});
```

### 处理跨卡片输入引用
```typescript
// 提取卡片ID和输入字段ID
const match = ref.match(/\{#card([0-9]+)\.input([^}]+)\}/);
if (match) {
  const cardId = match[1];
  const inputId = match[2];
  
  // 构建引用键，格式与字典构建时一致
  const cardPrefix = `card${cardId}`;
  const inputKey = inputId.startsWith('B') ? `inputB${inputId.substring(1)}` : `inputB${inputId}`;
  const refKey = `${cardPrefix}.${inputKey}`;
  
  // 查找并替换
  if (cardInputValues[refKey]) {
    const valueToUse = String(cardInputValues[refKey]);
    result = result.replace(new RegExp(escapeRegExp(ref), 'g'), valueToUse);
    replacedCount++;
  }
}
```

## 结论

跨卡片引用机制通过统一的字典存储方式，实现了提示词块和输入字段的灵活引用，确保多卡片系统中的数据能够有效流通。通过确保键名格式一致性和精确的查找逻辑，该机制极大提升了提示词模板的复用能力和灵活性，使开发者能够构建出更复杂、更模块化的提示词系统。

完全遵循"与promptBlock保持一致"的原则，这种实现方式使得系统的行为更加一致和可预测，减少了维护成本和使用者的学习曲线。
