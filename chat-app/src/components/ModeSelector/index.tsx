/**
 * May-Shenyu模式选择器组件
 *
 * 用于在May和神谕之间切换模式，但仅保留UI样式，不绑定功能
 */

import React, { useState } from 'react';
import './custom-styles.css';
import CustomModeSelector from './CustomModeSelector';

export type ChatMode = 'may' | 'shenyu';

interface ModeSelectorProps {
  currentMode?: ChatMode;              // 当前模式
  onChange?: (mode: ChatMode) => void; // 模式变更回调
  disabled?: boolean;                  // 是否禁用(可选)
  className?: string;                  // 自定义CSS类名(可选)
  useNative?: boolean;                 // 是否使用原生选择器(可选)
}

/**
 * 原生模式选择器组件
 */
export const NativeModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode = 'may',
  onChange = () => {},
  disabled = false,
  className = ''
}) => {
  // 添加内部状态跟踪选中模式，仅UI切换，不实现实际功能
  const [selectedMode, setSelectedMode] = useState<ChatMode>(currentMode);
  
  // 处理下拉列表变更
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as ChatMode;
    setSelectedMode(newMode);
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
 * 只保留UI，不绑定功能
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
