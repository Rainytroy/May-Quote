import React, { useCallback } from 'react';
import { ShenyuMessage } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MessageActions from '../../../Export/MessageActions';
import './MessageBubble.css';
import { useTextSelection } from '../../../../hooks/useTextSelection';
import MessageContextMenu from '../../../Chat/MessageContextMenu';
import { ClipboardItem } from '../../../../types';
import { generateId } from '../../../../utils/storage-db';

interface PromptMessageBubbleProps {
  message: ShenyuMessage;
  onAddToClipboard?: (messageId: string) => void;
  onAddSelectedTextToClipboard?: (text: string, messageId: string) => Promise<boolean>;
  onOpenQuoteDialog?: (content: string) => void;
}

/**
 * 神谕提示词结果消息气泡组件
 * 
 * 用于展示神谕执行某个提示词块后获得的结果
 * 完全复用May的Markdown渲染逻辑和MessageActions组件
 */
const PromptMessageBubble: React.FC<PromptMessageBubbleProps> = ({ 
  message,
  onAddToClipboard,
  onAddSelectedTextToClipboard,
  onOpenQuoteDialog
}) => {
  // 使用文本选择hook处理文本选择和右键菜单
  const { 
    hasSelection, 
    selectedText, 
    position, 
    showContextMenu, 
    closeContextMenu,
    isMarkdown,
    messageId,
    selectedTextForMenu,
    messageIdForMenu
  } = useTextSelection();
  
  // 处理选中文本复制
  const handleCopySelectedText = useCallback(() => {
    navigator.clipboard.writeText(selectedText)
      .then(() => {
        console.log('[ShenyuPrompt] 成功复制选中文本:', selectedText.substring(0, 30) + '...');
      })
      .catch(err => {
        console.error('[ShenyuPrompt] 复制文本失败:', err);
      });
  }, [selectedText]);
  
  // 处理选中文本添加到剪贴板
  const handleAddSelectedTextToClipboard = useCallback((item: ClipboardItem) => {
    if (onAddSelectedTextToClipboard && item.source && item.source.messageId) {
      console.log('[ShenyuPrompt] 添加选中文本到剪贴板:', item.content.substring(0, 30) + '...');
      onAddSelectedTextToClipboard(item.content, item.source.messageId);
    }
  }, [onAddSelectedTextToClipboard]);
  
  // 添加右键菜单上下文处理
  const handleContextMenu = (e: React.MouseEvent) => {
    // 不阻止默认行为，让useTextSelection处理
  };
  
  return (
    <div 
      className="prompt-message-content"
      id={`message-${message.id}`} // 添加ID以便于useTextSelection识别
      onContextMenu={handleContextMenu}
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
        onAddToClipboard={handleAddSelectedTextToClipboard}
        selectedTextForMenu={selectedTextForMenu}
        messageIdForMenu={messageIdForMenu}
        onOpenQuoteDialog={onOpenQuoteDialog}
      />
      {/* 顶部标题 - 使用简单结构，是markdown-body的兄弟元素 */}
      {message.promptTitle && (
        <div className="prompt-title">
          {message.promptTitle} {message.promptBlockId && <span style={{ opacity: 0.7 }}>#{message.promptBlockId.replace('promptBlock', '')}</span>}
        </div>
      )}
      
      {/* 主内容区 - 维持原有简单结构 */}
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match;
              return !inline ? (
                <SyntaxHighlighter
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
        
        {/* 显示加载指示器，仅在流式生成状态下显示 */}
        {message.isStreaming && (
          <span className="typing-indicator" style={{ marginLeft: 'var(--space-xs)' }}>
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
      
      {/* 底部操作栏 - 只在消息生成完毕后显示 */}
      {!message.isStreaming && (
        <MessageActions 
          message={message}
          onCopy={(id) => console.log(`复制消息: ${id}`)}
          onAddToClipboard={onAddToClipboard || (() => console.log('添加到剪贴板功能未传入'))}
          onOpenQuoteDialog={onOpenQuoteDialog}
        />
      )}
    </div>
  );
};

export default PromptMessageBubble;
