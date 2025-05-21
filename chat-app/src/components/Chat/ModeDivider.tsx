import React from 'react';
import { ChatMode } from '../Shenyu/types';

interface ModeDividerProps {
  mode: ChatMode;
}

/**
 * 模式切换分割线组件
 * 
 * 显示一个简单的文本分割线，指示模式已切换
 */
const ModeDivider: React.FC<ModeDividerProps> = ({ mode }) => {
  // 根据模式确定显示的文本
  const modeText = mode === 'shenyu' ? '@神谕' : '@May';
  const description = mode === 'shenyu' 
    ? '用提示词构造结构化卡片-再生成丰富内容'
    : '可以引用、收藏、新开对话的ChatApp，助你遴选内容';
  
  return (
    <div 
      className="mode-divider"
      style={{
        width: '100%',
        textAlign: 'center',
        color: 'var(--text-white)',
        margin: '16px 0'
      }}
    >
      <div style={{ 
        fontSize: 'var(--font-sm)'
      }}>
        {`—————————— ${modeText} ——————————`}
      </div>
      <div style={{ 
        fontSize: 'var(--font-xs)',
        marginTop: '4px'
      }}>
        {description}
      </div>
    </div>
  );
};

export default ModeDivider;
