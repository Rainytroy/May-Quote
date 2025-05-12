/**
 * PromptProcessor.test.ts
 * 
 * 对PromptProcessor服务的单元测试
 */

import { 
  processFirstStagePrompt,
  processSecondStagePrompt,
  getDefaultPromptTemplates,
  buildNonJsonEditPrompt,
  validatePromptTemplate
} from '../PromptProcessor';
import { PromptTemplateSet } from '../../types';

describe('PromptProcessor', () => {
  // 基本的占位符替换测试
  describe('processFirstStagePrompt', () => {
    test('应正确替换基本占位符', () => {
      const template = '你好，{#input}！';
      const input = '世界';
      
      const result = processFirstStagePrompt(template, input);
      
      expect(result).toBe('你好，世界！');
    });
    
    test('应处理重复的占位符', () => {
      const template = '{#input}是一个很好的{#input}示例';
      const input = '测试';
      
      const result = processFirstStagePrompt(template, input);
      
      expect(result).toBe('测试是一个很好的测试示例');
    });
    
    test('应安全处理特殊字符', () => {
      const template = '分析{#input}的特点';
      const input = '这个"字符串"有<特殊>符号&还有\'单引号\'';
      
      const result = processFirstStagePrompt(template, input);
      
      expect(result).toContain('这个"字符串"有<特殊>符号');
    });
  });
  
  // 测试默认提示词模板
  describe('getDefaultPromptTemplates', () => {
    test('应返回有效的默认模板数组', () => {
      const templates = getDefaultPromptTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      const defaultTemplate = templates.find(t => t.isDefault === true);
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate).toHaveProperty('id');
      expect(defaultTemplate).toHaveProperty('name');
      expect(defaultTemplate).toHaveProperty('firstStage');
      expect(defaultTemplate).toHaveProperty('secondStage');
    });
  });
  
  // 测试验证提示词模板
  describe('validatePromptTemplate', () => {
    test('应通过验证完整的模板', () => {
      const template: Partial<PromptTemplateSet> = {
        name: '测试模板',
        firstStage: '分析{#input}',
        secondStage: '基于{#promptResults1}，修改{#input}'
      };
      
      const isValid = validatePromptTemplate(template);
      
      expect(isValid).toBe(true);
    });
    
    test('应拒绝缺少必要字段的模板', () => {
      const template: Partial<PromptTemplateSet> = {
        name: '测试模板',
        firstStage: '分析{#input}'
        // 缺少secondStage
      };
      
      const isValid = validatePromptTemplate(template);
      
      expect(isValid).toBe(false);
    });
    
    test('应拒绝缺少必要占位符的模板', () => {
      const template: Partial<PromptTemplateSet> = {
        name: '测试模板',
        firstStage: '分析内容', // 缺少{#input}
        secondStage: '基于{#promptResults1}，修改{#input}'
      };
      
      const isValid = validatePromptTemplate(template);
      
      expect(isValid).toBe(false);
    });
  });
  
  // 测试处理二阶段提示词
  describe('processSecondStagePrompt', () => {
    test('应处理第二阶段提示词并替换所有占位符', () => {
      const template = '基于前一阶段的结果：\n{#promptResults1}\n根据用户的要求：{#input}\n参考原始提示词：{#firstStagePrompt}';
      const firstStagePrompt = '分析数据';
      const firstStageResult = '这是第一阶段的分析结果';
      const userAdjustment = '把结果变得更简短';
      
      const result = processSecondStagePrompt(
        template, 
        firstStagePrompt,
        firstStageResult, 
        userAdjustment
      );
      
      expect(result).toContain('基于前一阶段的结果：');
      expect(result).toContain('这是第一阶段的分析结果');
      expect(result).toContain('把结果变得更简短');
      expect(result).toContain('分析数据');
    });
    
    test('应处理缺少值的情况', () => {
      const template = '基于结果：{#promptResults1}，请修改：{#input}';
      const firstStagePrompt = '';
      const firstStageResult = '';
      const userAdjustment = '改进结果';
      
      const result = processSecondStagePrompt(
        template, 
        firstStagePrompt,
        firstStageResult, 
        userAdjustment
      );
      
      expect(result).toContain('基于结果：，请修改：改进结果');
    });
    
    test('应处理空模板的情况', () => {
      const template = '';
      const firstStagePrompt = '原始提示词';
      const firstStageResult = '第一阶段结果';
      const userAdjustment = '测试输入';
      
      const result = processSecondStagePrompt(
        template, 
        firstStagePrompt,
        firstStageResult, 
        userAdjustment
      );
      
      expect(result).toBe('');
    });
  });
  
  // 测试非JSON编辑提示词
  describe('buildNonJsonEditPrompt', () => {
    test('应生成正确的非JSON编辑提示词', () => {
      const originalContent = '这不是一个有效的JSON格式';
      const editContent = '添加一个cards字段';
      
      const result = buildNonJsonEditPrompt(originalContent, editContent);
      
      expect(result).toContain('这不是一个有效的JSON格式');
      expect(result).toContain('添加一个cards字段');
      expect(result).toContain('"cards": [');
      expect(result).toContain('"adminInputs": {');
    });
  });
});
