import { useCallback } from 'react';
import { ShenyuChatInterfaceHandle } from '../../Chat/ShenyuChatInterface';
import { mayApi } from '../../api/mayApi';
import { PromptBlock } from '../../types';
import { createApiClient } from '../../../../services/ai-service';
import { getApiKey, getModel } from '../../../../utils/storage';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface UsePromptRunnerParams {
  chatInterfaceRef: React.RefObject<ShenyuChatInterfaceHandle | null>;
  agentName: string;
  promptBlocks: PromptBlock[];
  controlValues: Record<string, any>;
  userMessages: Message[];
}

/**
 * 提示词运行器Hook
 * 
 * 负责处理提示词块的运行逻辑，替换占位符，与API交互
 */
export const usePromptRunner = ({
  chatInterfaceRef,
  agentName,
  promptBlocks,
  controlValues,
  userMessages
}: UsePromptRunnerParams) => {
  // 替换提示词中的占位符
  const replacePromptPlaceholders = useCallback((text: string, userInput: string) => {
    console.log(`[PromptRunner] 开始替换占位符, 原始文本长度: ${text.length}字符`);
    console.log(`[PromptRunner] 当前控件值:`, controlValues);
    let result = text;
    
    // 替换基本输入
    const basicInputCount = (text.match(/\{#input\}/g) || []).length;
    result = result.replace(/\{#input\}/g, userInput);
    console.log(`[PromptRunner] 替换基本输入 {#input} => ${userInput.substring(0, 20)}... (${basicInputCount}处)`);
    
    // 检查是否有占位符需要替换
    const placeholderMatches = text.match(/\{#input.*?\}/g) || [];
    console.log(`[PromptRunner] 发现占位符: ${placeholderMatches.length}个:`, placeholderMatches);
    
    // 替换控件输入值
    Object.entries(controlValues).forEach(([key, value]) => {
      // 替换格式例如 {#inputB1} 中的B1对应控件ID
      const placeholder = `{#input${key}}`;
      const pattern = new RegExp(placeholder, 'g');
      const matchesCount = (result.match(pattern) || []).length;
      
      if (matchesCount > 0) {
        const oldResult = result;
        result = result.replace(pattern, String(value || ''));
        console.log(`[PromptRunner] 替换控件输入 ${placeholder} => ${String(value || '').substring(0, 20)}... (${matchesCount}处)`);
        console.log(`[PromptRunner] 替换前片段: ${oldResult.substring(Math.max(0, oldResult.indexOf(placeholder) - 20), oldResult.indexOf(placeholder) + placeholder.length + 20)}`);
        console.log(`[PromptRunner] 替换后片段: ${result.substring(Math.max(0, oldResult.indexOf(placeholder) - 20), Math.min(result.length, oldResult.indexOf(placeholder) + String(value || '').length + 20))}`);
      } else {
        console.log(`[PromptRunner] 未找到占位符 ${placeholder}`);
      }
    });
    
    // 检查是否还有未替换的占位符
    const remainingPlaceholders = result.match(/\{#input.*?\}/g) || [];
    if (remainingPlaceholders.length > 0) {
      console.warn(`[PromptRunner] 警告: 仍有${remainingPlaceholders.length}个占位符未替换:`, remainingPlaceholders);
    }
    
    console.log('[PromptRunner] 替换占位符完成:', {
      原文长度: text.length,
      替换后长度: result.length,
      原始占位符数量: placeholderMatches.length,
      剩余占位符数量: remainingPlaceholders.length
    });
    
    return result;
  }, [controlValues]);
  
  // 直接使用API客户端发送聊天消息
  const sendChatDirectly = useCallback(async (messages: { role: 'user' | 'assistant' | 'system', content: string }[]) => {
    console.log(`[PromptRunner] 开始直接发送聊天请求，消息数量: ${messages.length}`);
    
    // 获取API密钥和模型ID
    const apiKey = getApiKey();
    const modelId = getModel();
      
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }
    
    console.log(`[PromptRunner] 使用模型: ${modelId}, API密钥长度: ${apiKey.length}`);
    
    // 创建客户端并发送请求
    const startTime = Date.now();
    console.log(`[PromptRunner] 创建API客户端...`);
    const client = createApiClient(apiKey, modelId);
    
    // 转换为OpenAI格式的消息
    const openAIMessages = messages as ChatCompletionMessageParam[];
    
    console.log(`[PromptRunner] 发送聊天请求, 消息预览:`, 
      openAIMessages.map(m => {
        const contentPreview = typeof m.content === 'string' 
          ? m.content.substring(0, 20) + '...'
          : '[非文本内容]';
        return `${m.role}: ${contentPreview}`;
      }));
    
    // 发送请求并获取响应
    const completion = await client.chat.completions.create({
      messages: openAIMessages,
      model: modelId,
      temperature: 0.7
    });
    
    const endTime = Date.now();
    const content = completion.choices[0]?.message?.content || '无结果';
    
    console.log(`[PromptRunner] 收到AI响应, 耗时: ${endTime - startTime}ms, 内容长度: ${content.length}`);
    console.log(`[PromptRunner] 响应预览: ${content.substring(0, 50)}...`);
    
    return {
      content,
      finishReason: completion.choices[0]?.finish_reason || 'stop'
    };
  }, []);
  
  // 运行Agent - 依次执行promptBlocks，替换占位符
  const runAgent = useCallback(async () => {
    console.log('\n====================================');
    console.log(`[PromptRunner] 开始运行Agent: ${agentName}`);
    console.log('====================================\n');
    
    // 检查是否有提示词块
    if (promptBlocks.length === 0) {
      console.warn('[PromptRunner] 无法运行Agent: 没有提示词块');
      return false;
    }
    
    console.log(`[PromptRunner] 提示词块数量: ${promptBlocks.length}`);
    
    try {
      // 首先发送一条用户消息，内容为"运行：[Agent名称]"
      console.log(`[PromptRunner] 发送初始化消息: 运行：${agentName}`);
      const runMessageId = await chatInterfaceRef.current?.handleSubmit(`运行：${agentName}`);
      
      if (!runMessageId) {
        console.error('[PromptRunner] 发送运行消息失败, chatInterfaceRef可能未初始化');
        return false;
      }
      
      console.log(`[PromptRunner] 成功创建消息，ID: ${runMessageId}`);
      
      // 依次运行每个promptBlock
      console.log('[PromptRunner] 开始依次运行提示词块...');
      
      // 创建一个包含上下文的数组
      const messageHistory: { role: 'user' | 'assistant' | 'system', content: string }[] = [
        { role: 'system', content: `你是神谕(Shenyu)助手，正在协助运行Agent: ${agentName}` },
        { role: 'user', content: `运行：${agentName}` }
      ];
      
      // 假设第一条消息包含了用户的原始需求
      const userInput = userMessages.length > 0 && userMessages[0].role === 'user' 
        ? userMessages[0].content 
        : agentName;
      
      console.log(`[PromptRunner] 用户原始输入: ${userInput.substring(0, 50)}...`);
      console.log(`[PromptRunner] 开始循环执行提示词块，总数: ${promptBlocks.length}`);
      
      // 依次运行每个promptBlock
      for (let i = 0; i < promptBlocks.length; i++) {
        console.log(`\n===== 提示词块 ${i+1}/${promptBlocks.length} =====`);
        
        const startTime = Date.now();
        const originalBlock = promptBlocks[i];
        
        console.log(`[PromptRunner] 原始提示词块 ${i+1} (${originalBlock.text.length}字符):`);
        console.log(originalBlock.text.substring(0, 100) + (originalBlock.text.length > 100 ? '...' : ''));
        
        // 替换提示词中的占位符
        const processedText = replacePromptPlaceholders(originalBlock.text, userInput);
        
        console.log(`[PromptRunner] 替换后提示词块 ${i+1} (${processedText.length}字符):`);
        console.log(processedText.substring(0, 100) + (processedText.length > 100 ? '...' : ''));
        
        // 添加处理后的提示词作为用户消息，但不显示在UI中
        messageHistory.push({ role: 'user', content: processedText });
        
        // 创建AI响应消息（不显示用户提示词）
        console.log(`[PromptRunner] 创建AI响应消息 ${i+1}（不显示提示词）...`);
        const aiMessageId = await chatInterfaceRef.current?.handleSubmit("运行提示词块处理中...", true);
        
        if (!aiMessageId) {
          console.error(`[PromptRunner] 为提示词块 ${i+1} 创建消息ID失败`);
          continue;
        }
        
        console.log(`[PromptRunner] 成功创建AI消息占位 ${i+1}，ID: ${aiMessageId}`);
        
        try {
          console.log(`[PromptRunner] 开始调用API发送消息 ${i+1}...`);
          
          // 直接使用API客户端发送聊天消息
          const response = await sendChatDirectly(messageHistory);
          
          const aiResponse = response.content;
          const endTime = Date.now();
          
          console.log(`[PromptRunner] 块 ${i+1}/${promptBlocks.length} 执行完成，耗时: ${endTime - startTime}ms`);
          
          // 更新对话历史
          messageHistory.push({ role: 'assistant', content: aiResponse });
          
          // 更新消息UI - 显示为普通文本而不是JSON
          if (chatInterfaceRef.current) {
            console.log(`[PromptRunner] 更新UI消息 ${i+1}...`);
            // 注意参数顺序：messageId, content, rawResponse, customSender, type
            // 这里使用type: 'prompt'参数确保消息以纯文本提示词格式显示
            chatInterfaceRef.current.updateAiMessage(
              aiMessageId,  
              aiResponse,    // 显示文本内容 - 会以markdown形式渲染
              aiResponse,    // 原始响应
              "May the 神谕 be with you", // 自定义发送者名称
              'prompt'       // 消息类型 - 使用prompt类型
            );
          }
          
          // 添加短暂延迟，使执行看起来更自然
          const delayTime = 800;
          console.log(`[PromptRunner] 块 ${i+1} 添加${delayTime}ms延迟...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
          
        } catch (error) {
          console.error(`[PromptRunner] 运行提示词块 ${i+1}/${promptBlocks.length} 时出错:`, error);
          
          if (chatInterfaceRef.current) {
            const errorMessage = `运行错误: ${error instanceof Error ? error.message : '未知错误'}`;
            chatInterfaceRef.current.updateAiMessage(
              aiMessageId,
              errorMessage,
              errorMessage,
              "May the 神谕 be with you"
            );
          }
        }
        
        console.log(`[PromptRunner] 提示词块 ${i+1}/${promptBlocks.length} 执行完成，继续下一个`);
      }
      
      console.log(`[PromptRunner] 所有提示词块处理完毕，共 ${promptBlocks.length} 个`);
      console.log('\n====================================');
      console.log('[PromptRunner] 所有提示词块运行完毕');
      console.log('====================================\n');
      
      return true;
    } catch (error) {
      console.error('[PromptRunner] 运行Agent时发生错误:', error);
      return false;
    }
  }, [agentName, promptBlocks, chatInterfaceRef, replacePromptPlaceholders, userMessages, sendChatDirectly]);

  return { runAgent };
};
