import React, { useCallback } from 'react';
import { formatSmartTime } from '../../utils/date-utils';
import { useTextSelection } from '../../hooks/useTextSelection';
import MessageContextMenu from './MessageContextMenu';
import { ClipboardItem } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MessageActions from '../Export/MessageActions';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
  mode?: 'may' | 'shenyu';  // 模式信息，用于分割线
  isDivider?: boolean;      // 标记是否为分割线消息
}

interface MessageItemProps {
  message: Message;
  onContextMenu?: (event: React.MouseEvent, messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onQuote?: (messageId: string) => void;
  onAddToClipboard?: (messageId: string) => void;
  onAddSelectedTextToClipboard?: (item: ClipboardItem) => void; // 新增：添加选中文本到剪贴板
  onQuoteToNewConversation?: (messageContent: string, userPrompt: string) => void; // 新增：引用到新对话
  onOpenQuoteDialog?: (content: string) => void; // 新增：打开引用对话框
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  onContextMenu,
  onCopy,
  onQuote,
  onAddToClipboard,
  onAddSelectedTextToClipboard,
  onQuoteToNewConversation,
  onOpenQuoteDialog
}) => {
  // 使用文本选择钩子处理文本选择和右键菜单
  const { 
    hasSelection, 
    selectedText, 
    position, 
    showContextMenu, 
    closeContextMenu,
    isMarkdown,
    messageId,
    // 使用缓存的选中文本和消息ID
    selectedTextForMenu,
    messageIdForMenu
  } = useTextSelection();
  
  // 处理选中文本复制
  const handleCopySelectedText = useCallback(() => {
    // 直接复制选中文本到系统剪贴板
    navigator.clipboard.writeText(selectedText)
      .then(() => {
        console.log('成功复制选中文本:', selectedText);
      })
      .catch(err => {
        console.error('复制文本失败:', err);
      });
  }, [selectedText]);
  
  // 处理选中文本引用
  const handleQuoteSelectedText = useCallback(() => {
    console.log('引用选中文本:', selectedText);
  }, [selectedText]);
  
  // 处理选中文本添加到剪贴板
  const handleAddSelectedTextToClipboard = useCallback((item: ClipboardItem) => {
    if (onAddSelectedTextToClipboard) {
      console.log('[DEBUG-clipboard] MessageItem.handleAddSelectedTextToClipboard: 收到剪贴板项', {
        id: item.id,
        content: item.content.substring(0, 20) + '...',
        messageId: item.source?.messageId,
        调用时间: new Date().toISOString()
      });
      onAddSelectedTextToClipboard(item);
    } else {
      console.error('[DEBUG-clipboard] MessageItem: onAddSelectedTextToClipboard回调未定义!');
    }
  }, [onAddSelectedTextToClipboard]);
  const isUser = message.role === 'user';
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, message.id);
    }
  };
  
  return (
    <div 
      id={`message-${message.id}`} /* 添加ID以便于定位 */
      className={`message-item ${isUser ? 'user' : 'ai'}`} 
      onContextMenu={handleContextMenu}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        width: '100%'
      }}
    >
      {/* 文本选择上下文菜单 */}
      <MessageContextMenu
        isOpen={showContextMenu && message.id === messageId}
        position={position}
        onClose={closeContextMenu}
        selectedText={selectedText}
        isMarkdown={isMarkdown}
        messageId={message.id}
        onCopy={handleCopySelectedText}
        onQuote={handleQuoteSelectedText}
        onAddToClipboard={handleAddSelectedTextToClipboard}
        selectedTextForMenu={selectedTextForMenu}
        messageIdForMenu={messageIdForMenu}
        onOpenQuoteDialog={onOpenQuoteDialog}
      />
      {/* 消息头部：发送者和时间 */}
      <div 
        className="message-header"
        style={{
          textAlign: isUser ? 'right' : 'left',
          width: '100%',
          maxWidth: '80%'
        }}
      >
        {isUser ? '你' : 'May'}
        <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--font-xs)' }}>
          {formatSmartTime(message.timestamp)}
        </span>
      </div>
      
      {/* 消息内容 */}
      <div 
        className={`message-bubble ${isUser ? 'user' : 'ai'}`}
        style={{
          borderRadius: '6px',
          ...(isUser 
            ? { borderTopRightRadius: '0' } // 用户消息：右上角直角
            : { borderTopLeftRadius: '0' }  // AI消息：左上角直角
          )
        }}
      >
        {isUser ? (
          // 用户消息保持纯文本
          message.content
        ) : (
          // AI消息始终使用Markdown渲染，无论是否正在加载
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const inline = !match;
                  return !inline ? (
                    <SyntaxHighlighter
                      // @ts-ignore - 忽略类型错误，atomDark样式在运行时工作正常
                      style={atomDark}
                      language={match![1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {/* 显示加载指示器，仅在加载状态下 */}
            {message.loading && (
              <span className="typing-indicator" style={{ display: 'inline-block', marginLeft: 'var(--space-xs)' }}>
                <span className="dot" style={{ 
                  display: 'inline-block', 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--text-white)', 
                  margin: '0 2px',
                  opacity: 0.7,
                  animation: 'blink 1s infinite'
                }}></span>
                <span className="dot" style={{ 
                  display: 'inline-block', 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--text-white)', 
                  margin: '0 2px',
                  opacity: 0.7,
                  animation: 'blink 1s infinite 0.2s'
                }}></span>
                <span className="dot" style={{ 
                  display: 'inline-block', 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--text-white)', 
                  margin: '0 2px',
                  opacity: 0.7,
                  animation: 'blink 1s infinite 0.4s'
                }}></span>
                <style>
                  {`
                    @keyframes blink {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 1; }
                    }
                  `}
                </style>
              </span>
            )}
          </div>
        )}
        
        {/* 消息操作按钮 */}
        {message.role === 'assistant' && !message.loading && (
          <MessageActions 
            message={message}
            onCopy={(id) => onCopy && onCopy(id)}
            onQuote={(id) => onQuote && onQuote(id)}
            onAddToClipboard={(id) => onAddToClipboard && onAddToClipboard(id)}
            onQuoteToNewConversation={(content, prompt) => onQuoteToNewConversation && onQuoteToNewConversation(content, prompt)}
            onOpenQuoteDialog={(content) => onOpenQuoteDialog && onOpenQuoteDialog(content)}
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem;
