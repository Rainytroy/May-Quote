/**
 * CommandMenu.tsx
 * 
 * 命令菜单组件，显示可用的命令选项
 * 用于输入"/"后显示的命令列表
 */

import React, { useRef, useEffect } from 'react';

export interface Command {
  id: string;          // 命令ID
  name: string;        // 命令名称
  description: string; // 命令描述
  prefix: string;      // 命令前缀，如"/神谕:"
  icon?: React.ReactNode; // 可选图标
}

interface CommandMenuProps {
  commands: Command[];                // 命令列表
  isOpen: boolean;                    // 是否显示
  activeIndex: number;                // 激活的命令索引
  onSelect: (command: Command) => void; // 选择命令回调
  onClose: () => void;                // 关闭回调
  position?: { top: number; left: number }; // 位置
}

/**
 * 命令菜单组件
 */
const CommandMenu: React.FC<CommandMenuProps> = ({
  commands,
  isOpen,
  activeIndex,
  onSelect,
  onClose,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
          if (commands[activeIndex]) {
            onSelect(commands[activeIndex]);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, commands, activeIndex, onSelect]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={menuRef}
      className="command-menu"
      style={{
        position: 'absolute',
        top: position?.top || '100%',
        left: position?.left || 0,
        width: '250px',
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-color)',
        zIndex: 1000,
        padding: 'var(--space-xs)',
      }}
    >
      <div style={{ padding: 'var(--space-xs)', color: 'var(--text-light-gray)', fontSize: 'var(--font-xs)' }}>
        可用命令
      </div>
      
      {commands.map((command, index) => (
        <div
          key={command.id}
          onClick={() => onSelect(command)}
          style={{
            padding: 'var(--space-sm)',
            cursor: 'pointer',
            backgroundColor: index === activeIndex ? 'var(--hover-bg)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          {command.icon && <div>{command.icon}</div>}
          
          <div>
            <div style={{ fontWeight: 500 }}>{command.name}</div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-light-gray)' }}>
              {command.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommandMenu;
