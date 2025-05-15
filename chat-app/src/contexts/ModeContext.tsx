import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ChatMode } from '../components/Shenyu/types';

/**
 * 模式上下文类型定义
 */
interface ModeContextType {
  currentMode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

// 创建模式上下文，默认为May模式
const ModeContext = createContext<ModeContextType>({
  currentMode: 'may',
  setMode: () => {}
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

  return (
    <ModeContext.Provider value={{ currentMode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export default ModeContext;
