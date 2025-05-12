/**
 * ShenyuContext.tsx
 * 
 * 神谕上下文组件，提供神谕功能的全局状态管理和API集成
 * 这是连接May应用和神谕功能的核心桥梁
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePromptTemplates } from '../components/Shenyu/contexts/PromptTemplateContext';
import { ShenyuService, ApiService } from '../components/Shenyu/core/ShenyuCore';
import { ChatMode, ShenyuContextType, ShenyuResponse } from '../components/Shenyu/types';
import { mayApi } from '../components/SN43Demo/api/mayApi';

// 创建神谕上下文
const ShenyuContext = createContext<ShenyuContextType | undefined>(undefined);

// 本地存储键
const MODE_STORAGE_KEY = 'shenyu-chat-mode';

/**
 * 将May API适配为ShenyuService所需的ApiService接口
 */
const mayApiAdapter: ApiService = {
  sendChatRequest: async (params) => {
    // 调用mayApi的executeShenyuRequest方法
    const response = await mayApi.executeShenyuRequest({
      userInputs: {},
      adminInputs: {},
      promptBlocks: [{ text: params.messages[0].content }]
    });
    return response.result;
  },
  getSelectedModel: () => {
    // 从mayApi的配置中获取模型ID
    return mayApi.getApiConfig().modelId || 'deepseek-chat';
  }
};

/**
 * 神谕上下文提供者组件
 */
export const ShenyuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 获取提示词模板上下文
  const { activeTemplate } = usePromptTemplates();
  
  // 创建神谕服务实例
  const shenyuService = new ShenyuService(mayApiAdapter);
  
  // 状态
  const [currentMode, setCurrentMode] = useState<ChatMode>('may');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<ShenyuResponse | null>(null);
  
  // 初始化加载存储的模式
  useEffect(() => {
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY) as ChatMode;
    if (storedMode && (storedMode === 'may' || storedMode === 'shenyu')) {
      setCurrentMode(storedMode);
    }
  }, []);
  
  /**
   * 设置聊天模式
   */
  const setMode = (mode: ChatMode) => {
    setCurrentMode(mode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.error('保存模式失败:', error);
    }
  };
  
  /**
   * 处理神谕请求
   * 
   * @param input 用户输入
   * @returns 神谕响应
   */
  const processShenyuRequest = async (input: string): Promise<ShenyuResponse> => {
    if (!activeTemplate) {
      throw new Error('未选择活动模板');
    }
    
    setIsProcessing(true);
    
    try {
      const response = await shenyuService.processShenyuRequest(
        input,
        activeTemplate
      );
      
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('处理神谕请求失败:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * 处理修改请求
   * 
   * @param originalContent 原始内容
   * @param editContent 编辑内容
   * @returns 神谕响应
   */
  const processEditRequest = async (
    originalContent: string,
    editContent: string,
    originalUserInput: string = '',
    isValidJson: boolean = true
  ): Promise<ShenyuResponse> => {
    if (!activeTemplate) {
      throw new Error('未选择活动模板');
    }
    
    setIsProcessing(true);
    
    try {
      const response = await shenyuService.processEditRequest(
        originalContent,
        editContent,
        originalUserInput,
        activeTemplate,
        isValidJson
      );
      
      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('处理修改请求失败:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 上下文值
  const contextValue: ShenyuContextType = {
    currentMode,
    isProcessing,
    lastResponse,
    setMode,
    processShenyuRequest,
    processEditRequest,
    activeTemplate
  };
  
  return (
    <ShenyuContext.Provider value={contextValue}>
      {children}
    </ShenyuContext.Provider>
  );
};

/**
 * 使用神谕上下文的Hook
 */
export const useShenyu = (): ShenyuContextType => {
  const context = useContext(ShenyuContext);
  if (!context) {
    throw new Error('useShenyu必须在ShenyuProvider内使用');
  }
  return context;
};
