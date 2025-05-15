/**
 * 自定义模式选择器组件
 *
 * 用于在May和神谕之间切换模式，带有自定义下拉菜单和更好的样式控制
 * 仅保留UI部分，不包含功能逻辑
 */

import React, { useState, useRef } from 'react';
import { ChatMode } from './index';
import './custom-styles.css';

interface CustomModeSelectorProps {
  currentMode?: ChatMode;              // 当前模式
  onChange?: (mode: ChatMode) => void; // 模式变更回调
  disabled?: boolean;                  // 是否禁用(可选)
  className?: string;                  // 自定义CSS类名(可选)
}

/**
 * 自定义模式选择器组件
 *
 * 实现了一个自定义下拉菜单，而不是使用原生的select元素
 * 仅保留UI，移除实际功能
 */
const CustomModeSelector: React.FC<CustomModeSelectorProps> = ({
  currentMode = 'may',
  onChange = () => {},
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedMode, setSelectedMode] = useState<ChatMode>(currentMode);
  const selectorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 处理选项选择 - 仅UI切换，不实际执行功能
  const handleSelect = (mode: ChatMode) => {
    setSelectedMode(mode);
    setIsOpen(false);
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
