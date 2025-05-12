/**
 * JsonExtractor.ts
 * 
 * 负责从AI响应中提取JSON结构，验证其有效性，并分析结构特征
 * 包括处理非JSON响应等边缘情况
 */

import { JsonStructureInfo } from '../types';

/**
 * 从响应文本中提取和验证JSON
 * 
 * @param response AI响应原始文本
 * @returns 提取的JSON信息，包括有效性、内容和结构分析
 */
export function extractAndValidateJson(response: string): JsonStructureInfo {
  try {
    // 尝试提取JSON部分 - 使用正则匹配包含关键字段的JSON结构
    const jsonRegex = /{[\s\S]*(?:"cards"|"adminInputs"|"promptBlocks")[\s\S]*}/g;
    const matches = response.match(jsonRegex);
    
    // 如果没有匹配到JSON结构，返回无效状态
    if (!matches || matches.length === 0) {
      console.log('未检测到JSON结构');
      return {
        isValidJson: false,
        jsonContent: null
      };
    }
    
    // 尝试解析匹配到的第一个JSON
    const jsonStr = matches[0];
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON解析失败:', e);
      return {
        isValidJson: false,
        jsonContent: jsonStr // 保留找到的文本，虽然不是有效JSON
      };
    }
    
    // 验证JSON结构是否符合要求（至少包含cards或adminInputs+promptBlocks）
    const isValid = (
      (parsedJson.cards && Array.isArray(parsedJson.cards) && parsedJson.cards.length > 0) ||
      (parsedJson.adminInputs && parsedJson.promptBlocks)
    );
    
    if (!isValid) {
      console.log('JSON不符合神谕格式要求');
      return {
        isValidJson: false,
        jsonContent: jsonStr // 仍然保留解析出的JSON，但标记为无效
      };
    }
    
    // 分析JSON结构
    const structureInfo = analyzeJsonStructure(parsedJson);
    
    return {
      isValidJson: true,
      jsonContent: JSON.stringify(parsedJson, null, 2), // 格式化后的JSON
      ...structureInfo
    };
  } catch (error) {
    console.error('JSON提取和验证过程错误:', error);
    return {
      isValidJson: false,
      jsonContent: null
    };
  }
}

/**
 * 分析JSON结构，提取关键指标
 * 
 * @param parsedJson 已解析的JSON对象
 * @returns 结构分析结果
 */
export function analyzeJsonStructure(parsedJson: any): {
  cards: number;
  adminInputs: number;
  promptBlocks: number;
  hasGlobalPrompt: boolean;
} {
  try {
    // 分析JSON结构
    let cards = 0;
    let adminInputs = 0;
    let promptBlocks = 0;
    let hasGlobalPrompt = false;
    
    if (parsedJson.cards) {
      cards = parsedJson.cards.length;
      
      // 统计第一张卡片的adminInputs和promptBlocks数量
      if (cards > 0) {
        const firstCard = parsedJson.cards[0];
        adminInputs = firstCard.adminInputs ? Object.keys(firstCard.adminInputs).length : 0;
        promptBlocks = firstCard.promptBlocks ? Object.keys(firstCard.promptBlocks).length : 0;
      }
    } else {
      // 单卡片模式
      adminInputs = parsedJson.adminInputs ? Object.keys(parsedJson.adminInputs).length : 0;
      promptBlocks = parsedJson.promptBlocks ? Object.keys(parsedJson.promptBlocks).length : 0;
    }
    
    // 检查是否有全局提示词
    hasGlobalPrompt = !!parsedJson.globalPromptBlocks;
    
    return {
      cards,
      adminInputs,
      promptBlocks,
      hasGlobalPrompt
    };
  } catch (error) {
    console.error('JSON结构分析失败:', error);
    return {
      cards: 0,
      adminInputs: 0,
      promptBlocks: 0,
      hasGlobalPrompt: false
    };
  }
}

/**
 * 格式化JSON以便展示
 * 
 * @param json JSON字符串或对象
 * @returns 格式化后的JSON字符串
 */
export function formatJson(json: string | object): string {
  try {
    if (typeof json === 'string') {
      // 尝试解析字符串
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } else {
      // 直接格式化对象
      return JSON.stringify(json, null, 2);
    }
  } catch (e) {
    // 如果解析失败，返回原始字符串
    return typeof json === 'string' ? json : JSON.stringify(json);
  }
}

/**
 * 从神谕响应中提取最可能的JSON部分
 * 更宽松的提取，用于尝试恢复错误格式的JSON
 * 
 * @param response 响应文本
 * @returns 可能的JSON部分
 */
export function extractPossibleJson(response: string): string | null {
  try {
    // 尝试几种常见的JSON模式
    const patterns = [
      // 标准的完整JSON对象
      /{[\s\S]*}/,
      // 包含某些关键字的JSON
      /{[\s\S]*(?:"cards"|"adminInputs"|"promptBlocks"|"globalPromptBlocks")[\s\S]*}/,
      // 代码块中的JSON
      /```json\s*([\s\S]*?)\s*```/,
      // Markdown代码块中的JSON
      /```\s*([\s\S]*?)\s*```/
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[0]) {
        return match[0].replace(/```json\s*|\s*```/g, '');
      }
    }
    
    return null;
  } catch (error) {
    console.error('提取可能的JSON失败:', error);
    return null;
  }
}
