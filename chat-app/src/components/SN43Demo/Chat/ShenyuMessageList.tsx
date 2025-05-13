import React, { useRef, useEffect } from 'react';
import ShenyuMessageItem, { ShenyuMessage } from './ShenyuMessageItem';

interface ShenyuMessageListProps {
  messages: ShenyuMessage[];
  onGenerateControls?: (jsonText: string) => void;
}

/**
 * 神谕消息列表组件
 * 
 * 用于显示神谕对话流，支持自动滚动到底部
 */
const ShenyuMessageList: React.FC<ShenyuMessageListProps> = ({ 
  messages,
  onGenerateControls
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 当新消息添加时自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 如果没有消息，显示空白状态
  if (messages.length === 0) {
    return (
      <div className="shenyu-message-list" style={{
        height: '100%',
        padding: 'var(--space-md)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        backgroundColor: 'var(--main-bg)'
      }}>
        <div className="empty-state" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-light-gray)'
        }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ opacity: 0.5, marginBottom: 'var(--space-md)' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          <p>请在下方输入需求描述，开始生成神谕Agent</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="shenyu-message-list" 
      style={{
        height: '100%',
        padding: 'var(--space-md)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        backgroundColor: 'var(--main-bg)'
      }}
    >
      {messages.map((message) => (
        <ShenyuMessageItem 
          key={message.id} 
          message={message}
          onGenerateControls={onGenerateControls}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ShenyuMessageList;
