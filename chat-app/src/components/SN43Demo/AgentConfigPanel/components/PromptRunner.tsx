import React, { useCallback } from 'react';
import { ShenyuChatInterfaceHandle } from '../../Chat/ShenyuChatInterface';
import { mayApi } from '../../api/mayApi';
import { PromptBlock } from '../../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface PromptRunnerProps {
  chatInterfaceRef: React.RefObject<ShenyuChatInterfaceHandle>;
  agentName: string;
  promptBlocks: PromptBlock[];
  controlValues: Record<string, any>;
  userMessages: Message[];
}

/**
 * usePromptRunner Hook
 * 
 * 负责处理提示词块的运行逻辑，替换占位符，与API交互
 */
export const usePromptRunner = ({
  chatInterfaceRef,
  agentName,
  promptBlocks,
  controlValues,
  userMessages
}: PromptRunnerProps) => {
  // 替换提示词中的占位符
  const replacePromptPlaceholders = useCallback((text: string, userInput: string) => {
    let result = text;
    
    // 替换基本输入
    result = result.replace(/\{#input\}/g, userInput);
    
    // 替换控件输入值
    Object.entries(controlValues).forEach(([key, value]) => {
      // 替换格式例如 {#inputB1} 中的B1对应控件ID
      const placeholder = `{#input${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
    
    console.log('[PromptRunner] 替换占位符:', {
      原文长度: text.length,
      替换后长度: result.length,
      替换数量: (text.match(/\{#input.*?\}/g) || []).length
    });
    
    return result;
  }, [controlValues]);
  
  // 运行Agent - 依次执行promptBlocks，替换占位符
  const runAgent = useCallback(async () => {
    // 检查是否有提示词块
    if (promptBlocks.length === 0) {
      console.warn('[PromptRunner] 无法运行Agent: 没有提示词块');
      return false;
    }
    
    console.log('[PromptRunner] 开始运行Agent:', {
      agentName,
      promptBlocksCount: promptBlocks.length
    });
    
    try {
      // 首先发送一条用户消息，内容为"运行：[Agent名称]"
      const runMessageId = await chatInterfaceRef.current?.handleSubmit(`运行：${agentName}`);
      
      if (!runMessageId) {
        console.error('[PromptRunner] 发送运行消息失败');
        return false;
      }
      
      // 依次运行每个promptBlock
      console.log('[PromptRunner] 开始依次运行提示词块...');
      
      // 创建一个包含上下文的数组
      const messageHistory: { role: 'user' | 'assistant', content: string }[] = [
        { role: 'user', content: `运行：${agentName}` }
      ];
      
      // 假设第一条消息包含了用户的原始需求
      const userInput = userMessages.length > 0 && userMessages[0].role === 'user' 
        ? userMessages[0].content 
        : agentName;
      
      // 依次运行每个promptBlock
      for (let i = 0; i < promptBlocks.length; i++) {
        const originalBlock = promptBlocks[i];
        console.log(`[PromptRunner] 运行第 ${i+1}/${promptBlocks.length} 个提示词块`);
        
        // 替换提示词中的占位符
        const processedText = replacePromptPlaceholders(originalBlock.text, userInput);
        
        // 添加处理后的提示词作为用户消息，但不显示在UI中
        messageHistory.push({ role: 'user', content: processedText });
        
        // 显示AI响应（不显示用户消息）
        const aiMessageId = await chatInterfaceRef.current?.handleSubmit(processedText, true);
        
        if (!aiMessageId) {
          console.error(`[PromptRunner] 为提示词块 ${i+1} 创建消息ID失败`);
          continue;
        }
        
        try {
          // 调用May的常规对话API，使用累积的对话历史
          const response = await (mayApi as any).sendChatMessage({
            messages: messageHistory,
            stream: false
          });
          
          // 更新对话历史
          const aiResponse = typeof response === 'string' 
            ? response 
            : response.content || '未能获取有效响应';
            
          messageHistory.push({ role: 'assistant', content: aiResponse });
          
          // 更新消息UI - 显示为普通文本而不是JSON
          if (chatInterfaceRef.current) {
            chatInterfaceRef.current.updateAiMessage(
              aiMessageId, 
              aiResponse, // 显示文本内容，不是JSON
              aiResponse, // 原始响应也是文本
              "May the 神谕 be with you" // 自定义发送者名称
            );
          }
          
          // 添加短暂延迟，使执行看起来更自然
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`[PromptRunner] 运行提示词块 ${i+1} 时出错:`, error);
          if (chatInterfaceRef.current) {
            chatInterfaceRef.current.updateAiMessage(
              aiMessageId,
              `运行错误: ${error instanceof Error ? error.message : '未知错误'}`,
              `运行错误: ${error instanceof Error ? error.message : '未知错误'}`,
              "May the 神谕 be with you"
            );
          }
        }
      }
      
      console.log('[PromptRunner] 所有提示词块运行完毕');
      return true;
    } catch (error) {
      console.error('[PromptRunner] 运行Agent时发生错误:', error);
      return false;
    }
  }, [agentName, promptBlocks, chatInterfaceRef, replacePromptPlaceholders, userMessages]);

  return { runAgent };
};

/**
 * React 组件封装 - 提供一个组件化的方式使用此钩子
 */
const PromptRunner: React.FC<PromptRunnerProps> = (props) => {
  // 仅返回null，不渲染任何内容，因为这只是一个逻辑组件
  return null;
};

export default PromptRunner;
