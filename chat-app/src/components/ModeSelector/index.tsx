/**
 * May-Shenyu模式选择器组件
 *
 * 用于在May和神谕之间切换模式，连接到ModeContext实现实际的模式切换
 */

import React, { useState, useEffect } from 'react';
import './custom-styles.css';
import CustomModeSelector from './CustomModeSelector';
import { useMode } from '../../contexts/ModeContext';
import { ChatMode } from '../Shenyu/types';

interface ModeSelectorProps {
  currentMode?: ChatMode;              // 当前模式（可选，如果提供则覆盖上下文）
  onChange?: (mode: ChatMode) => void; // 模式变更回调（可选）
  disabled?: boolean;                  // 是否禁用(可选)
  className?: string;                  // 自定义CSS类名(可选)
  useNative?: boolean;                 // 是否使用原生选择器(可选)
}

/**
 * 原生模式选择器组件
 */
export const NativeModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode: propCurrentMode,
  onChange,
  disabled = false,
  className = ''
}) => {
  // 获取模式上下文
  const { currentMode: contextMode, setMode } = useMode();
  
  // 使用props的currentMode（如果提供）或者上下文中的currentMode
  const effectiveCurrentMode = propCurrentMode || contextMode;
  
  // 添加内部状态跟踪选中模式
  const [selectedMode, setSelectedMode] = useState<ChatMode>(effectiveCurrentMode);
  
  // 当外部currentMode或上下文currentMode改变时更新内部状态
  useEffect(() => {
    setSelectedMode(effectiveCurrentMode);
  }, [effectiveCurrentMode]);
  
  // 处理下拉列表变更
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as ChatMode;
    setSelectedMode(newMode);
    
    // 调用上下文的setMode进行实际模式切换
    setMode(newMode);
    
    // 如果提供了onChange回调，也调用它
    if (onChange) {
      onChange(newMode);
    }
  };

  return (
    <div className={`mode-selector ${className}`}>
      <select
        value={selectedMode}
        onChange={handleChange}
        disabled={disabled}
        className="mode-select"
        title="切换对话模式"
        aria-label="对话模式"
      >
        <option value="may">@May</option>
        <option value="shenyu">@神谕</option>
      </select>
    </div>
  );
};

/**
 * 模式选择器组件
 *
 * 在对话界面提供模式切换下拉列表，支持在May和神谕模式间切换
 * 默认使用自定义的样式更丰富的CustomModeSelector
 * 实现了与ModeContext的连接，使模式切换功能生效
 */
const ModeSelector: React.FC<ModeSelectorProps> = (props) => {
  // 如果指定使用原生选择器，则使用原生组件
  if (props.useNative) {
    return <NativeModeSelector {...props} />;
  }

  // 默认使用自定义选择器
  return <CustomModeSelector {...props} />;
};

export default ModeSelector;
