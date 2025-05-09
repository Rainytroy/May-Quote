/**
 * May API 服务集成模块
 * 
 * 负责与May系统API服务的实际通信
 */
import { UserInputs, AdminInputs, PromptBlock } from '../types';

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
export class MayAPI {
  private config: MayApiConfig;
  
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
   * 生成API请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
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
    const url = `${this.config.baseUrl}${endpoint}`;
    
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
      const response = await this.fetchApi<{ result: string }>(
        '/shenyu/execute',
        'POST',
        params
      );
      
      return response;
    } catch (error) {
      console.error('执行神谕请求失败:', error);
      throw error;
    }
  }
}

// 导出一个默认配置的MayAPI实例
export const mayApi = new MayAPI({
  baseUrl: 'http://localhost:25050/api'
});
