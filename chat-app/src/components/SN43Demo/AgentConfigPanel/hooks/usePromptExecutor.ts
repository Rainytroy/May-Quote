import { useCallback, RefObject, useState } from 'react';
import { ShenyuChatInterfaceHandle } from '../../Chat/ShenyuChatInterface';
// Card, GlobalPromptBlocks, controlValues, userInput are no longer needed directly by the hook
// as processAllPrompts will be called by the parent component.
import { createApiClient } from '../../../../services/ai-service';
import { getApiKey, getModel } from '../../../../utils/storage';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ProcessedPromptBlock, ProcessPromptResults } from '../../utils/processPrompts'; // Import ProcessPromptResults

interface UsePromptExecutorProps {
  chatInterfaceRef?: RefObject<ShenyuChatInterfaceHandle | null>;
  agentName: string;
  // Removed: cards, globalPromptBlocks, controlValues, userInput
}

/**
 * 提示词执行器Hook
 * 
 * 专门负责运行按钮的新逻辑 - 依次执行提示词块并显示结果
 * 完全独立于Agent生成功能
 */
export const usePromptExecutor = ({
  chatInterfaceRef,
  agentName
}: UsePromptExecutorProps) => {
  // 处理运行状态
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 直接使用API客户端发送聊天消息
  const sendChatMessage = useCallback(async (
    message: string,
    context: string[] = [],
    systemPrompt: string = `你是AI助手，正在执行来自用户的提示词。当前Agent: ${agentName}`
  ) => {
    console.log(`[PromptExecutor] 发送聊天消息, 长度: ${message.length}字符`);
    
    // 获取API密钥和模型ID
    const apiKey = getApiKey();
    const modelId = getModel();
      
    if (!apiKey) {
      throw new Error('API密钥未设置');
    }
    
    console.log(`[PromptExecutor] 使用模型: ${modelId}, API密钥长度: ${apiKey.length}`);
    
    // 创建客户端并发送请求
    const startTime = Date.now();
    console.log(`[PromptExecutor] 创建API客户端...`);
    const client = createApiClient(apiKey, modelId);
    
    // 构建消息历史
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // 添加上下文消息
    context.forEach(msg => {
      messages.push({ role: 'user', content: msg });
    });
    
    // 添加当前消息
    messages.push({ role: 'user', content: message });
    
    console.log(`[PromptExecutor] 发送聊天请求, 消息总数: ${messages.length}`);
    
    // 发送请求并获取响应
    const completion = await client.chat.completions.create({
      messages,
      model: modelId,
      temperature: 0.7
    });
    
    const endTime = Date.now();
    const content = completion.choices[0]?.message?.content || '无结果';
    
    console.log(`[PromptExecutor] 收到AI响应, 耗时: ${endTime - startTime}ms, 内容长度: ${content.length}`);
    
    return {
      content,
      finishReason: completion.choices[0]?.finish_reason || 'stop'
    };
  }, [agentName]);

  // 执行所有提示词 - now accepts pre-processed blocks
  const executePrompts = useCallback(async (processedResults: ProcessPromptResults) => {
    if (isRunning) {
      console.warn('[PromptExecutor] 已有执行任务在进行中，跳过...');
      return;
    }
    
    if (!chatInterfaceRef?.current) {
      console.error('[PromptExecutor] 聊天界面引用未初始化，无法执行');
      return;
    }
    
    console.log('\n====================================');
    console.log(`[PromptExecutor] 开始执行预处理的提示词: ${agentName}`);
    console.log('====================================\n');
    
    setIsRunning(true);
    
    try {
      // 合并卡片块和全局块，按顺序处理
      const allBlocks = [...processedResults.cardBlocks, ...processedResults.globalBlocks];
      
      if (allBlocks.length === 0) {
        console.warn('[PromptExecutor] 没有提示词块可执行');
        setIsRunning(false);
        return;
      }
      
      console.log(`[PromptExecutor] 已处理 ${allBlocks.length} 个提示词块，准备执行`);
      
      // 创建运行消息
      console.log('[PromptExecutor] 创建运行消息...');
      const runningMessageId = await chatInterfaceRef.current.handleSubmit(
        `运行提示词执行器: ${agentName}`, 
        true // 隐藏用户消息
      );
      
      if (!runningMessageId) {
        console.error('[PromptExecutor] 创建运行消息失败');
        setIsRunning(false);
        return;
      }
      
      // 更新运行消息
      chatInterfaceRef.current.updateAiMessage(
        runningMessageId,
        `# 🚀 提示词执行器\n\n**Agent**: ${agentName}\n\n*正在加载提示词块...*`,
        '',
        '提示词执行器',
        'prompt'
      );
      
      // 创建上下文数组，用于传递给API
      const context: string[] = [];
      
      // 首先处理所有卡片提示词块
      const cardBlocks = allBlocks.filter(b => !b.isGlobal);
      const globalBlocks = allBlocks.filter(b => b.isGlobal);
      
      // 处理卡片提示词块
      console.log(`[PromptExecutor] 执行 ${cardBlocks.length} 个卡片提示词块`);
      for (let i = 0; i < cardBlocks.length; i++) {
        const block = cardBlocks[i];
        console.log(`[PromptExecutor] 执行卡片提示词块 ${i+1}/${cardBlocks.length}: ${block.blockId} (${block.cardId})`);
        
        // 获取已处理的提示词文本
        const processedText = block.processed;
        
        // 检查未替换的占位符
        if (block.unreplacedCount > 0) {
          console.warn(`[PromptExecutor] 提示词块 ${block.blockId} 有 ${block.unreplacedCount} 个占位符未能替换:`, block.unreplacedList);
        }
        
        // 创建显示消息
        const blockMessageId = await chatInterfaceRef.current.handleSubmit(
          `提示词块 (卡片) ${i+1}/${cardBlocks.length}: ${block.blockId}`, 
          true // 隐藏用户消息
        );
        
        if (!blockMessageId) {
          console.error(`[PromptExecutor] 为提示词块 ${block.blockId} 创建消息失败`);
          continue;
        }
        
        // 显示提示词
        const blockTitle = `卡片 ${block.cardTitle} 提示词块: ${block.blockId}`;
        
        chatInterfaceRef.current.updateAiMessage(
          blockMessageId,
          `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n*处理中...*`,
          processedText,
          '提示词执行器',
          'prompt'
        );
        
        // 调用API获取响应
        console.log(`[PromptExecutor] 发送提示词 ${block.blockId} 到API...`);
        
        try {
          const response = await sendChatMessage(processedText, context);
          
          // 添加到上下文，供后续使用
          context.push(processedText);
          context.push(response.content);
          
          // 更新消息，显示结果
          chatInterfaceRef.current.updateAiMessage(
            blockMessageId,
            `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n## 🤖 响应\n\n${response.content}`,
            processedText,
            '提示词执行器',
            'prompt'
          );
          
          console.log(`[PromptExecutor] 提示词块 ${block.blockId} 执行完成`);
          
          // 添加短暂延迟，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[PromptExecutor] 执行提示词块 ${block.blockId} 时出错:`, error);
          
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          
          // 更新消息，显示错误
          chatInterfaceRef.current.updateAiMessage(
            blockMessageId,
            `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n## ❌ 错误\n\n执行此提示词块时出错: ${errorMessage}`,
            processedText,
            '提示词执行器',
            'prompt'
          );
        }
      }
      
      // 处理全局提示词块
      console.log(`[PromptExecutor] 执行 ${globalBlocks.length} 个全局提示词块`);
      for (let i = 0; i < globalBlocks.length; i++) {
        const block = globalBlocks[i];
        console.log(`[PromptExecutor] 执行全局提示词块 ${i+1}/${globalBlocks.length}: ${block.blockId}`);
        
        // 获取已处理的提示词文本
        const processedText = block.processed;
        
        // 检查未替换的占位符
        if (block.unreplacedCount > 0) {
          console.warn(`[PromptExecutor] 全局提示词块 ${block.blockId} 有 ${block.unreplacedCount} 个占位符未能替换:`, block.unreplacedList);
        }
        
        // 创建显示消息
        const blockMessageId = await chatInterfaceRef.current.handleSubmit(
          `提示词块 (全局) ${i+1}/${globalBlocks.length}: ${block.blockId}`, 
          true // 隐藏用户消息
        );
        
        if (!blockMessageId) {
          console.error(`[PromptExecutor] 为全局提示词块 ${block.blockId} 创建消息失败`);
          continue;
        }
        
        // 显示提示词
        const blockTitle = `全局提示词块: ${block.blockId}`;
        
        chatInterfaceRef.current.updateAiMessage(
          blockMessageId,
          `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n*处理中...*`,
          processedText,
          '提示词执行器',
          'prompt'
        );
        
        // 调用API获取响应
        console.log(`[PromptExecutor] 发送全局提示词 ${block.blockId} 到API...`);
        
        try {
          const response = await sendChatMessage(processedText, context);
          
          // 添加到上下文，供后续使用
          context.push(processedText);
          context.push(response.content);
          
          // 更新消息，显示结果
          chatInterfaceRef.current.updateAiMessage(
            blockMessageId,
            `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n## 🤖 响应\n\n${response.content}`,
            processedText,
            '提示词执行器',
            'prompt'
          );
          
          console.log(`[PromptExecutor] 全局提示词块 ${block.blockId} 执行完成`);
          
          // 添加短暂延迟，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[PromptExecutor] 执行全局提示词块 ${block.blockId} 时出错:`, error);
          
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          
          // 更新消息，显示错误
          chatInterfaceRef.current.updateAiMessage(
            blockMessageId,
            `## 📝 ${blockTitle}\n\n\`\`\`\n${processedText}\n\`\`\`\n\n## ❌ 错误\n\n执行此提示词块时出错: ${errorMessage}`,
            processedText,
            '提示词执行器',
            'prompt'
          );
        }
      }
      
      // 完成执行，显示摘要
      console.log('[PromptExecutor] 所有提示词块执行完毕');
      
      // 更新运行消息
      chatInterfaceRef.current.updateAiMessage(
        runningMessageId,
        `# ✅ 提示词执行完成\n\n**Agent**: ${agentName}\n\n共执行了 ${allBlocks.length} 个提示词块 (卡片 ${cardBlocks.length} 个，全局 ${globalBlocks.length} 个)，请查看上方消息了解详情。`,
        '',
        '提示词执行器',
        'prompt'
      );
      
    } catch (error) {
      console.error('[PromptExecutor] 执行提示词时发生错误:', error);
      
      // 更新错误信息
      if (chatInterfaceRef.current) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        
        chatInterfaceRef.current.updateAiMessage(
          'error-message-id', // 这个ID可能不存在，会被忽略
          `# ❌ 提示词执行出错\n\n**Agent**: ${agentName}\n\n错误信息: ${errorMessage}`,
          '',
          '提示词执行器',
          'prompt'
        );
      }
    } finally {
      setIsRunning(false);
    }
  }, [
    agentName, 
    chatInterfaceRef, 
    // cards, // Removed
    // globalPromptBlocks, // Removed
    // controlValues, // Removed
    isRunning,
    sendChatMessage
  ]);

  return { 
    executePrompts,  // 执行所有提示词
    isRunning        // 是否正在执行
  };
};
