import React from 'react';
import { ShenyuMessage } from '../../types';
import { SHENYU_AI_NAME } from '../../utils/shenyuSystemPrompt';
import { formatSmartTime } from '../../../../utils/date-utils';
import './MessageBubble.css';

interface ProcessMessageBubbleProps {
  message: ShenyuMessage;
}

/**
 * 神谕进度消息气泡组件
 * 
 * 用于展示神谕执行过程中的进度状态
 * 复用SN43DEMO的进度显示样式
 */
const ProcessMessageBubble: React.FC<ProcessMessageBubbleProps> = ({ message }) => {
  // 从message.progress中提取进度信息
  const progress = message.progress || { current: 0, total: 0, completed: false, cardBlocks: 0, globalBlocks: 0 };
  const percentComplete = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  
  return (
    <div className="process-message-content">
      {/* 进度指示器 - 复用SN43Demo的样式 */}
      <div className="shenyu-progress-container">
        <div className="shenyu-progress-header">
          <span className="shenyu-progress-title">神谕执行进度</span>
          <span className="shenyu-progress-percent">{percentComplete}% 完成</span>
        </div>
        
        <div className="shenyu-progress-bar-container">
          <div 
            className="shenyu-progress-bar" 
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        
        <div className="shenyu-block-status-list">
          {/* 动态生成每个块的状态指示器 */}
          {Array.from({ length: progress.total }).map((_, index) => {
            const blockIndex = index + 1;
            const status = blockIndex < progress.current 
              ? 'completed' 
              : blockIndex === progress.current 
                ? 'streaming' 
                : 'pending';
                
            return (
              <div key={blockIndex} className="shenyu-block-status-item">
                <span className="shenyu-block-index">提示词块 {blockIndex}</span>
                <span className={`shenyu-status-tag ${status}`}>
                  {status === 'pending' && '等待中'}
                  {status === 'streaming' && (
                    <>
                      处理中
                      <span className="shenyu-loading-dots">
                        <span className="shenyu-dot"></span>
                        <span className="shenyu-dot"></span>
                        <span className="shenyu-dot"></span>
                      </span>
                    </>
                  )}
                  {status === 'completed' && '已完成'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessMessageBubble;
