export const ADVANCED_SECOND_STAGE_TEMPLATE = `{#firstStagePrompt}

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
