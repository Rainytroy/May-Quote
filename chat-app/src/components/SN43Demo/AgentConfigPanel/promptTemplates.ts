/**
 * 神谕 Agent 生成器使用的提示词模板
 */

// 导入各个模板
import { ORIGINAL_FIRST_STAGE_TEMPLATE } from './promptTemplate-original-first';
import { ORIGINAL_SECOND_STAGE_TEMPLATE } from './promptTemplate-original-second';
import { ADVANCED_FIRST_STAGE_TEMPLATE } from './promptTemplate-advanced-first';
import { ADVANCED_SECOND_STAGE_TEMPLATE } from './promptTemplate-advanced-second';
import { ITERATION2_FIRST_STAGE_TEMPLATE } from './promptTemplate-iteration2-first';
import { ITERATION2_SECOND_STAGE_TEMPLATE } from './promptTemplate-iteration2-second';

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
  switch (type) {
    case TemplateType.ORIGINAL:
      return ORIGINAL_FIRST_STAGE_TEMPLATE;
    case TemplateType.ADVANCED:
      return ADVANCED_FIRST_STAGE_TEMPLATE;
    case TemplateType.ITERATION_2:
      return ITERATION2_FIRST_STAGE_TEMPLATE;
    default:
      return ORIGINAL_FIRST_STAGE_TEMPLATE;
  }
}

/**
 * 获取默认的第二阶段提示词模板
 */
export function getDefaultSecondStagePrompt(type: TemplateType = TemplateType.ORIGINAL): string {
  switch (type) {
    case TemplateType.ORIGINAL:
      return ORIGINAL_SECOND_STAGE_TEMPLATE;
    case TemplateType.ADVANCED:
      return ADVANCED_SECOND_STAGE_TEMPLATE;
    case TemplateType.ITERATION_2:
      return ITERATION2_SECOND_STAGE_TEMPLATE;
    default:
      return ORIGINAL_SECOND_STAGE_TEMPLATE;
  }
}
