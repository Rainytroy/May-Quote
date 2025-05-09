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
      
      // 为不同文件生成示例配置
      let mockConfig: SN43ConfigFile;
      
      switch (filename) {
        case 'marketing_assistant.json':
          mockConfig = {
            name: 'marketing_assistant',
            description: '市场营销助手',
            language: 'zh',
            userInputs: {
              inputA1: '产品名称',
              inputA2: '目标市场',
              inputA3: '营销预算'
            },
            adminInputs: {
              inputB1: '关键竞争对手',
              inputB2: '营销策略重点'
            },
            promptBlocks: [
              {
                text: '你是一位经验丰富的市场营销专家。基于以下信息，为{{inputA1}}制定针对{{inputA2}}的营销策略，预算为{{inputA3}}。\n\n重点关注{{inputB2}}，并分析与{{inputB1}}的差异化竞争策略。'
              }
            ],
            version: '1.0.0'
          };
          break;
          
        case 'technical_writing.json':
          mockConfig = {
            name: 'technical_writing',
            description: '技术文档写作',
            language: 'zh',
            userInputs: {
              inputA1: '技术主题',
              inputA2: '目标读者',
              inputA3: '文档类型',
              inputA4: '包含代码示例'
            },
            adminInputs: {
              inputB1: '技术深度',
              inputB2: '格式要求'
            },
            promptBlocks: [
              {
                text: '你是一位技术写作专家。请为{{inputA2}}撰写一份关于{{inputA1}}的{{inputA3}}。\n\n技术深度要求: {{inputB1}}。\n格式要求: {{inputB2}}。\n{{#inputA4}}请包含相关代码示例。{{/inputA4}}'
              }
            ],
            version: '1.0.0'
          };
          break;
          
        case 'storytelling.json':
          mockConfig = {
            name: 'storytelling',
            description: '故事创作助手',
            language: 'zh',
            userInputs: {
              inputA1: '故事类型',
              inputA2: '主角描述',
              inputA3: '故事背景',
              inputA4: '主要冲突'
            },
            adminInputs: {
              inputB1: '故事长度',
              inputB2: '写作风格',
              inputB3: '目标受众'
            },
            promptBlocks: [
              {
                text: '你是一位富有创造力的故事作家。请创作一个{{inputA1}}类型的故事，主角是{{inputA2}}，故事发生在{{inputA3}}，主要冲突是{{inputA4}}。\n\n故事长度：{{inputB1}}。\n写作风格：{{inputB2}}。\n目标受众：{{inputB3}}。'
              }
            ],
            version: '1.0.0'
          };
          break;
          
        default:
          // 默认配置
          mockConfig = {
            name: filename.replace('.json', ''),
            description: `这是${filename}的配置文件描述`,
            language: filename.includes('_zh') ? 'zh' : 'en',
            userInputs: {
              inputA1: '',
              inputA2: ''
            },
            adminInputs: {
              inputB1: '',
              inputB2: ''
            },
            promptBlocks: [
              {
                text: '请根据以下信息提供帮助：\n\n{{inputA1}}\n{{inputA2}}\n\n额外上下文：\n{{inputB1}}\n{{inputB2}}'
              }
            ],
            version: '1.0.0'
          };
      }
      
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
    // 简单实现：提取所有5个字符以上的词
    const text = promptBlocks.map(block => block.text).join(' ');
    const words = text.split(/\s+/);
    return words
      .filter(word => word.length >= 5)
      .slice(0, 10); // 最多10个关键词
  }
  
  /**
   * 生成模拟结果文本
   * @param keywords 关键词列表
   * @returns 生成的文本
   */
  private generateMockResult(keywords: string[]): string {
    if (keywords.length === 0) {
      return '没有足够的信息来生成有意义的结果。';
    }
    
    // 根据关键词生成不同段落
    const paragraphs = [
      `分析表明，${keywords[0] || '该主题'}在当前市场中具有重要地位。`,
      `考虑到${keywords[1] || '现有条件'}，我们需要采取系统性的方法来解决这个问题。`,
      `${keywords[2] || '相关数据'}显示出积极的发展趋势，这表明我们的方向是正确的。`,
      `值得注意的是，${keywords[3] || '关键因素'}可能会对最终结果产生重大影响。`,
      `总的来说，基于${keywords.slice(0, 3).join('、')}等因素的综合分析，我们可以得出以下结论：`,
      `1. 持续关注${keywords[0] || '核心问题'}的发展变化`,
      `2. 加强对${keywords[1] || '重要环节'}的投入`,
      `3. 优化${keywords[2] || '关键流程'}以提高整体效率`
    ];
    
    return paragraphs.join('\n\n');
  }
  
  /**
   * 获取示例历史记录
   * @returns 示例历史记录列表
   */
  private getExampleHistories(): SN43History[] {
    return [
      {
        id: '1',
        timestamp: Date.now() - 3600000, // 1小时前
        userInputs: { inputA1: '市场调研', inputA2: '智能手表' },
        adminInputs: { inputB1: '竞品分析' },
        promptBlocks: [{ text: '分析智能手表市场...' }],
        result: '这是一份市场分析结果...',
        selectedJsonFile: 'marketing_assistant.json'
      },
      {
        id: '2',
        timestamp: Date.now() - 86400000, // 1天前
        userInputs: { inputA1: '技术文档', inputA2: 'React组件' },
        adminInputs: { inputB1: '代码示例' },
        promptBlocks: [{ text: '编写React组件文档...' }],
        result: '这是React组件的文档...',
        selectedJsonFile: 'technical_writing.json'
      },
      {
        id: '3',
        timestamp: Date.now() - 172800000, // 2天前
        userInputs: { inputA1: '故事创作', inputA2: '科幻小说' },
        adminInputs: { inputB1: '未来世界' },
        promptBlocks: [{ text: '创作科幻小说情节...' }],
        result: '这是一个科幻故事...',
        selectedJsonFile: 'storytelling.json'
      }
    ];
  }
}

// 导出API单例
export const sn43API = new SN43API();
