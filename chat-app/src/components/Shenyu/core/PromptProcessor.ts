/**
 * PromptProcessor.ts
 * 
 * 负责处理神谕提示词模板，包括两阶段提示词的占位符替换和模板管理
 */

import { PromptTemplateSet } from '../types';

/**
 * 处理第一阶段提示词中的占位符
 * 
 * @param template 提示词模板
 * @param userInput 用户输入
 * @returns 处理后的提示词
 */
export function processFirstStagePrompt(template: string, userInput: string): string {
  if (!template) {
    console.error('提示词模板为空');
    return ''; 
  }
  
  // 替换基本占位符
  return template.replace(/\{#input\}/g, userInput);
}

/**
 * 处理第二阶段提示词中的占位符
 * 
 * @param template 第二阶段提示词模板
 * @param firstStagePrompt 第一阶段使用的提示词
 * @param firstStageResult 第一阶段的结果
 * @param userAdjustment 用户修改内容
 * @returns 处理后的提示词
 */
export function processSecondStagePrompt(
  template: string,
  firstStagePrompt: string,
  firstStageResult: string,
  userAdjustment: string
): string {
  if (!template) {
    console.error('第二阶段提示词模板为空');
    return '';
  }
  
  return template
    .replace(/\{#firstStagePrompt\}/g, firstStagePrompt)
    .replace(/\{#promptResults1\}/g, firstStageResult)
    .replace(/\{#input\}/g, userAdjustment);
}

/**
 * 为非JSON响应构建特殊的修改提示词
 * 
 * @param originalContent 原始非JSON响应
 * @param editContent 用户修改内容
 * @returns 特殊处理的提示词
 */
export function buildNonJsonEditPrompt(originalContent: string, editContent: string): string {
  return `
用户之前请求生成一个JSON结构，但未成功生成有效的JSON。以下是原始输出:

---
${originalContent}
---

用户的修改要求: "${editContent}"

请根据用户的需求，生成一个有效的JSON结构，包含以下基本结构:
{
  "cards": [
    {
      "id": "card1",
      "title": "卡片标题",
      "adminInputs": {
        "inputB1": "描述 <def>默认值</def>"
      },
      "promptBlocks": {
        "promptBlock1": "提示词内容，引用{#input}或{#inputB1}"
      }
    }
  ]
}

或者更简单的单卡片结构:
{
  "adminInputs": {
    "inputB1": "描述 <def>默认值</def>"
  },
  "promptBlocks": {
    "promptBlock1": "提示词内容，引用{#input}或{#inputB1}"
  }
}

确保返回的是可解析的JSON格式，不要包含额外的说明文字。
`;
}

/**
 * 获取默认的提示词模板集合
 * 
 * @returns 默认提示词模板数组
 */
export function getDefaultPromptTemplates(): PromptTemplateSet[] {
  return [
    {
      id: 'default-template',
      name: '标准模板',
      firstStage: `你是一个优秀的、具备结构化思维的专家，你仔细阅读用户输入的内容：

"{#input}"

根据这个内容进行分析和判断，构建结构化的提示词JSON。遵循以下规则：

1. 输出必须是有效的JSON格式。
2. 为简单任务使用单卡片结构：
{
  "adminInputs": {
    "inputB1": "描述文本 <def>默认值</def>",
    "inputB2": "描述文本 <def>默认值</def>"
  },
  "promptBlocks": {
    "promptBlock1": "提示词内容，可包含{#input}、{#inputB1}等引用"
  }
}

3. 为复杂任务使用多卡片结构：
{
  "cards": [
    {
      "id": "card1",
      "title": "卡片标题",
      "adminInputs": {
        "inputB1": "描述文本 <def>默认值</def>"
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

直接输出JSON，不要包含任何额外的解释或说明。`,
      secondStage: `{#firstStagePrompt}

【第一阶段执行结果】
{#promptResults1}

【用户调整请求】
用户要求进行以下修改："{#input}"

【第二阶段指导】
根据用户的调整请求和第一阶段生成的JSON，请优化现有配置。重点关注以下方面：

1. card和promptBlock数量：如用户要求特定数量，确保满足
2. 引用完整性：每个promptBlock至少包含一个占位符引用（{#input}、{#inputBn}或{#promptBlockn}）
3. 上下文连贯：后续promptBlock应引用前面的promptBlock保持连贯
4. 输出控制：根据输出长度需求拆分promptBlock
5. 冲突避免：不要在提示词中包含inputBn的<def>标签内容
6. globalPromptBlock可以根据用户需求，决定是否需要增加或者删除

直接输出优化后的完整JSON，无需附加说明或解释。`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true
    },
    {
      id: 'simple-template',
      name: '简易模板',
      firstStage: `基于用户输入"{#input}"，创建一个简单的JSON结构，包含adminInputs和promptBlocks部分。

输出格式应为：

{
  "adminInputs": {
    "inputB1": "描述 <def>默认值</def>",
    "inputB2": "描述 <def>默认值</def>"
  },
  "promptBlocks": {
    "promptBlock1": "提示词内容，引用{#input}或{#inputB1}"
  }
}

直接输出JSON，不包含解释。`,
      secondStage: `根据用户的修改请求："{#input}"，调整以下JSON：

{#promptResults1}

直接输出修改后的JSON，不包含任何解释。`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false
    }
  ];
}

/**
 * 验证提示词模板的完整性
 * 
 * @param template 提示词模板集合
 * @returns 是否为有效模板
 */
export function validatePromptTemplate(template: Partial<PromptTemplateSet>): boolean {
  if (!template.name || !template.firstStage || !template.secondStage) {
    return false;
  }
  
  // 检查第一阶段模板是否包含{#input}占位符
  if (!template.firstStage.includes('{#input}')) {
    return false;
  }
  
  // 检查第二阶段模板是否包含必要的占位符
  const requiredPlaceholders = ['{#promptResults1}', '{#input}'];
  return requiredPlaceholders.every(placeholder => template.secondStage?.includes(placeholder));
}

/**
 * 创建新的提示词模板
 * 
 * @param name 模板名称
 * @param firstStage 第一阶段提示词
 * @param secondStage 第二阶段提示词
 * @returns 新的提示词模板对象
 */
export function createPromptTemplate(
  name: string,
  firstStage: string,
  secondStage: string
): PromptTemplateSet {
  return {
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    firstStage,
    secondStage,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: false
  };
}
