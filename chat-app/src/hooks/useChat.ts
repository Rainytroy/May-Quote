import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiKey, getModel } from '../utils/storage';
import { sendMessageStream } from '../services/ai-service';
import { preprocessMessages } from '../utils/model-adapters';
import { Message as OriginalMessage } from '../components/Chat/MessageItem';
import { Message } from '../sharedTypes'; // 导入扩展后的Message类型
import { generateId } from '../utils/storage-db';
import { useMode } from '../contexts/ModeContext';
import { 
  getShenyuSystemPromptSync, 
  logPromptStructure, 
  isValidJsonContent,
  triggerDebugEvent
} from '../components/Shenyu/utils/shenyuSystemPrompt';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 聊天功能Hook
 * @param conversationId 当前对话ID
 * @param updateConversation 更新对话回调函数
 */
export function useChat(
  conversationId?: string | null,
  updateConversation?: (messages: Message[]) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用ref来追踪最新的消息和响应内容，避免闭包问题
  const messagesRef = useRef<Message[]>([]);
  const responseContentRef = useRef<string>(''); // 用于跟踪最终的API响应
  messagesRef.current = messages;
  
  // 当conversationId变化时，清空消息
  useEffect(() => {
    if (conversationId) {
      // 如果是切换对话，清空当前消息
      // 注意：实际消息会在App组件中从对话数据加载
      setMessages([]);
      setError(null);
    }
  }, [conversationId]);
  
  // 获取当前模式
  const { currentMode } = useMode();
  
  // 发送消息
  const sendMessage = useCallback(async (content: string, messageMode?: string) => {
    // 使用传入的消息模式或当前模式
    const effectiveMode = messageMode || currentMode;
    console.log(`[useChat] 发送消息使用模式: ${effectiveMode}`);
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('请先设置API密钥');
      return;
    }
    
    // 创建用户消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    // 创建临时的AI消息（用于显示加载状态）
    const tempAiMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true,
      // 如果是神谕模式，直接标记为神谕消息
      ...(effectiveMode === 'shenyu' && {
        isShenyu: true,
        type: 'json' // 默认使用json类型
      })
    };
    
    // 添加消息到状态
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage, tempAiMessage];
      messagesRef.current = newMessages; // 更新ref
      return newMessages;
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 准备发送给API的消息，从ref中获取最新状态
      const apiMessages = messagesRef.current
        .filter(msg => msg && msg.role && (msg.role !== 'assistant' || !msg.loading)) // 添加安全检查，过滤掉临时加载消息和无效消息
        .map(msg => ({
          role: msg.role,
          content: msg.content || '' // 确保content至少为空字符串
        }));
      
      // 处理神谕模式的提示词 - 使用消息附带的模式而不是React状态
      if (effectiveMode === 'shenyu') {
        // 获取系统提示词
        const shenyuPrompt = getShenyuSystemPromptSync(content);
        
        // 修改用户消息，将提示词模板直接添加到用户消息中
        // 找到最后一条用户消息（就是当前发送的消息）
        for (let i = apiMessages.length - 1; i >= 0; i--) {
          if (apiMessages[i].role === 'user') {
            // 替换用户消息内容为模板格式（原始内容已经包含在模板的{#input}中）
            apiMessages[i].content = shenyuPrompt;
            break;
          }
        }
        
        // 添加一个空的系统提示词，作为基础上下文
        apiMessages.unshift({
          role: 'system',
          content: '你是一个能力强大的AI助手，专门用于生成JSON格式的结构化提示词。请严格按照用户消息中提供的指南操作。'
        });
        
        // 记录请求结构用于调试，注意这里不会实际发送数据，仅用于调试显示
        const debugData = logPromptStructure(apiMessages[0].content, apiMessages.slice(1), content);
        
        // 触发调试事件，显示在调试面板中
        triggerDebugEvent({
          systemPrompt: apiMessages[0].content,
          userInput: content,
          contextMessagesCount: apiMessages.length - 2, // 减去系统提示词和当前用户消息
          fullPayload: apiMessages
        });
      }
      
      // 获取当前选择的模型
      const model = getModel();
      
      // 处理流式响应中的进度更新
      const handleProgress = (text: string) => {
        // 更新响应引用 (在组件顶层声明)
        responseContentRef.current = text;
        
        // 将最新的响应发送到调试面板（仅在神谕模式下）
        if (effectiveMode === 'shenyu') {
          triggerDebugEvent({
            systemPrompt: apiMessages[0].content,
            userInput: content,
            contextMessagesCount: apiMessages.length - 2,
            fullPayload: apiMessages,
            response: text // 将当前响应内容传递给调试面板
          });
        }
        
        // 更新UI中的消息
        setMessages(prevMessages => {
          // 确保有消息且数组不为空
          if (!prevMessages || prevMessages.length === 0) {
            return prevMessages;
          }
          
          const lastMessage = prevMessages[prevMessages.length - 1];
          
          // 确保lastMessage存在且具有role属性
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.loading) {
            // 更新AI消息内容
            // 保留原有的isShenyu和type标记，只更新内容
            const newMessages = [
              ...prevMessages.slice(0, -1),
              { 
                ...lastMessage, 
                content: text
              }
            ];
            messagesRef.current = newMessages; // 更新ref
            return newMessages;
          }
          return prevMessages;
        });
      };
      
      // 处理错误
      const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setMessages(prevMessages => {
          const withoutLoading = prevMessages.filter(msg => !msg.loading);
          messagesRef.current = withoutLoading; // 更新ref
          return withoutLoading;
        });
      };
      
      // 根据模型对消息进行预处理
      const processedMessages = preprocessMessages(apiMessages, model);
      
      // 记录处理过程
      if (processedMessages.length !== apiMessages.length) {
        console.log(`[模型适配] 消息已预处理: ${apiMessages.length} -> ${processedMessages.length} 条消息`);
      }
      
      // 确定是否是神谕JSON类型
      const isShenyuJson = effectiveMode === 'shenyu' && tempAiMessage.type === 'json';
      
      // 发送消息并处理响应，神谕JSON类型使用非流式请求
      const finalCompleteText = await sendMessageStream(
        apiKey,
        processedMessages,
        model,
        handleProgress, // handleProgress 仍然用于UI的实时更新和调试面板
        handleError,
        { isShenyuJson } // 传递标志给 sendMessageStream
      );
      
      console.log('[useChat] finalCompleteText from sendMessageStream. Length:', finalCompleteText.length, 'Content sample:', finalCompleteText.substring(0, 50) + "...", finalCompleteText.substring(finalCompleteText.length - 50));

      // 完成加载，更新最后的AI消息状态
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        // 确保 lastMessage 存在并且是正在加载的助手消息
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.loading) {
          const newMessages = [
            ...prevMessages.slice(0, -1),
            { 
              ...lastMessage, 
              content: finalCompleteText, // 使用从 sendMessageStream 直接返回的完整文本
              loading: false
              // 不再根据内容判断消息类型，保持已有的类型标记
            }
          ];
          messagesRef.current = newMessages; // 更新ref
          return newMessages;
        }
        return prevMessages;
      });
    } catch (err: any) {
      // 处理错误
      setError(err.message || '发送消息时出错');
      // 移除临时的AI消息
      setMessages(prevMessages => {
        const withoutLoading = prevMessages.filter(msg => !msg.loading);
        messagesRef.current = withoutLoading; // 更新ref
        return withoutLoading;
      });
    } finally {
      setIsLoading(false);
      
      // 如果提供了更新回调，则更新对话
      // 确保在 finally 块中 messagesRef.current 是最新的
      // React 的 setMessages 是异步的，但 ref 的更新是同步的（在 setter 函数内）
      // 此处的 messagesRef.current 应该已经包含了 loading:false 和 finalContentFromStream 的更新
      if (updateConversation && conversationId) {
        if (messagesRef.current && messagesRef.current.length > 0) {
          const lastAiMsg = messagesRef.current[messagesRef.current.length - 1];
          if (lastAiMsg && lastAiMsg.role === 'assistant') {
            console.log('[useChat] Before updateConversation - Last AI message content. Length:', lastAiMsg.content?.length, 'Content sample:', lastAiMsg.content?.substring(0, 50) + "...", lastAiMsg.content?.substring((lastAiMsg.content?.length || 0) - 50));
          }
        }
        updateConversation(messagesRef.current);
      }
    }
  }, [updateConversation, conversationId, currentMode]); // 添加 currentMode 到依赖项，因为它在回调内部使用
  
  // 清空所有消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    messagesRef.current = []; // 清空ref
    setError(null);
  }, []);
  // 直接设置消息列表的方法 - 用于加载初始消息
  const setInitialMessages = useCallback((initialMsgs: Message[]) => {
    if (initialMsgs && initialMsgs.length > 0) {
      // 确保所有消息的loading属性为false，避免历史消息显示加载动画
      const processedMessages = initialMsgs.map(msg => ({
        ...msg,
        loading: false // 强制设置为false，确保不会显示加载指示器
      }));
      
      setMessages(processedMessages);
      messagesRef.current = processedMessages;
    }
  }, []);
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setInitialMessages
  };
}
