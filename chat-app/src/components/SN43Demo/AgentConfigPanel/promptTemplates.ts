/**
 * 神谕 Agent 生成器使用的提示词模板
 */

// 原版提示词模板
export const ORIGINAL_PROMPT_TEMPLATE_1 = `我需要根据用户的输入："{#input}"。来输出 json，这个 json 是一个问卷，用户会输入 inputB1-N，然后点击提交后，顺序调用 promptBlocks 数组中的字符串给到 ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到 inputBn 中，而在 promptBlock 中不准问问题，以用户在 inputBn 的<def></def>标签中的内容，作为构建生成解决方案或者回答的promptBlock的输入，用1个或多个promptBlock来形成深度的回答。根据用户要求需要几个promptBlock来设计需要几个promptBlock以及每次的 promptBlock 中的提示词内容的前后逻辑通过添加{#promptBlockn}占位符引用上下文来保持一致，输出的时候输出 json，按照以下的范例和规则输出。

你根据用户输入，认为他最可能的想达成什么目的。然后 inputB1-BN 是你分析要达成这个目的，还需要向用户澄清的 1-3 个关键输入因素（参数），<def></def>默认值中填入"用户看到该inputBn 内容后最可能填入的选项内容， 如 "inputB1": "文章主题 <def>关于技术发展的趋势</def>"，关于技术发展的趋势就是用户看到"文章主题"后最可能填入的选项内容" 

然后判断用户最终需要的是很长的回复，还是简短的回复。如果是长的回复，可能需要多个 promtBlock，如果是短回复，则一个 promptBlock 即可，因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，也就是除非是要求写大量复杂文章，一般都要在 1 个 promptBlock 解决问题。第 2-N 个 promptBlock 中必须要引用至少 1 个其前面的 promptBlock。写 promptBlock1 的时候，用户就已经完成了 inputB1-N 的输入，不需要在 promptBlock 中追问用户。promptBlock1 的典型写法为："以下是基本信息：" 写法见下方。

只输出 json 文件，不要输出其他不相关内容。

以下是范例：
用户输入：你最喜欢什么动物 
ai 经过分析，让用户输入三种动物，默认值在<def></def>中，然后调用两次 ai，第一次调用的 prompt 为："以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 猫 狗 鸡"
第二次调用的 prompt 为 "你最喜欢哪个：波斯猫 拉布拉多 白来航鸡？直接输出结果，不需要解释"
（第二次调用中的波斯猫 拉布拉多 白来航鸡为第一次 prompt 生成的结果）

特别说明：Json 文件中的 "promptBlocks": [string1,string2....] 是一个数组，这个数组的每一个元素的名称对应 promptBlock1-N，因此当某个 promptBlock 中出现如 {#promptBlock1} 这样的占位符，该占位符会被替换为 promptBlock1 里面的 prompt 在发给 ai 后得到的回复。这个功能类似大模型中的叠加历史对话上下文的做法，只是更具选择性。因此在构建多个 promptBlock 的 json 文件的时候，每个 promptblock 中必须出现至少 1 种占位符以精准选择需要的上下文，因为数列中的 prompts 每个都是单独的对话发给大模型，是没有上下文的。写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突。

Json 文件范例如下：
多 promptBlock 范例 
 {
 "adminInputs": {
 "inputB1": " 动物 1 <def>猫</def>",
"inputB2":" 动物 2 <def>狗</def>",
"inputB3":" 动物 3 <def>鸡</def>"
 },
"promptBlocks": {
"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 {#inputB1} {#inputB2} {#inputB3}",
"promptBlock2":" 你最喜欢哪个：{#promptBlock1} 直接输出结果，不需要解释 "
 }
}`;

export const ORIGINAL_PROMPT_TEMPLATE_2 = `根据用户的输入："{#input}"，以及ai根据用户输入的初步设计的json文件："{#promptResults1}"，特别注意如果用户要求了promptBlock数量，要补全json中的promptBlock的数量并开发合适的提示词，满足用户对promptBlocks数量的要求（如果有），优化其他promptBlock中的提示词：因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，除非客户有明确要求外，一般都要在 1 个 promptBlock 解决问题。而ai对每个promptblock的回答最多4000字左右，当判断客户需要的输出（比如长文章）时，则用多个promptBlock来多次分段输出，因此promptBlock2-n中必须包含至少1个promptBlock占位符和其内容说明，来保持上下文。 json文件本质是一个问卷，用户会输入 inputB1-N，<def></def>标签里面代表该输入的默认值。然后点击提交后，程序会顺序调用 promptBlock1-N中的字符串给到 ai，并依次把内容返回给用户。需要你优化promptBlock中的提示词：1，确保promptBlock1中的提示词引用了正确的用户输入{#inputBn}（但写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突），确保后续的提示词正确地引用了它前面的上下文{#promptBlockn}或者用户的输入（如果需要），n为1-n的整数，代表了控件的编号，每个promptblock至少要有1个{}占位符，不管是input还是promptblock。以下是一个多 promptBlock 范例 
 {
 "adminInputs": {
 "inputB1": " 动物 1 <def>猫</def>",
"inputB2":" 动物 2 <def>狗</def>",
"inputB3":" 动物 3 <def>鸡</def>"
 },
"promptBlocks": {
"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 {#inputB1} {#inputB2} {#inputB3}",
"promptBlock2":" 你最喜欢哪个：{#promptBlock1} 直接输出结果，不需要解释 "
 }
}。多段文章上下文引用范例：{   "adminInputs": {     "inputB1": "文章主题 <def>关于技术发展的趋势</def>",     "inputB2": "每段的主要内容 <def>第一段介绍背景，第二段分析现状，第三段探讨影响，第四段预测未来，第五段总结</def>",     "inputB3": "文章风格 <def>正式且学术</def>",     "inputB4": "目标读者 <def>专业人士</def>",     "inputB5": "是否需要引用数据或案例 <def>是，需要最新的数据和相关案例</def>"   },   "promptBlocks": {     "promptBlock1": "根据提供的基本信息，生成第一段内容，主要介绍技术发展的趋势背景。主题：{#inputB1}，每段内容：{#inputB2}，风格：{#inputB3}，目标读者：{#inputB4}，数据引用：{#inputB5}",     "promptBlock2": "以下是第一段内容：{#promptBlock1}\\n\\n根据第一段内容和基本信息，生成第二段内容，主要分析技术发展的现状。",     "promptBlock3": "以下是前两段内容：{#promptBlock1}\\n{#promptBlock2}\\n\\n根据前两段内容和基本信息，生成第三段内容，主要探讨技术发展的影响。",     "promptBlock4": "以下是前三段内容：{#promptBlock1}\\n{#promptBlock2}\\n{#promptBlock3}\\n\\n根据前三段内容和基本信息，生成第四段内容，主要预测技术发展的未来趋势。",     "promptBlock5": "以下是前四段内容：{#promptBlock1}\\n{#promptBlock2}\\n{#promptBlock3}\\n{#promptBlock4}\\n\\n根据前四段内容和基本信息，生成第五段内容，总结全文并给出结论。"   } }。检查输出的每个promptblock至少要有1个{}占位符，写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突。不管是input还是promptblock直接输出1个最终优化好的JSON文件，不要输出任何其他内容如说明和解释`;

// 迭代版提示词模板（支持多卡片结构）
export const ADVANCED_PROMPT_TEMPLATE_1 = `我需要根据用户的输入："{#input}"。来输出 json，这个 json 是一个问卷，用户会输入 inputB1-N，然后点击提交后，顺序调用 promptBlocks 数组中的字符串给到 ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到 inputBn 中，而在 promptBlock 中不准问问题，以用户在 inputBn 的<def></def>标签中的内容，作为构建生成解决方案或者回答的promptBlock的输入，用1个或多个promptBlock来形成深度的回答。根据用户要求需要几个promptBlock来设计需要几个promptBlock以及每次的 promptBlock 中的提示词内容的前后逻辑通过添加{#promptBlockn}占位符引用上下文来保持一致，输出的时候输出 json，按照以下的范例和规则输出。

你根据用户输入，认为他最可能的想达成什么目的。然后 inputB1-BN 是你分析要达成这个目的，还需要向用户澄清的 1-3 个关键输入因素（参数），<def></def>默认值中填入"用户看到该inputBn 内容后最可能填入的选项内容， 如 "inputB1": "文章主题 <def>关于技术发展的趋势</def>"，关于技术发展的趋势就是用户看到"文章主题"后最可能填入的选项内容" 

然后判断用户最终需要的是很长的回复，还是简短的回复。如果是长的回复，可能需要多个 promtBlock，如果是短回复，则一个 promptBlock 即可，因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，也就是除非是要求写大量复杂文章，一般都要在 1 个 promptBlock 解决问题。第 2-N 个 promptBlock 中必须要引用至少 1 个其前面的 promptBlock。写 promptBlock1 的时候，用户就已经完成了 inputB1-N 的输入，不需要在 promptBlock 中追问用户。promptBlock1 的典型写法为："以下是基本信息：" 写法见下方。

同时，分析用户需求的复杂度，判断是否需要使用多卡片结构。如果用户需求包含多个独立部分（如多个角色、多个场景、多步骤流程等），那么应该使用多卡片结构。在多卡片结构中，每个卡片有自己的adminInputs和promptBlocks，还可以有全局的promptBlocks用于整合多个卡片的结果。

只输出 json 文件，不要输出其他不相关内容。

以下是范例：

单卡片范例：
用户输入：你最喜欢什么动物 
ai 经过分析，让用户输入三种动物，默认值在<def></def>中，然后调用两次 ai，第一次调用的 prompt 为："以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 猫 狗 鸡"
第二次调用的 prompt 为 "你最喜欢哪个：波斯猫 拉布拉多 白来航鸡？直接输出结果，不需要解释"
（第二次调用中的波斯猫 拉布拉多 白来航鸡为第一次 prompt 生成的结果）

特别说明：Json 文件中的 "promptBlocks": [string1,string2....] 是一个数组，这个数组的每一个元素的名称对应 promptBlock1-N，因此当某个 promptBlock 中出现如 {#promptBlock1} 这样的占位符，该占位符会被替换为 promptBlock1 里面的 prompt 在发给 ai 后得到的回复。这个功能类似大模型中的叠加历史对话上下文的做法，只是更具选择性。因此在构建多个 promptBlock 的 json 文件的时候，每个 promptblock 中必须出现至少 1 种占位符以精准选择需要的上下文，因为数列中的 prompts 每个都是单独的对话发给大模型，是没有上下文的。写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突。

Json 文件范例如下：
单卡片范例 
{
 "adminInputs": {
 "inputB1": " 动物 1 <def>猫</def>",
"inputB2":" 动物 2 <def>狗</def>",
"inputB3":" 动物 3 <def>鸡</def>"
 },
"promptBlocks": {
"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 {#inputB1} {#inputB2} {#inputB3}",
"promptBlock2":" 你最喜欢哪个：{#promptBlock1} 直接输出结果，不需要解释 "
 }
}

多卡片范例（针对复杂任务）：
{
  "cards": [
    {
      "id": "worldSetting",
      "title": "世界观设定",
      "adminInputs": {
        "inputB1": "游戏世界观背景 <def>剑与魔法的幻想世界</def>",
        "inputB2": "核心属性类型 <def>力量,敏捷,魔力,耐力</def>"
      },
      "promptBlocks": {
        "worldContext": "详细描述以下世界观设定：{#inputB1}\\n设定中的核心属性系统：{#inputB2}"
      }
    },
    {
      "id": "characterCreation",
      "title": "角色属性配置",
      "adminInputs": {
        "inputC1": "角色名称 <def>艾瑞克</def>",
        "inputC2": "职业类型 <def>法师</def>",
        "inputC3": "性格特征 <def>冷静沉着</def>"
      },
      "promptBlocks": {
        "characterStats": "基于世界观：{#worldSetting.worldContext}\\n\\n创建一个角色卡片，包含：\\n名称：{#inputC1}\\n职业：{#inputC2}\\n性格：{#inputC3}"
      }
    }
  ],
  "globalPromptBlocks": {
    "finalSummary": "基于世界观设定：\\n{#worldSetting.worldContext}\\n\\n以及角色属性：\\n{#characterCreation.characterStats}\\n\\n创建一个完整的角色故事梗概（300字以内）"
  }
}

在多卡片结构中：
1. 每个卡片都有唯一的id和标题
2. 每个卡片都有自己的adminInputs和promptBlocks
3. 卡片间可以通过{#cardId.promptBlockId}相互引用
4. globalPromptBlocks用于整合多个卡片的结果
5. 每个promptBlock至少包含一个占位符引用

针对用户的具体需求，选择合适的结构（单卡片或多卡片），然后设计合适的输入字段和提示词块，确保JSON格式正确、占位符使用恰当。`;

export const ADVANCED_PROMPT_TEMPLATE_2 = `{#firstStagePrompt}

【第一阶段执行结果】
{#promptResults1}

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


详细检查以下内容：
1. 确认json格式是否正确，如果有语法错误需修复
2. 确保每个inputBn中都包含了<def></def>标签和合理的默认值
3. 确保每个promptBlock中引用了正确的输入和上下文
4. 确保每个promptBlock至少包含一个占位符引用（{#xxx}格式）
5. 不要在promptBlock中包含任何问题，只能包含指令和引用信息
6. 不要在提示词中重复inputBn中<def>标签中的内容

针对不同的json结构类型，分别做出以下优化：
1. 单卡片结构 - 包含adminInputs和promptBlocks
   - promptBlock1应该直接引用用户输入（{#inputBn}格式）
   - promptBlock2-n必须引用至少一个前面的promptBlock（{#promptBlockn}格式）
   - 除非用户明确需要多段输出，否则尽量用一个promptBlock解决问题

2. 多卡片结构 - 包含cards数组和可选的globalPromptBlocks
   - 每个卡片必须有唯一的id和合适的title
   - 每个卡片必须包含完整的adminInputs和promptBlocks
   - 卡片间引用必须使用{#cardId.promptBlockId}格式
   - globalPromptBlocks应该整合多个卡片的结果
   - 确保跨卡片引用的正确性

多卡片结构的范例：
{
  "cards": [
    {
      "id": "card1",
      "title": "第一个卡片",
      "adminInputs": {
        "inputB1": "问题描述 <def>默认值</def>"
      },
      "promptBlocks": {
        "promptBlock1": "根据输入{#inputB1}进行处理..."
      }
    },
    {
      "id": "card2",
      "title": "第二个卡片",
      "adminInputs": {
        "inputC1": "问题描述 <def>默认值</def>"
      },
      "promptBlocks": {
        "promptBlock1": "结合第一个卡片{#card1.promptBlock1}和输入{#inputC1}进行处理..."
      }
    }
  ],
  "globalPromptBlocks": {
    "finalSummary": "整合所有卡片结果：\\n{#card1.promptBlock1}\\n{#card2.promptBlock1}"
  }
}

仔细检查所有占位符引用的格式和位置，确保每个promptBlock都有合适的上下文引用。只输出最终的json格式，不要包含任何解释或说明。`;

/**
 * 常量定义默认模板类型
 */
export enum TemplateType {
  ORIGINAL = 'original',
  ADVANCED = 'advanced'
}

/**
 * 获取默认的第一阶段提示词模板
 */
export function getDefaultFirstStagePrompt(type: TemplateType = TemplateType.ORIGINAL): string {
  return type === TemplateType.ORIGINAL 
    ? ORIGINAL_PROMPT_TEMPLATE_1 
    : ADVANCED_PROMPT_TEMPLATE_1;
}

/**
 * 获取默认的第二阶段提示词模板
 */
export function getDefaultSecondStagePrompt(type: TemplateType = TemplateType.ORIGINAL): string {
  return type === TemplateType.ORIGINAL 
    ? ORIGINAL_PROMPT_TEMPLATE_2 
    : ADVANCED_PROMPT_TEMPLATE_2;
}
