/**
 * 神谕模式系统提示词模块
 * 
 * 提供神谕模式下的系统提示词模板和工具函数，用于在消息提交前对系统提示词进行处理
 */

import { SHENYU_PROMPT_TEMPLATE, SHENYU_PHASE2_TEMPLATE, SHENYU_AI_NAME } from './promptTemplates';

// 重新导出AI名称，保持向后兼容性
export { SHENYU_AI_NAME };

/**
 * 神谕模式系统提示词模板
 * 用于构建结构化的JSON提示词
 */
export const SHENYU_SYSTEM_PROMPT = SHENYU_PROMPT_TEMPLATE;

// 调试模式标志
export const DEBUG_SHENYU_MODE = true; // 生产环境应设为false

/**
 * 替换提示词中的占位符
 * @param template 提示词模板
 * @param userInput 用户输入
 * @returns 替换后的提示词
 */
export function replacePromptPlaceholders(
  template: string,
  userInput: string
): string {
  return template.replace(/\{#input\}/g, userInput);
}

/**
 * 获取神谕模式下的系统提示词
 * @param userInput 用户输入
 * @returns 完整的系统提示词
 */
export function getShenyuSystemPrompt(userInput: string): string {
  return replacePromptPlaceholders(SHENYU_SYSTEM_PROMPT, userInput);
}

// 调试事件数据结构
export interface DebugEventData {
  systemPrompt: string;
  userInput: string;
  contextMessagesCount: number;
  fullPayload: any[];
  response?: string;
}

/**
 * 检查消息是否为JSON格式
 * @param content 消息内容
 * @returns 是否为有效JSON
 */
export function isValidJsonContent(content: string): boolean {
  try {
    // 尝试将内容解析为JSON
    JSON.parse(content);
    // 同时确保内容包含card和promptBlock等关键结构
    return content.includes('"cards"') && 
          (content.includes('"promptBlocks"') || content.includes('"promptBlock'));
  } catch (e) {
    return false;
  }
}

/**
 * 提取JSON内容中的卡片和提示词块信息
 * @param content JSON内容
 * @returns 结构信息对象，包含卡片数量、提示词块数量等
 */
export function extractJsonStructureInfo(content: string): {
  isValidJson: boolean;
  jsonContent: string | null;
  cards?: number;
  adminInputs?: number;
  promptBlocks?: number;
  hasGlobalPrompt?: boolean;
} {
  try {
    // 检查是否为有效JSON
    const isValid = isValidJsonContent(content);
    if (!isValid) {
      return {
        isValidJson: false,
        jsonContent: null
      };
    }

    // 解析JSON
    const json = JSON.parse(content);
    
    // 提取卡片和提示词块信息
    const cards = json.cards?.length || 0;
    
    // 计算adminInputs总数
    let adminInputsCount = 0;
    json.cards?.forEach((card: any) => {
      adminInputsCount += Object.keys(card.adminInputs || {}).length;
    });
    
    // 计算promptBlocks总数
    let promptBlocksCount = 0;
    json.cards?.forEach((card: any) => {
      promptBlocksCount += Object.keys(card.promptBlocks || {}).length;
    });
    
    // 检查是否有全局提示词
    const hasGlobalPrompt = !!json.globalPromptBlocks && 
                           Object.keys(json.globalPromptBlocks).length > 0;
    
    return {
      isValidJson: true,
      jsonContent: content,
      cards,
      adminInputs: adminInputsCount,
      promptBlocks: promptBlocksCount,
      hasGlobalPrompt
    };
  } catch (e) {
    return {
      isValidJson: false,
      jsonContent: null
    };
  }
}

/**
 * 记录发送到API的提示词结构
 * 此函数不会改变原有流程，只负责记录
 */
export function logPromptStructure(
  systemPrompt: string,
  conversationContext: any[],
  userInput: string
): {
  systemPrompt: string;
  contextMessagesCount: number;
  firstContextMessage: any | null;
  lastContextMessage: any | null;
  userInput: string;
  fullPayload: any[];
} {
  const logData = {
    systemPrompt,
    contextMessagesCount: conversationContext.length,
    firstContextMessage: conversationContext.length > 0 ? conversationContext[0] : null,
    lastContextMessage: conversationContext.length > 0 ? conversationContext[conversationContext.length - 1] : null,
    userInput,
    fullPayload: [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: userInput }
    ]
  };

  if (DEBUG_SHENYU_MODE) {
    console.group('神谕模式 - API提交结构');
    console.log('系统提示词:', systemPrompt);
    console.log('上下文消息数量:', conversationContext.length);
    if (conversationContext.length > 0) {
      console.log('上下文第一条:', conversationContext[0]);
      console.log('上下文最后一条:', conversationContext[conversationContext.length - 1]);
    }
    console.log('用户输入:', userInput);
    console.log('完整消息数组:', logData.fullPayload);
    console.groupEnd();
  }

  return logData;
}

/**
 * 触发调试事件
 * 将提示词信息发送到调试面板
 */
export function triggerDebugEvent(data: Omit<DebugEventData, 'timestamp'>) {
  const event = new CustomEvent('shenyu-debug', {
    detail: {
      ...data,
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(event);
}
