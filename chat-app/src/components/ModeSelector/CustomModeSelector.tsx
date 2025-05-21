/**
 * 自定义模式选择器组件
 *
 * 用于在May和神谕之间切换模式，带有自定义下拉菜单和更好的样式控制
 * 连接到ModeContext实现实际的模式切换
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMode } from '../Shenyu/types';
import './custom-styles.css';
import { useMode } from '../../contexts/ModeContext';

interface CustomModeSelectorProps {
  currentMode?: ChatMode;              // 当前模式（可选，如果提供则覆盖上下文）
  onChange?: (mode: ChatMode) => void; // 模式变更回调（可选）
  disabled?: boolean;                  // 是否禁用(可选)
  className?: string;                  // 自定义CSS类名(可选)
}

/**
 * 自定义模式选择器组件
 *
 * 实现了一个自定义下拉菜单，而不是使用原生的select元素
 * 连接到ModeContext实现实际的模式切换
 */
const CustomModeSelector: React.FC<CustomModeSelectorProps> = ({
  currentMode: propCurrentMode,
  onChange,
  disabled = false,
  className = ''
}) => {
  // 获取模式上下文
  const { currentMode: contextMode, setMode, addModeDivider } = useMode();
  
  // 使用props的currentMode（如果提供）或者上下文中的currentMode
  const effectiveCurrentMode = propCurrentMode || contextMode;
  
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedMode, setSelectedMode] = useState<ChatMode>(effectiveCurrentMode);
  const selectorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 当外部currentMode或上下文currentMode改变时更新内部状态
  useEffect(() => {
    setSelectedMode(effectiveCurrentMode);
  }, [effectiveCurrentMode]);

  // 模式选项
  const options: { value: ChatMode, label: string }[] = [
    { value: 'may', label: '@May' },
    { value: 'shenyu', label: '@神谕' }
  ];

  // 切换下拉菜单开关
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    
    // 计算弹窗位置 - 优先显示在上方
    if (!isOpen && selectorRef.current) {
      const rect = selectorRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 100; // 估计的菜单高度
      
      // 始终优先显示在上方
      setDropdownPosition({
        top: rect.top - menuHeight - 4, // 上方显示时减去菜单高度和边距
        left: rect.left
      });
    }
  };

  // 处理选项选择 - 现在连接到ModeContext执行实际功能
  const handleSelect = (mode: ChatMode) => {
    // 只有当选择了不同模式时才执行操作
    if (mode !== selectedMode) {
      setSelectedMode(mode);
      setIsOpen(false);
      
      // 调用上下文的setMode进行实际模式切换
      setMode(mode);
      
      // 尝试获取当前对话ID - 从URL中提取
      const urlParams = new URLSearchParams(window.location.search);
      const conversationId = urlParams.get('id') || 'unknown';
      
      // 添加模式分割线
      addModeDivider(mode, conversationId);
      
      // 如果提供了onChange回调，也调用它
      if (onChange) {
        onChange(mode);
      }
    } else {
      // 如果选择了当前已选模式，只关闭下拉菜单
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={selectorRef}
      className={`custom-mode-selector ${className} ${disabled ? 'disabled' : ''}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={() => {}}
      aria-haspopup="listbox"
      aria-expanded="false"
      aria-disabled="false"
      aria-controls="mode-dropdown-list"
      role="combobox"
    >
      {/* 当前选择的显示区域 */}
      <div
        className="mode-display"
        onClick={toggleDropdown}
      >
        <span className="mode-text">{options.find(opt => opt.value === selectedMode)?.label}</span>
        <span className="mode-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="mode-dropdown-list"
          className="mode-dropdown"
          role="listbox"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {options.map(option => (
            <div
              key={option.value}
              className={`mode-option ${selectedMode === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected="false"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomModeSelector;
