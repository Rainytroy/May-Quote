/**
 * May API 服务集成模块
 * 
 * 负责与May系统API服务的实际通信
 * 集成May的配置系统以支持动态API设置
 */
import { UserInputs, AdminInputs, PromptBlock } from '../types';
import { getApiKey, getModel } from '../../../utils/storage';
import { getModelDisplayName } from '../../../utils/model-adapters';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createApiClient } from '../../../services/ai-service';

interface MayApiConfig {
  baseUrl: string;
  apiKey?: string;
}

interface ShenyuInput {
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  id: string;
  label: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

interface ShenyuPrompt {
  text: string;
  template?: string;
}

interface ShenyuGenerateControlsParams {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  controlsTemplate?: string;
}

interface ShenyuExecuteParams {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
  controls?: Record<string, any>;
}

/**
 * MayAPI类
 * 提供与May系统API服务通信的方法
 */
// 确保显式导出MayAPI类以便在其他组件中使用
export class MayAPI {
  // 添加getter方法以支持外部读取配置
  public getApiConfig(): {
    baseUrl: string, 
    apiKey?: string, 
    initialized: boolean,
    modelId?: string,
    modelName?: string
  } {
    // 获取并显示API密钥，确保每次都获取最新值
    const apiKey = getApiKey();
    const maskedKey = apiKey ? '******' + apiKey.slice(-4) : undefined;
    
    // 获取当前使用的模型ID
    const modelId = getModel();
    // 获取模型的显示名称
    const modelName = getModelDisplayName(modelId);
    
    return {
      baseUrl: this.config.baseUrl,
      apiKey: maskedKey, // 使用实时获取的密钥
      initialized: this.initialized,
      modelId, // 添加模型ID
      modelName // 添加模型名称
    };
  }
  private config: MayApiConfig;
  private initialized: boolean = false;
  
  /**
   * 构造函数
   * @param config API配置
   */
  constructor(config: MayApiConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:25050/api',
      apiKey: config.apiKey
    };
  }
  
  /**
   * 初始化API配置
   * 从May的配置加载API密钥等设置
   */
  async initializeFromMayConfig(): Promise<void> {
    try {
      // 从May的存储中读取API密钥 - 使用同步方法
      const apiKey = getApiKey();
      const model = getModel();
      
      if (apiKey) {
        this.config.apiKey = apiKey;
        console.log('已从May配置加载API密钥');
      } else {
        console.warn('未找到May API密钥配置');
      }
      
      console.log('当前选择的模型:', model);
      this.initialized = true;
    } catch (error) {
      console.error('从May配置加载API密钥失败:', error);
    }
  }
  
  /**
   * 确保API已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeFromMayConfig();
    }
  }
  
  /**
   * 生成API请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // 直接从May存储中获取最新的API密钥，而不是使用可能过时的实例变量
    const apiKey = getApiKey();
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('已将API密钥添加到请求头 (长度:', apiKey.length, '字符)');
    } else {
      console.warn('无法添加API密钥到请求头 - 密钥未找到');
    }
    
    return headers;
  }
  
  /**
   * 执行API请求
   * @param endpoint 请求端点
   * @param method 请求方法
   * @param data 请求数据
   * @returns 响应数据
   */
  private async fetchApi<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    // 向May直接传输API请求 - 不再使用/api前缀，直接使用根路径
    // 针对神谕请求，修改为直接向May聊天API发送请求
    const url = `${this.config.baseUrl.replace('/api', '')}${endpoint}`;
    
    console.log('执行API请求:', url);
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
      credentials: 'include' // 包含cookies
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      console.log('API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }
      
      const responseData = await response.json();
      return responseData as T;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }
  
  /**
   * 生成控件
   * 用神谕服务生成交互控件
   * @param params 控件生成参数
   * @returns 生成的控件定义
   */
  async generateControls(params: ShenyuGenerateControlsParams): Promise<ShenyuInput[]> {
    try {
      // 确保API已初始化
      await this.ensureInitialized();
      
      const response = await this.fetchApi<{ controls: ShenyuInput[] }>(
        '/shenyu/generate-controls',
        'POST',
        params
      );
      
      return response.controls;
    } catch (error) {
      console.error('生成控件失败:', error);
      throw error;
    }
  }
  
  /**
   * 读取控件值
   * 从神谕服务获取控件当前值
   * @param controlIds 要读取的控件ID数组
   * @returns 控件值的键值对
   */
  async readControlValues(controlIds: string[]): Promise<Record<string, any>> {
    try {
      // 确保API已初始化
      await this.ensureInitialized();
      
      const response = await this.fetchApi<{ values: Record<string, any> }>(
        '/shenyu/read-controls',
        'POST',
        { controlIds }
      );
      
      return response.values;
    } catch (error) {
      console.error('读取控件值失败:', error);
      throw error;
    }
  }
  
  /**
   * 执行神谕请求
   * 调用原版神谕执行能力
   * @param params 执行参数
   * @returns 执行结果
   */
  async executeShenyuRequest(params: ShenyuExecuteParams): Promise<{ result: string }> {
    try {
      // 确保API已初始化并从May设置获取最新密钥
      await this.ensureInitialized();
      
      // 获取API密钥和模型ID
      const apiKey = getApiKey();
      const modelId = getModel();
      
      // 检查API密钥
      if (!apiKey) {
        console.warn('API密钥未设置，请在May的设置中配置API密钥');
        throw new Error('API密钥未设置');
      }
      
      console.log('尝试执行神谕请求，使用模型:', modelId);
      console.log('参数预览:', JSON.stringify(params).substring(0, 100) + '...');
      
      // 构建OpenAI兼容格式的消息
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: '你是神谕(Shenyu)助手，帮助用户创建Agent。' },
        { role: 'user', content: params.promptBlocks[0].text }
      ];
      
      try {
        // 使用与May相同的方式创建API客户端
        const client = createApiClient(apiKey, modelId);
        
        // 使用OpenAI客户端发送请求
        console.log('使用OpenAI客户端发送请求...');
        const completion = await client.chat.completions.create({
          messages,
          model: modelId,
          temperature: 0.7
        });
        
        const content = completion.choices[0]?.message?.content || '无结果';
        console.log('成功收到AI响应，内容长度:', content.length);
        
        return { result: content };
      } catch (openaiError: any) {
        console.error('OpenAI API请求失败:', openaiError);
        throw openaiError;
      }
    } catch (error) {
      console.error('执行神谕请求失败:', error);
      throw error;
    }
  }
}

// 根据模型ID获取正确的API基础URL - 与ai-service.ts保持一致
const getBaseUrlForModel = (model: string): string => {
  // 官方DeepSeek模型使用官方API
  if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
    return 'https://api.deepseek.com';
  }
  // 默认使用火山引擎API
  return 'https://ark.cn-beijing.volces.com/api/v3';
};

// 创建一个自动初始化的MayAPI实例
const apiInstance = new MayAPI({
  baseUrl: getBaseUrlForModel(getModel()) // 使用正确的外部API URL而不是本地服务器
});

// 用于调试的URL检查
console.log('MayAPI BaseURL:', apiInstance.getApiConfig().baseUrl);

// API设置变化处理函数
const handleStorageChange = async (event: StorageEvent) => {
  // 当API_KEY或MODEL变化时重新初始化
  if (event.key === 'MODEL' || event.key === 'API_KEY') {
    console.log('检测到May API设置变化，正在重新初始化API');
    await apiInstance.initializeFromMayConfig();
    
    // 验证新的API密钥
    const apiKey = getApiKey();
    if (apiKey) {
      console.log('API密钥已更新，新密钥长度:', apiKey.length, '字符');
    } else {
      console.warn('API密钥更新后仍然为空');
    }
  }
};

// 主动刷新API配置
const refreshApiConfig = async () => {
  const beforeKey = apiInstance.getApiConfig().apiKey;
  await apiInstance.initializeFromMayConfig();
  const afterKey = apiInstance.getApiConfig().apiKey;
  
  if (beforeKey !== afterKey) {
    console.log('API配置已更新');
  }
};

// 自动初始化API配置
(async () => {
  try {
    // 初始化API配置，尝试多次
    let initSuccess = false;
    for (let i = 0; i < 3; i++) {
      try {
        await apiInstance.initializeFromMayConfig();
        
        // 验证是否成功获取了API密钥
        const apiKey = getApiKey();
        if (apiKey) {
          console.log('MayAPI成功初始化，API密钥长度:', apiKey.length, '字符');
          initSuccess = true;
          break;
        } else {
          console.warn(`初始化尝试 ${i+1}/3: 未能获取API密钥`);
          // 等待短暂时间再次尝试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`初始化尝试 ${i+1}/3 失败:`, err);
        // 等待短暂时间再次尝试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!initSuccess) {
      console.warn('多次尝试后仍未能成功初始化API密钥');
    }
    
    // 设置storage事件监听器，监听May设置变化
    if (typeof window !== 'undefined') {
      // 移除任何现有监听器，避免重复
      window.removeEventListener('storage', handleStorageChange);
      
      // 添加新的监听器
      window.addEventListener('storage', handleStorageChange);
      console.log('已设置API设置变化监听器');
      
      // 定期重新检查API密钥，以防其变化未被storage事件捕获
      setInterval(() => {
        refreshApiConfig();
      }, 10000); // 每10秒检查一次
    }
  } catch (error) {
    console.error('MayAPI自动初始化失败:', error);
  }
})();

// 导出API实例
export const mayApi = apiInstance;
