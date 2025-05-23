import { v4 as uuidv4 } from 'uuid'; // 使用any类型隐式导入
import { Card, GlobalPromptBlocks } from '../../SN43Demo/types';
import { ShenyuMessage } from '../types';
import { getModel, getApiKey } from '../../../utils/storage';
import { getConversation, saveConversation } from '../../../utils/db';
import { processAllPrompts } from '../utils/processPrompts';
import { sendMessage, sendMessageStream } from '../../../services/ai-service';

/**
 * 将消息添加到对话中
 * (自定义实现，因为db模块没有导出这个方法)
 */
const addMessageToConversation = async (conversationId: string, message: ShenyuMessage): Promise<boolean> => {
  try {
    // 获取当前对话
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      console.error('[ShenyuExecutionService] 添加消息失败: 未找到对话', conversationId);
      return false;
    }
    
    // 添加消息到对话
    const updatedMessages = [...conversation.messages, message];
    
    // 更新对话
    await saveConversation({
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now()
    });
    
    // 发送事件通知UI更新 - 添加这个事件分发代码
    console.log('[ShenyuExecutionService] 发送消息添加事件，消息ID:', message.id, '类型:', message.type);
    window.dispatchEvent(new CustomEvent('shenyu-message-added', {
      detail: { conversationId, message }
    }));
    
    return true;
  } catch (error) {
    console.error('[ShenyuExecutionService] 添加消息失败:', error);
    return false;
  }
};

/**
 * 神谕执行服务
 * 
 * 处理神谕Agent的运行逻辑，包括：
 * 1. 创建Process类型消息
 * 2. 按顺序处理提示词块
 * 3. 将API响应作为Prompt类型消息添加到对话
 * 4. 更新Process消息的进度状态
 */

// 执行神谕Agent
export const executeShenyuAgent = async (
  cards: Card[],
  globalPromptBlocks: GlobalPromptBlocks,
  configName: string,
  conversationId: string,
  customInputValues?: Record<string, string>
): Promise<boolean> => {
  if (!conversationId) {
    console.error('[ShenyuExecutionService] 无有效对话ID，无法执行');
    return false;
  }
  
  try {
    console.log('[ShenyuExecutionService] 开始执行神谕Agent, 对话ID:', conversationId);
    
    // 从卡片的adminInputs中提取控件值，或使用用户自定义的输入值
    let controlValues: Record<string, any>;
    
    if (customInputValues) {
      // 如果提供了自定义输入值，则使用它
      controlValues = customInputValues;
      console.log('[ShenyuExecutionService] 使用用户修改后的输入值:', controlValues);
    } else {
      // 否则提取默认值，复用ShenyuPromptPreviewModal中的逻辑
      controlValues = cards.reduce((values, card) => {
        if (card && card.adminInputs) {
          Object.entries(card.adminInputs).forEach(([key, value]) => {
            // 提取默认值
            const valueStr = String(value || '');
            const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
            const defaultValue = defaultMatch ? defaultMatch[1] : '';
            
            values[key] = defaultValue;
          });
        }
        return values;
      }, {} as Record<string, any>);
      console.log('[ShenyuExecutionService] 使用默认输入值:', controlValues);
    }

    // 处理所有提示词块
    console.log('[ShenyuExecutionService] 使用以下控件值处理提示词:', JSON.stringify(controlValues));
    const processResult = processAllPrompts(cards, globalPromptBlocks, controlValues, configName, '');
    
    // 计算总块数
    const cardBlocks = processResult.cardBlocks.length;
    const globalBlocks = processResult.globalBlocks.length;
    const totalBlocks = cardBlocks + globalBlocks;
    
    if (totalBlocks === 0) {
      console.error('[ShenyuExecutionService] 没有可执行的提示词块');
      return false;
    }
    
    // 合并所有提示词块，按顺序执行
    const allPromptBlocks = [...processResult.cardBlocks, ...processResult.globalBlocks];
    
    // 创建process类型消息 - 使用uuidv4，TypeScript会隐式将其视为any类型
    const processMessageId = uuidv4();
    // 收集所有提示词内容，用于显示在loading状态
    const allPromptsText = allPromptBlocks.map(block => 
      `${block.cardTitle || '神谕提示词'} > ${block.blockId}: ${block.processed.substring(0, 100)}...`
    ).join(' | ');
    
    const processMessage: ShenyuMessage = {
      id: processMessageId,
      role: 'assistant',
      content: '神谕正在处理...',
      timestamp: Date.now(),
      type: 'process',
      sender: 'May the 神谕 be with you',
      isShenyu: true, // 标记为神谕消息，确保使用正确的渲染组件
      apiPrompt: allPromptsText, // 添加提交给API的实际prompt内容
      progress: {
        current: 0,
        total: totalBlocks,
        completed: false,
        cardBlocks,
        globalBlocks
      }
    };
    
    // 添加到对话
    await addMessageToConversation(conversationId, processMessage);
    
    // 获取当前使用的模型
    const model = getModel();
    console.log('[ShenyuExecutionService] 当前使用模型:', model);
    
    let currentBlock = 0;
    
    // 按顺序处理每个提示词块
    for (const block of allPromptBlocks) {
      // 更新当前进度
      currentBlock++;
      console.log(`[ShenyuExecutionService] 处理第 ${currentBlock}/${totalBlocks} 个提示词块: ${block.blockId}`);
      
      // 更新process消息的进度
      await updateProcessMessage(conversationId, processMessageId, {
        current: currentBlock,
        total: totalBlocks,
        completed: false,
        cardBlocks,
        globalBlocks
      });
      
      // 生成消息ID
      const promptMessageId = uuidv4();
      
      // 调用API - 使用流式响应，传递所有必需的参数
      const response = await sendModel(
        model,              // 模型名称 
        block.processed,    // 处理过的提示词
        promptMessageId,    // 消息ID
        conversationId,     // 对话ID
        block.cardTitle,    // 卡片标题
        block.blockId       // 提示词块ID
      );
      
      // 注意：现在不需要额外创建和添加消息，因为sendModel内部已经处理了消息的创建和添加
      
      // 稍作延迟，确保UI有足够时间更新
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 完成所有块后，更新进度为已完成
    await updateProcessMessage(conversationId, processMessageId, {
      current: totalBlocks,
      total: totalBlocks,
      completed: true,
      cardBlocks,
      globalBlocks
    });
    
    console.log('[ShenyuExecutionService] 神谕执行完成');
    return true;
  } catch (error) {
    console.error('[ShenyuExecutionService] 执行过程出错:', error);
    return false;
  }
};

// 更新进度消息
const updateProcessMessage = async (
  conversationId: string, 
  messageId: string, 
  progress: {
    current: number;
    total: number;
    completed: boolean;
    cardBlocks: number;
    globalBlocks: number;
  }
): Promise<boolean> => {
  try {
    // 获取当前对话
    const conversation = await getConversation(conversationId);
    if (!conversation || !conversation.messages) {
      return false;
    }
    
    // 查找要更新的消息
    const targetMessage = conversation.messages.find(msg => msg.id === messageId);
    if (!targetMessage) {
      console.error('[ShenyuExecutionService] 无法找到要更新的消息:', messageId);
      return false;
    }
    
    // 创建更新后的消息对象
    const updatedMessage = {
      ...targetMessage,
      progress
    };
    
    // 更新特定消息的进度
    const updatedMessages = conversation.messages.map(msg => {
      if (msg.id === messageId) {
        return updatedMessage;
      }
      return msg;
    });
    
    // 保存更新后的对话
    await saveConversation({
      ...conversation,
      messages: updatedMessages
    });
    
    // 发送进度更新事件
    console.log(`[ShenyuExecutionService] 发送消息进度更新事件, 进度: ${progress.current}/${progress.total}`);
    window.dispatchEvent(new CustomEvent('shenyu-message-updated', {
      detail: { 
        conversationId, 
        messageId,
        message: updatedMessage
      }
    }));
    
    return true;
  } catch (error) {
    console.error('[ShenyuExecutionService] 更新进度消息失败:', error);
    return false;
  }
};

// 发送到模型并获取响应 - 使用流式API
const sendModel = async (
  model: string, 
  prompt: string, 
  messageId: string, 
  conversationId: string,
  promptTitle?: string,
  promptBlockId?: string
): Promise<string> => {
  try {
    console.log(`[ShenyuExecutionService] 发送提示词到模型(流式): ${model}`);
    
    // 获取API密钥
    const apiKey = getApiKey();
    if (!apiKey) {
      return "错误：未设置API密钥";
    }
    
    // 为流式消息也添加apiPrompt内容
    console.log(`[ShenyuExecutionService] 发送提示词到模型，内容预览:`, prompt.substring(0, 100) + '...');
    
    // 创建初始的流式提示词消息
    const streamingMessage: ShenyuMessage = {
      id: messageId,
      role: 'assistant',
      content: '',  // 初始内容为空
      timestamp: Date.now(),
      type: 'prompt',
      sender: 'May the 神谕 be with you',
      isShenyu: true,
      isStreaming: true,  // 标记为正在流式生成中
      promptTitle,        // 添加提示词块标题
      promptBlockId,      // 添加提示词块ID
      apiPrompt: prompt   // 将prompt内容也添加到apiPrompt字段
    };
    
    // 先创建一个空的流式消息，然后随着内容生成逐步更新
    await addMessageToConversation(conversationId, streamingMessage);
    
    // 使用流式API，提供回调函数处理增量更新
    const finalContent = await sendMessageStream(
      apiKey,
      [{ role: 'user', content: prompt }],
      model,
      // 进度回调 - 随着内容增加更新消息
      (text: string) => {
        // 创建流式更新事件
        window.dispatchEvent(new CustomEvent('shenyu-message-streaming', {
          detail: { 
            conversationId, 
            messageId,
            content: text
          }
        }));
      },
      // 错误回调
      (error: string) => {
        console.error('[ShenyuExecutionService] 流式API错误:', error);
      }
    );
    
    // 流式生成完成后，最终更新消息内容，并移除流式标记
    const updatedMessage = {
      ...streamingMessage,
      content: finalContent,
      isStreaming: false,
      // 确保apiPrompt字段被保留
      apiPrompt: streamingMessage.apiPrompt || prompt
    };
    
    // 打印最终消息内容，确认apiPrompt是否存在
    console.log('[ShenyuExecutionService] 最终消息内容:', {
      id: updatedMessage.id,
      hasApiPrompt: !!updatedMessage.apiPrompt,
      apiPromptLength: updatedMessage.apiPrompt?.length
    });
    
    // 更新消息的最终状态
    await updatePromptMessage(conversationId, messageId, updatedMessage);
    
    return finalContent;
  } catch (error) {
    console.error('[ShenyuExecutionService] 调用模型API失败:', error);
    return `执行出错: ${error instanceof Error ? error.message : String(error)}`;
  }
};

// 更新提示词消息
const updatePromptMessage = async (
  conversationId: string,
  messageId: string,
  updatedMessage: ShenyuMessage
): Promise<boolean> => {
  try {
    // 获取当前对话
    const conversation = await getConversation(conversationId);
    if (!conversation || !conversation.messages) {
      return false;
    }
    
    // 更新特定消息
    const updatedMessages = conversation.messages.map(msg => {
      if (msg.id === messageId) {
        return updatedMessage;
      }
      return msg;
    });
    
    // 保存更新后的对话
    await saveConversation({
      ...conversation,
      messages: updatedMessages
    });
    
    // 发送消息更新事件
    window.dispatchEvent(new CustomEvent('shenyu-message-updated', {
      detail: { 
        conversationId, 
        messageId,
        message: updatedMessage
      }
    }));
    
    return true;
  } catch (error) {
    console.error('[ShenyuExecutionService] 更新提示词消息失败:', error);
    return false;
  }
};
