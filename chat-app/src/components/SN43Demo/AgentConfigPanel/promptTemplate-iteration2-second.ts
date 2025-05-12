export const ITERATION2_SECOND_STAGE_TEMPLATE = `# 多卡片系统提示词修改指南 (第二阶段)

## 概述

本文档是多卡片提示词系统的第二阶段指南，专注于如何优化和修改已有的JSON配置。第二阶段以用户的修改需求和第一阶段生成的JSON为基础，进行针对性地调整和优化。

## 二阶段提示词完整模板

\`\`\`
{#firstStagePrompt}

【最后一次执行结果】
{#latestResult}

【用户调整请求】
用户要求进行以下修改："{#input}"

【第二阶段指导】
根据用户的调整请求和第一阶段生成的JSON，请优化现有配置。重点关注以下方面：

1. card和promptBlock数量：如用户要求特定数量，确保满足
2. 引用完整性：每个promptBlock至少包含一个占位符引用（{#input}、{#inputBn}或{#promptBlockn}）
3. 上下文连贯：后续promptBlock应引用前面的promptBlock保持连贯
4. 输出控制：根据输出长度需求拆分promptBlock（单个promptBlock输出限制约4000字）
5. 冲突避免：不要在提示词中包含inputBn的<def>标签内容
6. globalPromptBlock可以根据用户需求，决定是否需要增加或者删除，这不是必要结构

直接输出优化后的完整JSON，无需附加说明或解释。
\`\`\`

## 占位符说明

- \`{#firstStagePrompt}\`: 自动获取最新的第一阶段提示词内容，确保使用最新构建规则
- \`{#latestResult}\`: 最新一次AI生成的JSON结果
- \`{#input}\`: 用户的修改请求

## 重点关注项详解

### 1. card和promptBlock数量

- **需求适配**: 根据用户明确要求增加或减少card和promptBlock
- **id连续性**: 调整card数量时保持id顺序连贯(card1、card2...)
- **结构平衡**: 确保每个card至少包含一个promptBlock
- **示例情景**:
  * 用户要求："增加一个展示角色技能的卡片"
  * 调整：添加新card，并为其分配合适的id、title、adminInputs和promptBlocks

### 2. 引用完整性

- **最小引用原则**: 每个promptBlock必须至少包含一个占位符引用
- **类型支持**: 支持引用用户输入、adminInputs和其他promptBlock
- **空值防护**: 确保引用的字段存在且有有效值
- **错误预防**:
  * 检查并纠正引用不存在的字段
  * 避免创建悬空引用

### 3. 上下文连贯

- **链式引用**: 后续promptBlock应引用前面的promptBlock
- **思路延续**: 确保多个promptBlock间逻辑连贯
- **内容累积**: 长内容生成时通过引用积累上下文
- **引用方式**:
  * 直接引用: \`{#promptBlock1}\`
  * 带卡片引用: \`{#card1.promptBlock1}\`
- **示例格式**:
  \`\`\`
  "promptBlock2": "基于前面的内容{#promptBlock1}，进一步..."
  \`\`\`

### 4. 输出控制

- **长度限制**: 单个promptBlock生成内容约4000字
- **内容拆分**: 长文章、复杂内容应拆分为多个promptBlock
- **段落安排**: 按逻辑段落或主题拆分提示词
- **渐进式生成**:
  * 第一块：开头/引言
  * 中间块：主体内容
  * 最后块：总结/结论
- **实例**:
  \`\`\`
  "promptBlock1": "生成文章引言，主题...",
  "promptBlock2": "基于引言{#promptBlock1}，生成主体第一部分...",
  "promptBlock3": "继续{#promptBlock1}{#promptBlock2}，生成主体第二部分..."
  \`\`\`

### 5. 冲突避免

- **标签处理**: 不直接包含inputBn的<def>标签内容
- **默认值隔离**: 引用输入字段时只引用其值，不包含标签
- **错误示范**:
  \`\`\`
  ❌ "promptBlock1": "文章主题是"关于技术发展的趋势""
  \`\`\`
- **正确示范**:
  \`\`\`
  ✓ "promptBlock1": "文章主题是{#inputB1}"
  \`\`\`

### 6. globalPromptBlock处理

- **可选结构**: 根据需求决定是否使用全局提示词块
- **使用场景**:
  * 需要整合多张卡片信息时添加
  * 单卡片或简单场景可省略
- **修改原则**:
  * 遵循用户明确指示
  * 确保引用正确存在的字段
  * 与整体JSON保持一致

## 修改策略建议

1. **保持核心架构**
   - 除非用户明确要求，否则保持原有的卡片结构和层次关系
   - 修改应在原有设计基础上进行增量调整

2. **循序渐进**
   - 先处理简单的修改（如文本调整）
   - 再处理结构性修改（增减卡片、调整引用）
   - 最后处理globalPromptBlocks

3. **验证与检查**
   - 确保JSON格式正确无误
   - 确认所有引用都指向有效字段
   - 检查promptBlock的逻辑顺序和连贯性

## 实例演示

### 原始JSON
\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "文章生成",
"adminInputs": {
"inputB1": "文章主题 <def>AI发展</def>"
},
"promptBlocks": {
"promptBlock1": "生成一篇关于{#inputB1}的文章"
}
}
]
}
\`\`\`

### 用户修改请求
"增加文章分段，添加文章风格字段，总共需要3个promptBlock"

### 优化后JSON
\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "文章生成",
"adminInputs": {
"inputB1": "文章主题 <def>AI发展</def>",
"inputB2": "文章风格 <def>学术严谨</def>"
},
"promptBlocks": {
"promptBlock1": "生成一篇关于{#inputB1}的文章开头部分，风格为{#inputB2}",
"promptBlock2": "基于开头{#promptBlock1}，继续生成文章主体部分，探讨{#inputB1}的主要方面",
"promptBlock3": "基于前文{#promptBlock1}{#promptBlock2}，生成文章总结部分，整体风格保持{#inputB2}"
}
}
]
}
\`\`\``;
