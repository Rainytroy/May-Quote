import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { generateId } from '../../../utils/storage-db';
import ShenyuMessageList from './ShenyuMessageList';
import ShenyuInputArea from './ShenyuInputArea';
import { ShenyuMessage } from './ShenyuMessageItem';
import { usePromptTemplates } from '../contexts/PromptTemplateContext';

// 定义组件接口
export interface ShenyuChatInterfaceHandle {
  updateAiMessage: (messageId: string, jsonOutput: string, apiRawResponse: string, customSender?: string, type?: 'json' | 'prompt') => void;
  handleSubmit: (content: string, hideUserMessage?: boolean) => Promise<string | undefined>;
}

interface ShenyuChatInterfaceProps {
  onGenerateControls: (jsonText: string) => void;
  onResetState?: () => void;
}

/**
 * 神谕聊天界面组件
 * 
 * 整合消息列表和输入区，管理神谕对话流
 */
const ShenyuChatInterface = forwardRef<ShenyuChatInterfaceHandle, ShenyuChatInterfaceProps>(({
  onGenerateControls,
  onResetState
}, ref) => {
  console.log('[ShenyuChatInterface] 组件已挂载，props:', {
    hasOnGenerateControls: !!onGenerateControls,
    hasOnResetState: !!onResetState,
    hasRef: !!ref
  });
  // 消息列表状态
  const [messages, setMessages] = useState<ShenyuMessage[]>([]);
  // 是否生成中
  const [isGenerating, setIsGenerating] = useState(false);
  // 是否已生成（用于切换按钮文本）
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // 获取提示词模板
  const { activeTemplates } = usePromptTemplates();
  
  // 处理提交消息
  const handleSubmit = async (content: string, hideUserMessage: boolean = false) => {
    console.log('[ShenyuChatInterface] handleSubmit 被调用，收到内容:', content.substring(0, 30) + (content.length > 30 ? '...' : ''));
    console.trace('[ShenyuChatInterface] handleSubmit 调用堆栈');
    
    // 防止重复提交
    if (isGenerating) {
      console.warn('[ShenyuChatInterface] 已经在生成中，忽略此次提交');
      return;
    }
    
    // 生成唯一ID
    const userMessageId = generateId();
    const aiMessageId = generateId();
    const timestamp = Date.now();
    
    console.log('[ShenyuChatInterface] 生成的消息ID:', {
      userMessageId,
      aiMessageId,
      timestamp,
      hideUserMessage
    });
    
    // 创建用户消息
    const userMessage: ShenyuMessage = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp
    };
    
    // 创建AI响应消息（初始为加载状态）
    const aiMessage: ShenyuMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: timestamp + 1,
      loading: true,
      activeTemplate: activeTemplates.id
    };
    
    // 添加消息到列表 - 如果hideUserMessage为true，则只添加AI消息
    if (hideUserMessage) {
      setMessages(prev => [...prev, aiMessage]);
      console.log('[ShenyuChatInterface] 仅添加AI消息到列表，当前消息数:', messages.length + 1);
    } else {
      setMessages(prev => [...prev, userMessage, aiMessage]);
      console.log('[ShenyuChatInterface] 消息已添加到列表，当前消息数:', messages.length + 2);
    }
    console.log('[ShenyuChatInterface] 消息已添加到列表，当前消息数:', messages.length + 2);
    
    // 标记为生成中
    setIsGenerating(true);
    
    try {
      // 这里将向外部组件传递用户输入，等待API响应
      // 实际实现时，该部分逻辑会被移到AgentConfigPanel中
      
      console.log('[ShenyuChatInterface] 准备完成，将返回AI消息ID:', aiMessageId);
      
      // 模拟API调用延迟 (实际实现中这部分会被AgentConfigPanel接管)
      // await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 更新已生成状态
      setHasGenerated(true);
    } catch (error) {
      console.error('[ShenyuChatInterface] 生成失败:', error);
      
      // 更新AI消息为错误状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, loading: false, content: '生成失败，请重试' } 
            : msg
        )
      );
    } finally {
      // 标记生成完成
      setIsGenerating(false);
    }
    
    // 返回AI消息ID供外部使用
    console.log('[ShenyuChatInterface] 返回aiMessageId:', aiMessageId);
    return aiMessageId;
  };
  
  // 重置状态
  const handleReset = () => {
    setMessages([]);
    setHasGenerated(false);
    if (onResetState) {
      onResetState();
    }
  };
  
  // 提供给外部更新AI消息的方法
  const updateAiMessage = (messageId: string, jsonOutput: string, apiRawResponse: string, customSender?: string, type?: 'json' | 'prompt') => {
    console.log('[ShenyuChatInterface] 开始更新AI消息:', {
      messageId, 
      jsonAvailable: !!jsonOutput, 
      apiResponseAvailable: !!apiRawResponse,
      hasCustomSender: !!customSender,
      type: type || 'json', // 默认为json类型
      currentMessages: messages.length
    });

    // 确保我们能找到这条消息
    const targetMessage = messages.find(msg => msg.id === messageId);
    if (!targetMessage) {
      console.error(`[ShenyuChatInterface] 错误: 没有找到ID为 ${messageId} 的消息!`);
      console.log('当前所有消息ID:', messages.map(m => m.id));
      return;
    }
    
    console.log(`[ShenyuChatInterface] 找到目标消息:`, {
      id: targetMessage.id,
      role: targetMessage.role,
      loading: targetMessage.loading
    });
    
    // 使用函数形式的setState以确保我们拿到最新状态
    setMessages(prev => {
      const updatedMessages = prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              loading: false, 
              jsonOutput,
              apiRawResponse,
              type: type || 'json', // 设置消息类型
              ...(customSender ? { sender: customSender } : {})
            } 
          : msg
      );
      
      console.log(`[ShenyuChatInterface] 消息更新完成:`, {
        更新前消息数: prev.length,
        更新后消息数: updatedMessages.length,
        目标消息更新后状态: updatedMessages.find(m => m.id === messageId)
      });
      
      return updatedMessages;
    });
  };
  
  // 使用useImperativeHandle暴露方法给父组件 - 移到return之前
  useImperativeHandle(ref, () => ({
    updateAiMessage,
    handleSubmit
  }));

  return (
    <div className="shenyu-chat-interface" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%'
    }}>
      {/* 消息列表 */}
      <ShenyuMessageList 
        messages={messages}
        onGenerateControls={onGenerateControls}
      />
      
      {/* 底部工具栏 */}
      <div className="shenyu-toolbar" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 'var(--space-xs) var(--space-md)',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)'
      }}>
        {hasGenerated && (
          <button
            onClick={handleReset}
            style={{
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer',
              fontSize: 'var(--font-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="M3 12h18"></path>
              <path d="M12 3v18"></path>
            </svg>
            重置
          </button>
        )}
      </div>
      
      {/* 输入区 */}
      <ShenyuInputArea 
        onSubmit={(content) => {
          console.log('[ShenyuChatInterface] 接收到ShenyuInputArea的提交事件，内容:', 
            content.substring(0, 30) + (content.length > 30 ? '...' : ''));
          
          // 直接调用handleSubmit并将Promise传回父组件
          const messageIdPromise = handleSubmit(content);
          
          // 确保ref.current存在并且上层组件可以通过ref调用handleSubmit
          if (typeof ref === 'function') {
            console.log('[ShenyuChatInterface] ref是函数类型，无法直接验证');
          } else if (ref && ref.current) {
            console.log('[ShenyuChatInterface] ref.current存在，可以被父组件访问');
          } else {
            console.warn('[ShenyuChatInterface] 警告: ref.current不存在!');
          }
          
          // 调试追踪
          messageIdPromise.then(messageId => {
            console.log('[ShenyuChatInterface] handleSubmit完成，返回messageId:', messageId);
          }).catch(error => {
            console.error('[ShenyuChatInterface] handleSubmit错误:', error);
          });
        }}
        disabled={isGenerating}
        hasGenerated={hasGenerated}
        placeholder={isGenerating ? "AI正在运行中..." : "输入需求描述..."}
      />
    </div>
  );
});

export default ShenyuChatInterface;
