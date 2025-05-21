import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ChatMode } from '../components/Shenyu/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 模式上下文类型定义
 */
interface ModeContextType {
  currentMode: ChatMode;
  setMode: (mode: ChatMode) => void;
  addModeDivider: (mode: ChatMode, conversationId: string) => void;
}

/**
 * 模式切换事件类型，供ChatInterface组件监听
 */
export interface ModeSwitchEvent {
  mode: ChatMode;
  id: string;
  conversationId: string;
}

// 创建模式上下文，默认为May模式
const ModeContext = createContext<ModeContextType>({
  currentMode: 'may',
  setMode: () => {},
  addModeDivider: () => {} // 添加默认实现
});

/**
 * 使用模式上下文的Hook
 * @returns 模式上下文对象
 */
export const useMode = () => useContext(ModeContext);

interface ModeProviderProps {
  children: ReactNode;
}

/**
 * 模式提供者组件 - 管理应用当前的聊天模式
 */
export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<ChatMode>('may'); // 默认为May模式

  // 模式切换函数
  const setMode = (mode: ChatMode) => {
    console.log(`Mode switching from ${currentMode} to ${mode}`);
    setCurrentMode(mode);
  };

  // 添加模式分割线函数
  const addModeDivider = useCallback((mode: ChatMode, conversationId: string) => {
    console.log(`Adding mode divider for ${mode} in conversation ${conversationId}`);
    // 创建一个自定义事件，含模式信息和唯一ID
    const event = new CustomEvent('mode-divider-added', {
      detail: {
        mode,
        conversationId,
        id: uuidv4()
      } as ModeSwitchEvent
    });
    
    // 触发事件，供ChatInterface监听
    window.dispatchEvent(event);
  }, []);

  return (
    <ModeContext.Provider value={{ currentMode, setMode, addModeDivider }}>
      {children}
    </ModeContext.Provider>
  );
};

export default ModeContext;
