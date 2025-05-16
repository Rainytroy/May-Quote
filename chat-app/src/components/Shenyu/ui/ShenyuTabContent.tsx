import React, { useState, useEffect } from 'react';
import { useMode } from '../../../contexts/ModeContext';
import ShenyuCardView from './ShenyuCardView';

interface ShenyuTabContentProps {
  className?: string;
}

/**
 * 神谕标签页内容组件
 * 
 * 专门用于剪贴板区域的神谕标签页，负责与神谕消息系统集成
 * 并确保与剪贴板功能完全隔离
 */
const ShenyuTabContent: React.FC<ShenyuTabContentProps> = ({ 
  className 
}) => {
  // 示例JSON内容，后续可从消息系统获取
  const [jsonContent, setJsonContent] = useState<string>('');
  const { currentMode } = useMode();
  
  // 监听JSON查看事件
  useEffect(() => {
    // 处理查看JSON事件的回调
    const handleViewJson = (event: CustomEvent) => {
      if (event.detail && event.detail.jsonContent) {
        // 清空现有数据并设置新内容
        setJsonContent(event.detail.jsonContent);
        
        // 尝试激活神谕标签页
        try {
          const { setActiveTabId } = window as any;
          if (typeof setActiveTabId === 'function') {
            setActiveTabId('shenyu');
          }
        } catch (error) {
          console.error('无法激活神谕标签页:', error);
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('shenyu-view-json', handleViewJson as EventListener);
    
    // 清理函数 - 移除事件监听器
    return () => {
      window.removeEventListener('shenyu-view-json', handleViewJson as EventListener);
    };
  }, []);
  
  // 初始化默认内容
  useEffect(() => {
    // 如果没有内容，提供默认空JSON结构
    if (!jsonContent) {
      setJsonContent(JSON.stringify({
        name: "神谕配置示例",
        cards: [],
        globalPromptBlocks: {}
      }));
    }
  }, []);
  
  return (
    <div className={`shenyu-tab-content ${className || ''}`} style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <ShenyuCardView 
        jsonContent={jsonContent}
      />
    </div>
  );
};

export default ShenyuTabContent;
