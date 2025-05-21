import React from 'react';
import { ShenyuMessage } from '../../types';
import './MessageBubble.css';

interface ProcessMessageBubbleProps {
  message: ShenyuMessage;
}

/**
 * 神谕进度消息气泡组件
 * 
 * 用于展示神谕执行过程中的进度状态
 * 使用方块序列直观展示执行状态
 */
const ProcessMessageBubble: React.FC<ProcessMessageBubbleProps> = ({ message }) => {
  // 从message.progress中提取进度信息
  const progress = message.progress || { current: 0, total: 0, completed: false, cardBlocks: 0, globalBlocks: 0 };
  const { current, total, completed } = progress;
  
  // 确定状态文本
  const statusText = completed ? `${total}/${total} 运行完毕` : `${current}/${total} 执行中`;
  
  return (
    <div className="process-message-content">
      <div className="process-blocks-container">
        {/* 生成方块序列 */}
        {Array.from({ length: total }).map((_, index) => {
          // 判断块状态
          const blockIndex = index + 1;
          let blockClass = "process-block ";
          
          if (completed) {
            // 所有任务完成时，所有方块都变绿
            blockClass += "process-block-completed";
          } else if (blockIndex < current) {
            // 已完成的块
            blockClass += "process-block-completed";
          } else if (blockIndex === current) {
            // 当前正在执行的块（闪动效果）
            blockClass += "process-block-current";
          } else {
            // 未执行的块
            blockClass += "process-block-empty";
          }
          
          return (
            <div key={blockIndex} className={blockClass}>
              {/* 方块内部可以为空，也可以添加简短标识 */}
            </div>
          );
        })}
        
        {/* 进度状态文本 */}
        <span className="process-status">{statusText}</span>
      </div>
    </div>
  );
};

export default ProcessMessageBubble;
