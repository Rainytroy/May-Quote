import React, { useState, useEffect } from 'react';
import './ShenyuDebugPanel.css';

// 调试面板渲染的数据结构
interface DebugData {
  timestamp: number;
  systemPrompt: string;
  userInput: string;
  contextMessagesCount: number;
  fullPayload: any[];
  response?: string;
}

interface ShenyuDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 神谕调试面板组件
 * 
 * 显示API请求和响应的详细信息，帮助开发者调试
 */
const ShenyuDebugPanel: React.FC<ShenyuDebugPanelProps> = ({ isOpen, onClose }) => {
  const [logData, setLogData] = useState<DebugData[]>([]);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  
  // 监听全局调试事件
  useEffect(() => {
    const handleDebugEvent = (event: CustomEvent) => {
      const { detail } = event;
      setLogData(prevData => {
        // 保留最新的20条记录
        const newData = [detail, ...prevData].slice(0, 20);
        return newData;
      });
      
      // 自动选择最新的记录
      setSelectedEntry(0);
    };
    
    // 添加自定义事件监听器
    window.addEventListener('shenyu-debug' as any, handleDebugEvent as any);
    
    return () => {
      // 移除事件监听器
      window.removeEventListener('shenyu-debug' as any, handleDebugEvent as any);
    };
  }, []);
  
  // 渲染请求内容
  const renderRequestContent = () => {
    if (selectedEntry === null || !logData[selectedEntry]) return null;
    
    const entry = logData[selectedEntry];
    
    return (
      <div className="debug-content-panel">
        <div className="debug-section">
          <h3 className="debug-section-title">系统提示词</h3>
          <pre className="debug-code-block">{entry.systemPrompt}</pre>
        </div>
        
        <div className="debug-section">
          <h3 className="debug-section-title">用户输入</h3>
          <pre className="debug-code-block">{entry.userInput}</pre>
        </div>
        
        <div className="debug-section">
          <h3 className="debug-section-title">上下文消息</h3>
          <div className="debug-info">
            <span className="debug-label">消息数量:</span>
            <span className="debug-value">{entry.contextMessagesCount}</span>
          </div>
        </div>
        
        <div className="debug-section">
          <h3 className="debug-section-title">完整请求负载</h3>
          <pre className="debug-code-block">{JSON.stringify(entry.fullPayload, null, 2)}</pre>
        </div>
      </div>
    );
  };
  
  // 渲染响应内容
  const renderResponseContent = () => {
    if (selectedEntry === null || !logData[selectedEntry]) return null;
    
    const entry = logData[selectedEntry];
    
    return (
      <div className="debug-content-panel">
        <div className="debug-section">
          <h3 className="debug-section-title">API响应</h3>
          {entry.response ? (
            <pre className="debug-code-block">{entry.response}</pre>
          ) : (
            <div className="debug-no-data">暂无响应数据</div>
          )}
        </div>
      </div>
    );
  };
  
  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="shenyu-debug-panel">
      <div className="debug-header">
        <h2 className="debug-title">神谕调试面板</h2>
        <button className="debug-close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="debug-body">
        {/* 左侧列表 */}
        <div className="debug-sidebar">
          <div className="debug-entries-header">请求记录</div>
          <div className="debug-entries-list">
            {logData.length === 0 ? (
              <div className="debug-no-entries">暂无请求记录</div>
            ) : (
              logData.map((entry, index) => (
                <div 
                  key={entry.timestamp}
                  className={`debug-entry ${selectedEntry === index ? 'selected' : ''}`}
                  onClick={() => setSelectedEntry(index)}
                >
                  <span className="debug-entry-time">{formatTimestamp(entry.timestamp)}</span>
                  <span className="debug-entry-label">{entry.userInput.substring(0, 15)}...</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 右侧内容 */}
        <div className="debug-content">
          {/* 标签页 */}
          <div className="debug-tabs">
            <button 
              className={`debug-tab ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              请求内容
            </button>
            <button 
              className={`debug-tab ${activeTab === 'response' ? 'active' : ''}`}
              onClick={() => setActiveTab('response')}
            >
              响应内容
            </button>
          </div>
          
          {/* 内容区域 */}
          <div className="debug-content-area">
            {selectedEntry === null ? (
              <div className="debug-no-selection">请选择左侧的请求记录查看详情</div>
            ) : (
              activeTab === 'request' ? renderRequestContent() : renderResponseContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 触发调试事件的辅助函数
export const triggerDebugEvent = (data: Omit<DebugData, 'timestamp'>) => {
  const event = new CustomEvent('shenyu-debug', {
    detail: {
      ...data,
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(event);
};

export default ShenyuDebugPanel;
