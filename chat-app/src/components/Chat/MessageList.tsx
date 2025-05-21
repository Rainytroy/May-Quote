import React, { useRef, useEffect } from 'react';
import MessageItem, { Message } from './MessageItem';
import { useMode } from '../../contexts/ModeContext';
import ShenyuMessageBubble from '../Shenyu/ui/messages/ShenyuMessageBubble';
import { ClipboardItem } from '../../types/index';
import { ShenyuMessage } from '../Shenyu/types';

interface MessageListProps {
  messages: Message[];
  onContextMenu?: (event: React.MouseEvent, messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onQuote?: (messageId: string) => void;
  onAddToClipboard?: (messageId: string) => void;
  onAddSelectedTextToClipboard?: (item: ClipboardItem) => void; // 新增：添加选中文本到剪贴板
  onQuoteToNewConversation?: (messageContent: string, userPrompt: string) => void; // 新增：引用到新对话
  onOpenQuoteDialog?: (content: string) => void; // 新增：打开引用对话框
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onContextMenu, 
  onCopy,
  onQuote,
  onAddToClipboard,
  onAddSelectedTextToClipboard,
  onQuoteToNewConversation,
  onOpenQuoteDialog
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 获取当前模式 - 移到顶层，避免条件渲染问题
  const { currentMode } = useMode();
  
  // 当新消息添加时自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 如果没有消息，显示空白状态
  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="empty-state">
          <p>没有消息。发送一条消息开始对话吧！</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="message-list">
      {messages.map((message) => {
        // 检查是否为神谕消息
        const isShenyuMessage = 'isShenyu' in message && message.isShenyu;
        
        // 只根据消息类型渲染不同组件，不依赖当前模式
        if (isShenyuMessage && message.role === 'assistant') {
          return (
            <ShenyuMessageBubble
              key={message.id}
              message={message as ShenyuMessage}
              loading={!!message.loading}
              onAddToClipboard={onAddToClipboard}
              onAddSelectedTextToClipboard={(text: string, messageId: string) => {
                const item: ClipboardItem = {
                  id: messageId,
                  content: text,
                  timestamp: Date.now(),
                  order: 0, // 默认顺序为0
                  source: {
                    messageId,
                    conversationId: ''
                  }
                };
                onAddSelectedTextToClipboard && onAddSelectedTextToClipboard(item);
                return Promise.resolve(true);
              }}
              onOpenQuoteDialog={onOpenQuoteDialog}
            />
          );
        } else {
          // 默认使用普通消息组件
          return (
            <MessageItem 
              key={message.id} 
              message={message} 
              onContextMenu={onContextMenu}
              onCopy={onCopy}
              onQuote={onQuote}
              onAddToClipboard={onAddToClipboard}
              onAddSelectedTextToClipboard={onAddSelectedTextToClipboard}
              onQuoteToNewConversation={onQuoteToNewConversation}
              onOpenQuoteDialog={onOpenQuoteDialog}
            />
          );
        }
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
