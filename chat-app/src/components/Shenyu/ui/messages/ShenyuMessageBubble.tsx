import React, { useState } from 'react';
import { ShenyuMessage } from '../../types';
import JsonMessageBubble from './JsonMessageBubble';
import './MessageBubble.css';
import { isValidJsonContent } from '../../utils/shenyuSystemPrompt';
import { SHENYU_AI_NAME } from '../../utils/shenyuSystemPrompt';
import { formatSmartTime } from '../../../../utils/date-utils';

interface ShenyuMessageBubbleProps {
  message: ShenyuMessage;
  loading?: boolean;
}

/**
 * 神谕消息气泡组件
 * 
 * 根据消息类型渲染不同的子组件，支持JSON、Prompt和Process三种类型
 */
const ShenyuMessageBubble: React.FC<ShenyuMessageBubbleProps> = ({ 
  message, 
  loading = false 
}) => {
  // 用于切换API原始响应和JSON视图
  const [activeView, setActiveView] = useState<'json' | 'raw'>('json');

  return (
    <div 
      id={`message-${message.id}`}
      className="shenyu-message-item ai" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 'var(--space-md)'
      }}
    >
      {/* 消息头部：发送者和时间 */}
      <div 
        className="message-header"
        style={{
          textAlign: 'left',
          width: '80%', 
          color: 'var(--text-light-gray)',
          fontSize: 'var(--font-sm)',
          marginBottom: 'var(--space-xs)'
        }}
      >
        {SHENYU_AI_NAME}
        <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--font-xs)' }}>
          {formatSmartTime(message.timestamp)}
        </span>
      </div>
      
      {/* 消息内容 */}
      <div 
        className="message-bubble ai"
        style={{
          backgroundColor: 'var(--ai-bubble)',
          color: 'var(--text-white)',
          padding: 'var(--space-md)',
          borderRadius: '0px 6px 6px',
          width: '80%',
          minWidth: '200px',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 2px',
          position: 'relative',
          alignSelf: 'flex-start'
        }}
      >
        {loading ? (
          // 显示加载状态
          <div className="loading-state" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* 旋转的绿色圆圈 */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid var(--brand-color)',
                borderTopColor: 'transparent',
                marginRight: 'var(--space-xs)',
                animation: 'spinner 0.8s linear infinite'
              }}></div>
              <span>神谕运行中</span>
              
              {/* 添加旋转动画的样式 */}
              <style>{`
                @keyframes spinner {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-light-gray)', fontStyle: 'italic' }}>
              可能需要几秒钟
            </div>
          </div>
        ) : (
          <JsonMessageBubble message={message} loading={false} />
        )}
      </div>
    </div>
  );
};

export default ShenyuMessageBubble;
