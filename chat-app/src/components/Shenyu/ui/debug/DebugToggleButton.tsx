import React from 'react';
import '../debug/ShenyuDebugPanel.css';

interface DebugToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

/**
 * 调试模式切换按钮
 * 
 * 用于打开/关闭神谕调试面板
 */
const DebugToggleButton: React.FC<DebugToggleButtonProps> = ({ isActive, onClick }) => {
  return (
    <button 
      className={`debug-toggle-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title="神谕调试面板"
    >
      <span className="debug-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M12 16v.01"></path>
          <path d="M12 8v4"></path>
        </svg>
      </span>
      <span className="debug-button-text">神谕调试</span>
    </button>
  );
};

export default DebugToggleButton;
