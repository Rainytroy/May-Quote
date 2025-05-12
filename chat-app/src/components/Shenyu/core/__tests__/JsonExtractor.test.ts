/**
 * JsonExtractor.test.ts
 * 
 * 对JsonExtractor服务的单元测试
 */

import { 
  extractAndValidateJson, 
  analyzeJsonStructure, 
  formatJson,
  extractPossibleJson
} from '../JsonExtractor';

describe('JsonExtractor', () => {
  // 测试从AI响应中提取和验证JSON
  describe('extractAndValidateJson', () => {
    // 正常情况 - 多卡片格式
    test('应成功提取和验证多卡片格式的有效JSON', () => {
      const response = `
        好的，以下是多卡片格式的JSON：
        
        {
          "cards": [
            {
              "id": "card1",
              "title": "基础分析",
              "adminInputs": {
                "inputB1": "分析维度 <def>用户体验</def>"
              },
              "promptBlocks": {
                "promptBlock1": "分析{#input}的{#inputB1}，提供详细的见解。"
              }
            }
          ],
          "globalPromptBlocks": {
            "promptBlockFinal": "综合所有卡片的分析结果，给出整体评估。"
          }
        }
        
        希望这个结构符合您的要求！
      `;
      
      const result = extractAndValidateJson(response);
      
      expect(result.isValidJson).toBe(true);
      expect(result.cards).toBe(1);
      expect(result.hasGlobalPrompt).toBe(true);
      expect(result.jsonContent).toContain("基础分析");
    });
    
    // 正常情况 - 单卡片格式
    test('应成功提取和验证单卡片格式的有效JSON', () => {
      const response = `
        {
          "adminInputs": {
            "inputB1": "输入描述 <def>默认值</def>"
          },
          "promptBlocks": {
            "promptBlock1": "使用{#input}和{#inputB1}生成内容"
          }
        }
      `;
      
      const result = extractAndValidateJson(response);
      
      expect(result.isValidJson).toBe(true);
      expect(result.adminInputs).toBe(1);
      expect(result.promptBlocks).toBe(1);
      expect(result.cards).toBe(0);
    });
    
    // 边缘情况 - 无效的JSON格式
    test('应正确处理格式不正确的JSON', () => {
      const response = `
        这是一个无效的JSON:
        {
          "adminInputs": {
            "inputB1": "输入描述 <def>默认值</def>",
          }, // 注意这里有多余的逗号
          "promptBlocks": {
            "promptBlock1": "使用{#input}和{#inputB1}生成内容"
          }
        }
      `;
      
      const result = extractAndValidateJson(response);
      
      expect(result.isValidJson).toBe(false);
      expect(result.jsonContent).not.toBeNull();
    });
    
    // 边缘情况 - 没有JSON结构
    test('应正确处理不包含JSON的响应', () => {
      const response = "这是一个纯文本响应，没有任何JSON结构。";
      
      const result = extractAndValidateJson(response);
      
      expect(result.isValidJson).toBe(false);
      expect(result.jsonContent).toBeNull();
    });
    
    // 边缘情况 - 不符合要求的JSON结构
    test('应正确处理不符合神谕格式要求的JSON', () => {
      const response = `
        {
          "unrelatedField": "这不是神谕格式",
          "someOtherData": 123
        }
      `;
      
      const result = extractAndValidateJson(response);
      
      expect(result.isValidJson).toBe(false);
    });
  });
  
  // 测试JSON结构分析
  describe('analyzeJsonStructure', () => {
    test('应正确分析多卡片结构', () => {
      const json = {
        cards: [
          {
            id: 'card1',
            title: '测试卡片',
            adminInputs: { input1: '测试1', input2: '测试2' },
            promptBlocks: { block1: '内容1', block2: '内容2', block3: '内容3' }
          },
          {
            id: 'card2',
            title: '测试卡片2',
            adminInputs: { input3: '测试3' },
            promptBlocks: { block4: '内容4' }
          }
        ],
        globalPromptBlocks: {
          finalBlock: '全局内容'
        }
      };
      
      const result = analyzeJsonStructure(json);
      
      expect(result.cards).toBe(2);
      expect(result.adminInputs).toBe(2); // 取第一张卡的数量
      expect(result.promptBlocks).toBe(3); // 取第一张卡的数量
      expect(result.hasGlobalPrompt).toBe(true);
    });
    
    test('应正确分析单卡片结构', () => {
      const json = {
        adminInputs: { 
          input1: '测试1', 
          input2: '测试2',
          input3: '测试3'
        },
        promptBlocks: { 
          block1: '内容1', 
          block2: '内容2'
        }
      };
      
      const result = analyzeJsonStructure(json);
      
      expect(result.cards).toBe(0);
      expect(result.adminInputs).toBe(3);
      expect(result.promptBlocks).toBe(2);
      expect(result.hasGlobalPrompt).toBe(false);
    });
    
    test('应安全处理异常结构', () => {
      const json = {}; // 空对象
      
      const result = analyzeJsonStructure(json);
      
      expect(result.cards).toBe(0);
      expect(result.adminInputs).toBe(0);
      expect(result.promptBlocks).toBe(0);
      expect(result.hasGlobalPrompt).toBe(false);
    });
  });
  
  // 测试JSON格式化
  describe('formatJson', () => {
    test('应正确格式化JSON字符串', () => {
      const jsonStr = '{"key1":"value1","key2":{"nested":"value2"}}';
      
      const formatted = formatJson(jsonStr);
      
      expect(formatted).toContain('\n'); // 应该有换行符
      expect(formatted).toContain('  "key2"'); // 应该有缩进
    });
    
    test('应正确格式化JSON对象', () => {
      const jsonObj = { key1: 'value1', key2: { nested: 'value2' } };
      
      const formatted = formatJson(jsonObj);
      
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  "key2"');
    });
    
    test('应安全处理无效的JSON字符串', () => {
      const invalidJson = '{"key1": value1}'; // 缺少引号的无效JSON
      
      const result = formatJson(invalidJson);
      
      expect(result).toBe(invalidJson); // 返回原始字符串
    });
  });
  
  // 测试可能的JSON提取
  describe('extractPossibleJson', () => {
    test('应从代码块中提取JSON', () => {
      const response = '```json\n{"key": "value"}\n```';
      
      const result = extractPossibleJson(response);
      
      expect(result).toBe('{"key": "value"}');
    });
    
    test('应从文本中提取JSON对象', () => {
      const response = '前面的文本 {"key": "value"} 后面的文本';
      
      const result = extractPossibleJson(response);
      
      expect(result).toContain('{"key": "value"}');
    });
    
    test('应返回null当没有JSON时', () => {
      const response = '这里没有任何JSON结构';
      
      const result = extractPossibleJson(response);
      
      expect(result).toBeNull();
    });
  });
});
