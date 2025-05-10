/**
 * SN43Demo API服务
 * 
 * 负责处理SN43Demo与May系统及AI服务的通信
 */

import { AdminInputs, UserInputs, PromptBlock, SN43ConfigFile, SN43History } from '../types';

/**
 * API响应接口
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 执行请求接口
 */
interface ExecuteRequest {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
  configFile?: string;
}

/**
 * 执行响应接口
 */
interface ExecuteResponse {
  result: string;
  timestamp: number;
  executionId: string;
}

/**
 * 模拟请求延迟
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * SN43API类
 * 提供与May系统和AI服务通信的方法
 */
export class SN43API {
  private baseUrl: string;
  private storageKey: string;
  
  /**
   * 构造函数
   * @param baseUrl API基础URL
   * @param storageKey 本地存储键名
   */
  constructor(baseUrl = '/api', storageKey = 'sn43-data') {
    this.baseUrl = baseUrl;
    this.storageKey = storageKey;
  }
  
  /**
   * 执行SN43请求
   * @param request 执行请求数据
   * @returns 执行结果
   */
  async execute(request: ExecuteRequest): Promise<ApiResponse<ExecuteResponse>> {
    try {
      // TODO: 与实际API集成
      // 这里是模拟实现
      console.log('执行SN43请求:', request);
      
      // 模拟网络延迟
      await delay(2000);
      
      // 从提示词中提取关键词作为示例响应
      const keywords = this.extractKeywords(request.promptBlocks);
      const userInputStr = Object.entries(request.userInputs)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      // 构造模拟响应
      const mockResult = `## SN43执行结果

基于您的输入:
${userInputStr}

分析结果:
${this.generateMockResult(keywords)}
`;

      // 返回成功响应
      return {
        success: true,
        data: {
          result: mockResult,
          timestamp: Date.now(),
          executionId: `exec-${Date.now()}`
        }
      };
    } catch (error) {
      console.error('执行SN43请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 加载配置文件列表
   * @returns 配置文件名称列表
   */
  async loadConfigFiles(): Promise<ApiResponse<string[]>> {
    try {
      // TODO: 与实际API集成
      // 这里是模拟实现
      console.log('加载配置文件列表');
      
      // 模拟网络延迟
      await delay(500);
      
      // 模拟配置文件列表
      const mockFiles = [
        'default_zh.json',
        'default_en.json',
        'marketing_assistant.json',
        'technical_writing.json',
        'storytelling.json'
      ];
      
      return {
        success: true,
        data: mockFiles
      };
    } catch (error) {
      console.error('加载配置文件列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 加载配置文件内容
   * @param filename 文件名
   * @returns 配置文件内容
   */
  async loadConfigFile(filename: string): Promise<ApiResponse<SN43ConfigFile>> {
    try {
      // TODO: 与实际API集成
      // 这里是模拟实现
      console.log('加载配置文件:', filename);
      
      // 模拟网络延迟
      await delay(300);
      
      // 生成符合新卡片结构的配置
      const mockConfig: SN43ConfigFile = {
        name: filename.replace('.json', ''),
        description: `${filename}配置文件`,
        language: filename.includes('_zh') ? 'zh' : 'en',
        // 使用统一的cards结构
        cards: [
          {
            id: 'card1',
            title: '基础卡片',
            adminInputs: {
              inputB1: '输入参数1 <def>默认值1</def>',
              inputB2: '输入参数2 <def>默认值2</def>'
            },
            promptBlocks: {
              promptBlock1: '基于{#inputB1}提供相关信息',
              promptBlock2: '根据{#promptBlock1}和{#inputB2}提供更多分析'
            }
          }
        ],
        version: '1.0.0'
      };
      
      return {
        success: true,
        data: mockConfig
      };
    } catch (error) {
      console.error('加载配置文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 保存配置文件
   * @param filename 文件名
   * @param config 配置内容
   * @returns 保存结果
   */
  async saveConfigFile(filename: string, config: SN43ConfigFile): Promise<ApiResponse<boolean>> {
    try {
      // TODO: 与实际API集成
      // 这里是模拟实现
      console.log('保存配置文件:', filename, config);
      
      // 模拟网络延迟
      await delay(500);
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('保存配置文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 加载历史记录
   * @returns 历史记录列表
   */
  async loadHistories(): Promise<ApiResponse<SN43History[]>> {
    try {
      // TODO: 与实际API集成
      // 这里尝试从localStorage加载
      console.log('加载历史记录');
      
      let histories: SN43History[] = [];
      
      // 尝试从localStorage获取
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed.histories)) {
            histories = parsed.histories;
          }
        } catch (e) {
          console.error('解析历史记录失败:', e);
        }
      }
      
      // 如果没有历史记录，创建一些示例记录
      if (histories.length === 0) {
        histories = this.getExampleHistories();
      }
      
      return {
        success: true,
        data: histories
      };
    } catch (error) {
      console.error('加载历史记录失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 保存历史记录
   * @param history 历史记录
   * @returns 保存结果
   */
  async saveHistory(history: SN43History): Promise<ApiResponse<SN43History>> {
    try {
      // TODO: 与实际API集成
      // 这里使用localStorage
      console.log('保存历史记录:', history);
      
      // 获取现有历史记录
      const result = await this.loadHistories();
      let histories = result.success && result.data ? result.data : [];
      
      // 检查是否已存在相同ID的历史记录
      const index = histories.findIndex(h => h.id === history.id);
      
      if (index !== -1) {
        // 更新现有历史记录
        histories[index] = { ...history, timestamp: Date.now() }; // 更新时间戳
      } else {
        // 创建新历史记录
        const newHistory = { ...history, id: Date.now().toString(), timestamp: Date.now() };
        histories = [newHistory, ...histories];
        history = newHistory; // 返回新ID
      }
      
      // 保存到localStorage
      localStorage.setItem(this.storageKey, JSON.stringify({ histories }));
      
      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error('保存历史记录失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 删除历史记录
   * @param id 历史记录ID
   * @returns 删除结果
   */
  async deleteHistory(id: string): Promise<ApiResponse<boolean>> {
    try {
      // TODO: 与实际API集成
      // 这里使用localStorage
      console.log('删除历史记录:', id);
      
      // 获取现有历史记录
      const result = await this.loadHistories();
      let histories = result.success && result.data ? result.data : [];
      
      // 过滤掉要删除的历史记录
      histories = histories.filter(h => h.id !== id);
      
      // 保存到localStorage
      localStorage.setItem(this.storageKey, JSON.stringify({ histories }));
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 从提示词中提取关键词
   * @param promptBlocks 提示词块
   * @returns 关键词列表
   */
  private extractKeywords(promptBlocks: PromptBlock[]): string[] {
    const text = promptBlocks.map(block => block.text).join(' ');
    const words = text.split(/\s+/);
    return words
      .filter(word => word.length >= 3)
      .slice(0, 5);
  }
  
  /**
   * 生成模拟结果文本
   * @param keywords 关键词列表
   * @returns 生成的文本
   */
  private generateMockResult(keywords: string[]): string {
    return '模拟API返回结果 - 实际开发中将连接真实API';
  }
  
  /**
   * 获取示例历史记录
   * @returns 示例历史记录列表
   */
  private getExampleHistories(): SN43History[] {
    return [];
  }
}

// 导出API单例
export const sn43API = new SN43API();
