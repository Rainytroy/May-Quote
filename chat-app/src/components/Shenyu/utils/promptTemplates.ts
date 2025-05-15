/**
 * 神谕模式提示词模板
 *
 * 本文件专门用于存储神谕模式的提示词模板，
 * 与代码逻辑分离，方便单独维护和更新。
 */

/**
 * 神谕模式标准提示词模板
 */
export const SHENYU_PROMPT_TEMPLATE = `# 多卡片系统提示词构建指南

你是一个优秀的、具备结构化思维的专家，你仔细阅读用户输入的内容：

"{#input}"

根据这个内容进行分析和判断，构建结构化的提示词JSON。本指南将帮助你完成这个过程，分为六个核心部分：基础架构、引用系统、构建adminInputs、构建promptBlocks、构建cards和构建globalPromptBlocks。

## 一、基础架构

多卡片系统的JSON结构由以下主要组件构成：

\`\`\`json
{
  "cards": [
    {
      "id": "card1",
      "title": "卡片标题",
      "adminInputs": {
        "inputB1": "描述文本 <def>默认值</def>",
        "inputB2": "描述文本 <def>默认值</def>"
      },
      "promptBlocks": {
        "promptBlock1": "提示词内容，可包含{#input}、{#inputB1}等引用"
      }
    }
  ],
  "globalPromptBlocks": {
    "promptBlockFinal": "全局提示词内容，可引用任何卡片内容"
  }
}
\`\`\`

## 二、引用系统

引用系统是多卡片框架的核心功能，用于在不同部分之间建立联系。

### 引用语法

1. **基本引用格式**：所有引用使用\`{#标识符}\`格式
2. **引用类型**：
   - 用户输入引用：\`{#input}\` - 引用用户原始输入
   - 同卡片引用：\`{#inputB1}\` - 引用当前卡片的adminInputs
   - 跨卡片引用：\`{#card1.inputB3}\` - 引用指定卡片的adminInputs
   - 提示词引用：\`{#promptBlock1}\`或\`{#card1.promptBlock1}\` - 引用提示词块

### 引用规则

1. **作用域**：引用解析顺序为当前卡片 → 指定卡片 → 全局
2. **避免循环**：禁止创建循环引用，如A引用B，B又引用A
3. **自引用限制**：promptBlock不能引用自身
4. **有效性**：确保所有引用的字段在对应卡片中存在

### 引用最佳实践

1. 保持引用路径简洁，一般不超过2层嵌套
2. 明确使用卡片ID进行跨卡片引用，如\`{#card1.inputB3}\`
3. 使用有意义的引用，避免无目的引用

## 三、构建adminInputs

### 目的与作用

adminInputs用于收集用户输入，在构建过程中，你需要：

1. 首先评估用户的实际目标
2. 确定实现该目标所需的关键输入因素（通常1-5个）
3. 设计这些因素对应的输入字段

### 格式规范

\`\`\`json
"adminInputs": {
  "inputB1": "描述文本1 <def>默认值1</def>",
  "inputB2": "描述文本2 <def>默认值2</def>"
}
\`\`\`

1. **键名规则**：使用inputB为前缀，后跟数字序号（inputB1、inputB2...）
2. **值格式**：\`"描述文本 <def>默认值</def>"\`
   - 描述文本：简洁明确的字段说明，5-15字为宜
   - \`<def></def>\`标签：包含预设的默认值

### 默认值设置原则

默认值应该是"用户看到该描述文本后最可能填入的选项内容"，如：
- \`"文章主题 <def>关于技术发展的趋势</def>"\`
- \`"游戏风格 <def>奇幻冒险</def>"\`

### 边界情况处理

1. **特殊字符**：避免在描述文本和默认值中使用JSON特殊字符(\`"\`、\`\\\`等)，必要时进行转义
2. **长文本**：默认值通常控制在50字以内，特殊情况可添加"多行"关键词标记
3. **空值处理**：所有adminInputs必须提供默认值，避免空值导致系统错误

## 四、构建promptBlocks

### 目的与作用

promptBlocks是提交给AI的实际提示词，用于生成满足用户需求的内容。

### 格式规范

\`\`\`json
"promptBlocks": {
  "promptBlock1": "提示词内容，可包含{#input}、{#inputB1}等引用"
}
\`\`\`

1. **键名规则**：使用promptBlock前缀，后跟数字序号
2. **内容要求**：
   - 陈述句或指令句，不包含疑问句（如"你觉得...?"）
   - 至少包含一个占位符引用
   - 可引用用户输入\`{#input}\`、adminInputs\`{#inputB1}\`或其他promptBlocks\`{#promptBlock2}\`

### 提示词块设计策略

1. **分步构建**：一个promptBlock代表一次AI生成任务，多个promptBlock意味着将分步骤生成内容
2. **复杂度评估**：
   - 简单任务（如信息查询）：通常一个promptBlock即可
   - 复杂任务（如多方面分析）：可能需要多个promptBlock分步处理
3. **内容关联**：后续promptBlock可引用前面promptBlock的结果，形成连贯的思考链

## 五、构建cards

### 卡片的概念与作用

卡片是多卡片系统的基本构建块，每张卡片代表一个独立的配置单元，可以包含输入字段、提示词和引用关系。

### 卡片结构

每张卡片必须包含以下四个部分：
1. **id**：卡片的唯一标识符，格式必须是card1-n顺序编号
2. **title**：描述卡片主要目的和内容的标题
3. **adminInputs**：管理员配置的输入字段集合
4. **promptBlocks**：提示词块集合

### 单卡片与多卡片设计

系统支持两种设计模式：

1. **单卡片设计**：所有adminInputs和promptBlocks放在一张卡片中
   - 适用于简单任务或内部逻辑紧密相关的任务
   - 结构简单，管理方便

2. **多卡片设计**：将不同功能分散到多张卡片中
   - 适用于复杂任务或多个相对独立的子任务
   - 结构清晰，便于扩展和维护

### 卡片设计最佳实践

1. 将相关功能放在同一张卡片
2. 使用card1作为基础配置卡片
3. 保持卡片id是card1-n的命名格式
4. 每张卡片赋予有意义的title
5. 整个Json内，adminInputs和promptBlocks编号独立递增，与所在卡片无关

## 六、构建globalPromptBlocks

### 目的与作用

globalPromptBlocks是全局提示词块，用于整合多张卡片的信息，生成最终的综合性提示词。**只有在构建多卡片系统时才需要考虑此部分**。

### 格式规范

\`\`\`json
"globalPromptBlocks": {
  "promptBlockFinal": "整合性提示词内容"
}
\`\`\`

1. **位置**：位于JSON的顶层，与cards平级
2. **内容**：通常包含一个名为"promptBlockFinal"的提示词块
3. **引用能力**：可以引用任何卡片中的任何输入字段或提示词块

### 使用原则

1. 用于整合多张卡片的信息
2. 引用具体卡片的特定信息，而非泛指
3. 作为系统的最终输出提示词

## 七、错误处理与边界情况

### 常见错误类型

1. **语法错误**：JSON格式不正确
2. **引用错误**：引用不存在的卡片或字段
3. **循环引用**：形成引用循环
4. **类型错误**：输入类型与预期不符

### 防御性措施

1. **验证JSON结构**：确保所有必需字段存在且格式正确
2. **引用前检查**：引用前验证目标是否存在
3. **防循环策略**：检测并避免创建循环引用
4. **默认值保障**：为所有字段提供合理默认值

## 示例展示

### 示例1：简单单卡片结构

\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "动物信息查询",
"adminInputs": {
"inputB1": "动物1 <def>猫</def>",
"inputB2": "动物2 <def>狗</def>",
"inputB3": "动物3 <def>鸡</def>"
},
"promptBlocks": {
"promptBlock1": "请查阅{#inputB1}、{#inputB2}、{#inputB3}的信息"
}
}
]
}
\`\`\`

### 示例2：多卡片结构

\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "动物信息查询",
"adminInputs": {
"inputB1": "动物1 <def>猫</def>"
},
"promptBlocks": {
"promptBlock1": "请查阅{#inputB1}的信息"
}
},
{
"id": "card2",
"title": "故事创作",
"adminInputs": {
"inputB2": "动物2 <def>狗</def>"
},
"promptBlocks": {
"promptBlock2": "以{#inputB2}为主角写一个故事"
}
},
{
"id": "card3",
"title": "需求分析",
"adminInputs": {
"inputB3": "动物3 <def>鸡</def>"
},
"promptBlocks": {
"promptBlock3": "尝试分析用户的需求{#input}，根据{#card1.promptBlock1}和{#card2.promptBlock2}分析用户为什么要怎么做"
}
}
]
}
\`\`\`

### 示例3：同一需求的单卡片实现

\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "动物信息查询",
"adminInputs": {
"inputB1": "动物1 <def>猫</def>",
"inputB2": "动物2 <def>狗</def>",
"inputB3": "动物3 <def>鸡</def>"
},
"promptBlocks": {
"promptBlock1": "请查阅{#inputB1}的信息",
"promptBlock2": "以{#inputB2}为主角写一个故事",
"promptBlock3": "尝试分析用户的需求{#input}，根据{#promptBlock1}和{#promptBlock2}分析用户为什么要怎么做"
}
}
]
}
\`\`\`

### 示例4：复杂多卡片与globalPromptBlocks

\`\`\`json
{
"cards": [
{
"id": "card1",
"title": "游戏基础设置",
"adminInputs": {
"inputB1": "游戏风格 <def>奇幻冒险</def>",
"inputB2": "游戏难度 <def>中等挑战</def>",
"inputB3": "世界背景 <def>被魔法与科技共存的大陆</def>",
"inputB4": "核心玩法 <def>探索与战斗</def>",
"inputB5": "角色成长系统 <def>技能树+属性点分配</def>"
},
"promptBlocks": {
"promptBlock1": "游戏设定：一个{#inputB1}风格的游戏，难度为{#inputB2}，设定在{#inputB3}，玩家将通过{#inputB4}体验游戏，角色通过{#inputB5}获得成长。"
}
},
{
"id": "card2",
"title": "战士角色设定",
"adminInputs": {
"inputB6": "角色名称 <def>钢铁守护者</def>",
"inputB7": "战斗定位 <def>近战坦克</def>",
"inputB8": "特殊能力 <def>嘲讽与伤害减免</def>",
"inputB9": "装备类型 <def>重型护甲与单手武器</def>",
"inputB10": "背景故事 <def>曾是帝国的精锐护卫</def>"
},
"promptBlocks": {
"promptBlock2": "基于{#card1.promptBlock1}，设计一名{#inputB7}角色【{#inputB6}】。此角色擅长{#inputB8}，通常使用{#inputB9}作为装备。角色背景：{#inputB10}。"
}
},
{
"id": "card3",
"title": "法师角色设定",
"adminInputs": {
"inputB11": "角色名称 <def>奥术编织者</def>",
"inputB12": "战斗定位 <def>远程法术输出</def>",
"inputB13": "特殊能力 <def>区域控制与元素掌控</def>",
"inputB14": "装备类型 <def>法杖与魔法织物</def>",
"inputB15": "背景故事 <def>来自古老法师学院的天才</def>"
},
"promptBlocks": {
"promptBlock3": "基于{#card1.promptBlock1}，设计一名{#inputB12}角色【{#inputB11}】。此角色擅长{#inputB13}，通常使用{#inputB14}作为装备。角色背景：{#inputB15}。"
}
},
{
"id": "card4",
"title": "盗贼角色设定",
"adminInputs": {
"inputB16": "角色名称 <def>暗影行者</def>",
"inputB17": "战斗定位 <def>刺客/爆发输出</def>",
"inputB18": "特殊能力 <def>潜行与暴击</def>",
"inputB19": "装备类型 <def>轻型护甲与双匕首</def>",
"inputB20": "背景故事 <def>出身盗贼公会，精通各种潜入技巧</def>"
},
"promptBlocks": {
"promptBlock4": "基于{#card1.promptBlock1}，设计一名{#inputB17}角色【{#inputB16}】。此角色擅长{#inputB18}，通常使用{#inputB19}作为装备。角色背景：{#inputB20}。"
}
},
{
"id": "card5",
"title": "弓箭手角色设定",
"adminInputs": {
"inputB21": "角色名称 <def>风矢猎手</def>",
"inputB22": "战斗定位 <def>远程物理输出</def>",
"inputB23": "特殊能力 <def>精准射击与陷阱设置</def>",
"inputB24": "装备类型 <def>中型护甲与长弓</def>",
"inputB25": "背景故事 <def>森林守护者，与自然有特殊联系</def>"
},
"promptBlocks": {
"promptBlock5": "基于{#card1.promptBlock1}，设计一名{#inputB22}角色【{#inputB21}】。此角色擅长{#inputB23}，通常使用{#inputB24}作为装备。角色背景：{#inputB25}。"
}
},
{
"id": "card6",
"title": "牧师角色设定",
"adminInputs": {
"inputB26": "角色名称 <def>圣光祈唤者</def>",
"inputB27": "战斗定位 <def>治疗与增益支援</def>",
"inputB28": "特殊能力 <def>治疗法术与队友增益</def>",
"inputB29": "装备类型 <def>布甲与神圣法器</def>",
"inputB30": "背景故事 <def>神圣教会的虔诚信徒，传播希望</def>"
},
"promptBlocks": {
"promptBlock6": "基于{#card1.promptBlock1}，设计一名{#inputB27}角色【{#inputB26}】。此角色擅长{#inputB28}，通常使用{#inputB29}作为装备。角色背景：{#inputB30}。"
}
}
],
"globalPromptBlocks": {
"promptBlockFinal": "根据以上角色设定，在{#card1.inputB3}的世界观下，生成一个完整的游戏角色阵容，包含坦克({#card2.inputB6})、法术输出({#card3.inputB11})、刺客({#card4.inputB16})、远程物理({#card5.inputB21})和治疗({#card6.inputB26})。详细说明他们的技能组合与战斗策略。"
}
}
\`\`\`


# 多卡片系统提示词修改指南 (第二阶段)

## 概述

本文档是多卡片提示词系统的第二阶段指南，如果用户需要在上文基础上继续专注于如何优化和修改已有的JSON配置。第二阶段以用户的修改需求和第一阶段生成的JSON为基础，进行针对性地调整和优化。

## 二阶段提示词完整模板

\`\`\`
{#firstStagePrompt}

【最后一次执行结果】
{#latestResult}

【用户调整请求】
用户要求进行以下修改："{#input}"

【第二阶段指导】
根据用户的调整请求和最后一次执行结果生成的JSON，请优化现有配置。重点关注以下方面：

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

## 结语

按照以上指南进行构建，根据用户的具体需求选择合适的结构（单卡片或多卡片），设计适当的输入字段和提示词块，并确保JSON格式正确、占位符使用恰当。通过合理的结构设计和引用系统，可以创建出复杂而强大的提示词，满足各种生成需求。`;

/**
 * 神谕AI的显示名称
 */
export const SHENYU_AI_NAME = "May the 神谕 be with you";

/**
 * 第二阶段提示词模板
 */
export const SHENYU_PHASE2_TEMPLATE = `{#firstStagePrompt}

【最后一次执行结果】
{#latestResult}

【用户调整请求】
用户要求进行以下修改："{#input}"

【第二阶段指导】
根据用户的调整请求和最后一次执行结果生成的JSON，请优化现有配置。重点关注以下方面：

1. card和promptBlock数量：如用户要求特定数量，确保满足
2. 引用完整性：每个promptBlock至少包含一个占位符引用（{#input}、{#inputBn}或{#promptBlockn}）
3. 上下文连贯：后续promptBlock应引用前面的promptBlock保持连贯
4. 输出控制：根据输出长度需求拆分promptBlock（单个promptBlock输出限制约4000字）
5. 冲突避免：不要在提示词中包含inputBn的<def>标签内容
6. globalPromptBlock可以根据用户需求，决定是否需要增加或者删除，这不是必要结构

直接输出优化后的完整JSON，无需附加说明或解释。`;
