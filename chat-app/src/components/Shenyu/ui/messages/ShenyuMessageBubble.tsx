import React, { useState } from 'react';
import { ShenyuMessage } from '../../types';
import JsonMessageBubble from './JsonMessageBubble';
import ProcessMessageBubble from './ProcessMessageBubble';
import PromptMessageBubble from './PromptMessageBubble';
import './MessageBubble.css';
import { SHENYU_AI_NAME } from '../../utils/shenyuSystemPrompt';
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
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>神谕运行中</span>
          </div>
          <div className="loading-hint">可能需要几秒钟</div>
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
