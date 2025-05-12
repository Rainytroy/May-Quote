/**
 * 神谕 Agent 生成器使用的提示词模板
 */

// 导入模板数据
import templateData from './promptTemplates.json';

/**
 * 常量定义默认模板类型
 */
export enum TemplateType {
  ORIGINAL = 'original',
  ADVANCED = 'advanced',
  ITERATION_2 = 'iteration_2'
}

/**
 * 获取默认的第一阶段提示词模板
 */
export function getDefaultFirstStagePrompt(type: TemplateType = TemplateType.ORIGINAL): string {
  // 使用TypeScript断言确保类型安全
  const templates = templateData as Record<string, { firstStage: string, secondStage: string }>;
  return templates[type].firstStage;
}

/**
 * 获取默认的第二阶段提示词模板
 */
export function getDefaultSecondStagePrompt(type: TemplateType = TemplateType.ORIGINAL): string {
  // 使用TypeScript断言确保类型安全
  const templates = templateData as Record<string, { firstStage: string, secondStage: string }>;
  return templates[type].secondStage;
}
