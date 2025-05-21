import React, { useState, useEffect } from 'react';
import { ShenyuMessage } from '../../types';
import JsonMessageBubble from './JsonMessageBubble';
import ProcessMessageBubble from './ProcessMessageBubble';
import PromptMessageBubble from './PromptMessageBubble';
import './MessageBubble.css';
import { SHENYU_AI_NAME } from '../../utils/shenyuSystemPrompt';
import { SHENYU_PROMPT_TEMPLATE } from '../../utils/promptTemplates';
import { formatSmartTime } from '../../../../utils/date-utils';

interface ShenyuMessageBubbleProps {
  message: ShenyuMessage;
  loading?: boolean;
  onAddToClipboard?: (messageId: string) => void;
  onAddSelectedTextToClipboard?: (text: string, messageId: string) => Promise<boolean>;
  onOpenQuoteDialog?: (content: string) => void;
}

/**
 * 神谕消息气泡组件
 * 
 * 根据消息类型渲染不同的子组件，支持JSON、Prompt和Process三种类型
 */
const ShenyuMessageBubble: React.FC<ShenyuMessageBubbleProps> = ({ 
  message, 
  loading = false,
  onAddToClipboard,
  onAddSelectedTextToClipboard,
  onOpenQuoteDialog
}) => {
  // 用于存储从debug事件获取的API请求内容
  const [apiRequestContent, setApiRequestContent] = useState<string>('');
  
  // 监听shenyu-debug事件，获取实际的API请求内容
  useEffect(() => {
    const handleDebugEvent = (event: CustomEvent) => {
      const { detail } = event;
      if (detail && detail.fullPayload) {
        try {
          // 从调试事件中提取完整的API请求内容
          // 将fullPayload转换为可读的字符串格式
          const formattedPayload = detail.fullPayload.map((msg: any) => {
            return `${msg.role}:\n${msg.content.substring(0, 300)}${msg.content.length > 300 ? '...' : ''}`;
          }).join('\n\n');
          
          console.log('[ShenyuMessageBubble] 接收到debug事件，更新API请求内容');
          setApiRequestContent(formattedPayload);
        } catch (error) {
          console.error('[ShenyuMessageBubble] 处理debug事件出错:', error);
        }
      }
    };
    
    // 添加调试事件监听器
    window.addEventListener('shenyu-debug' as any, handleDebugEvent as any);
    
    return () => {
      // 移除调试事件监听器
      window.removeEventListener('shenyu-debug' as any, handleDebugEvent as any);
    };
  }, []);
  // 处理添加到剪贴板
  const handleAddToClipboard = () => {
    if (onAddToClipboard && message.id) {
      onAddToClipboard(message.id);
    }
  };
  
  // 处理选中文本添加到剪贴板
  const handleAddSelectedTextToClipboard = (text: string, messageId: string) => {
    if (onAddSelectedTextToClipboard) {
      return onAddSelectedTextToClipboard(text, messageId);
    }
    return Promise.resolve(false);
  };
  
  // 处理引用到新对话
  const handleOpenQuoteDialog = (content: string) => {
    if (onOpenQuoteDialog) {
      onOpenQuoteDialog(content);
    }
  };

  // 根据消息类型渲染适当的内容组件
  const renderContentByType = () => {
    // 添加调试日志
    console.log('[ShenyuMessageBubble] 渲染消息:', {
      id: message.id,
      type: message.type,
      loading,
      hasApiPrompt: !!message.apiPrompt,
      apiPromptLength: message.apiPrompt?.length,
      apiPromptPreview: message.apiPrompt ? `${message.apiPrompt.substring(0, 50)}...` : 'undefined'
    });
    
    if (loading) {
      // 直接使用提示词模板，这样滚动内容会展示实际的系统提示词
      const displayText = SHENYU_PROMPT_TEMPLATE;
      
      console.log('[ShenyuMessageBubble] 使用提示词模板作为滚动文本');
      
      return (
        <div className="loading-state">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>神谕运行中
              <span className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            </span>
          </div>
          <div className="loading-hint">
            <div className="prompt-scroll-container">
              <div className="prompt-scroll-text">
                {displayText}
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (message.type) {
      case 'process':
        return <ProcessMessageBubble message={message} />;
      case 'prompt':
        return (
          <PromptMessageBubble 
            message={message}
            onAddToClipboard={handleAddToClipboard}
            onAddSelectedTextToClipboard={handleAddSelectedTextToClipboard}
            onOpenQuoteDialog={handleOpenQuoteDialog}
          />
        );
      case 'json':
      default:
        return <JsonMessageBubble message={message} loading={false} />;
    }
  };

  return (
    <div 
      id={`message-${message.id}`}
      className="message-item ai"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 'var(--space-md)' // 确保与其他消息间距一致
      }}
    >
      {/* 消息头部：发送者和时间 - 使用与May一致的样式 */}
      <div 
        className="message-header"
        style={{
          textAlign: 'left',
          width: '100%',
          maxWidth: '80%'
        }}
      >
        {SHENYU_AI_NAME}
        <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--font-xs)' }}>
          {formatSmartTime(message.timestamp)}
        </span>
      </div>
      
      {/* 消息内容 - 使用标准的message-bubble类，避免样式冲突 */}
      <div className="message-bubble ai">
        {renderContentByType()}
      </div>
    </div>
  );
};

export default ShenyuMessageBubble;
