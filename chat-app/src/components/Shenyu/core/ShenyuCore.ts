/**
 * ShenyuCore.ts
 * 
 * 神谕核心服务，整合JSON提取和提示词处理服务，提供统一接口
 * 处理API调用、响应处理和完整的神谕功能流程
 */

import { ShenyuResponse, PromptTemplateSet } from '../types';
import { extractAndValidateJson, analyzeJsonStructure } from './JsonExtractor';
import { 
  processFirstStagePrompt, 
  processSecondStagePrompt, 
  buildNonJsonEditPrompt 
} from './PromptProcessor';

/**
 * API服务接口，实际使用May的API服务
 * 这是一个抽象接口，以保持与May的低耦合
 */
export interface ApiService {
  sendChatRequest: (params: any) => Promise<string>;
  getSelectedModel: () => string;
}

/**
 * 神谕核心服务类
 */
export class ShenyuService {
  private api: ApiService;
  
  /**
   * 构造函数
   * @param api May的API服务
   */
  constructor(api: ApiService) {
    this.api = api;
  }
  
  /**
   * 处理初始神谕请求
   * 
   * @param userInput 用户输入
   * @param activeTemplate 当前激活的模板
   * @returns 处理结果
   */
  async processShenyuRequest(
    userInput: string,
    activeTemplate: PromptTemplateSet
  ): Promise<ShenyuResponse> {
    try {
      // 构建提示词
      const prompt = processFirstStagePrompt(
        activeTemplate.firstStage,
        userInput
      );
      
      // 调用API
      const response = await this.api.sendChatRequest({
        messages: [{ role: 'user', content: prompt }],
        model: this.api.getSelectedModel(),
      });
      
      // 从响应中提取和验证JSON
      const jsonInfo = extractAndValidateJson(response);
      
      // 返回完整响应
      return {
        ...jsonInfo,
        rawResponse: response,
        templateName: activeTemplate.name,
      };
    } catch (error) {
      console.error('处理神谕请求失败:', error);
      
      // 返回错误响应
      return {
        isValidJson: false,
        jsonContent: null,
        rawResponse: `处理请求时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        templateName: activeTemplate?.name || '未知模板',
      };
    }
  }
  
  /**
   * 处理神谕修改请求
   * 
   * @param originalContent 原始响应内容
   * @param editContent 修改内容
   * @param userInput 原始用户输入
   * @param activeTemplate 当前激活的模板
   * @param isOriginalValidJson 原始响应是否为有效JSON
   * @returns 处理结果
   */
  async processEditRequest(
    originalContent: string,
    editContent: string,
    userInput: string,
    activeTemplate: PromptTemplateSet,
    isOriginalValidJson: boolean = true
  ): Promise<ShenyuResponse> {
    try {
      let prompt: string;
      
      if (isOriginalValidJson) {
        // 使用标准第二阶段提示词
        const firstStagePrompt = processFirstStagePrompt(
          activeTemplate.firstStage,
          userInput
        );
        
        prompt = processSecondStagePrompt(
          activeTemplate.secondStage,
          firstStagePrompt,
          originalContent,
          editContent
        );
      } else {
        // 使用特殊的非JSON修改提示词
        prompt = buildNonJsonEditPrompt(originalContent, editContent);
      }
      
      // 调用API
      const response = await this.api.sendChatRequest({
        messages: [{ role: 'user', content: prompt }],
        model: this.api.getSelectedModel(),
      });
      
      // 从响应中提取和验证JSON
      const jsonInfo = extractAndValidateJson(response);
      
      // 返回完整响应
      return {
        ...jsonInfo,
        rawResponse: response,
        templateName: activeTemplate.name,
      };
    } catch (error) {
      console.error('处理神谕修改请求失败:', error);
      
      // 返回错误响应
      return {
        isValidJson: false,
        jsonContent: null,
        rawResponse: `处理修改请求时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        templateName: activeTemplate?.name || '未知模板',
      };
    }
  }
  
  /**
   * 日志记录函数
   * 
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logPrefix = '[ShenyuCore]';
    
    switch (level) {
      case 'info':
        console.log(`${logPrefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${logPrefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${logPrefix} ${message}`, data || '');
        break;
    }
  }
}
