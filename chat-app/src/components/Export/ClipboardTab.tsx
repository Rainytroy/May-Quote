import React from 'react';

interface ClipboardTabProps {
  id: string;
  title: string;
  isActive: boolean;
  closable: boolean;
  onClick: () => void;
  onClose?: () => void;
}

/**
 * VS Code风格的Tab组件
 * 
 * 设计为方角、扁平化的样式，提供可定制的标题和可选的关闭按钮
 */
const ClipboardTab: React.FC<ClipboardTabProps> = ({
  id,
  title,
  isActive,
  closable,
  onClick,
  onClose
}) => {
  // 阻止关闭按钮点击事件传播到tab本身
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) onClose();
  };
  
  return (
    <div
      className={`clipboard-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{
        padding: 'var(--space-xs) var(--space-md)',
        backgroundColor: isActive ? 'var(--secondary-bg)' : 'var(--sidebar-bg)',
        color: isActive ? 'var(--text-white)' : 'var(--text-mid-gray)',
        cursor: 'pointer',
        border: isActive ? '1px solid var(--border-color)' : 'none',
        borderBottom: isActive ? 'none' : `1px solid var(--border-color)`,
        borderTop: `2px solid ${isActive ? 'var(--brand-color)' : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--font-sm)',
        position: 'relative',
        userSelect: 'none',
        height: '32px',
        minWidth: '100px',
        maxWidth: '200px',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </span>
      
      {closable && (
        <button
          onClick={handleCloseClick}
          aria-label="关闭标签页"
          title="关闭标签页"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-mid-gray)',
            marginLeft: 'var(--space-xs)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
          }}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ClipboardTab;
