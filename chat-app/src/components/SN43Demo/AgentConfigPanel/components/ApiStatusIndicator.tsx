import React, { useState, useEffect } from 'react';
import { mayApi } from '../../api/mayApi';

/**
 * API状态指示器组件
 * 
 * 显示API连接状态的精简组件，鼠标悬停时展示详细信息
 */
const ApiStatusIndicator: React.FC = () => {
  // API配置状态
  const [apiConfig, setApiConfig] = useState<{
    baseUrl: string;
    apiKey?: string;
    initialized: boolean;
    modelId?: string;
    modelName?: string;
  }>({ baseUrl: '', initialized: false });
  
  // 悬停状态
  const [isHovered, setIsHovered] = useState(false);
  
  // 获取当前的API配置
  useEffect(() => {
    const updateApiConfig = () => {
      const config = mayApi.getApiConfig();
      setApiConfig(config);
    };
    
    // 初始加载时获取配置
    updateApiConfig();
    
    // 定期刷新配置
    const intervalId = setInterval(updateApiConfig, 5000);
    
    // 清理函数
    return () => clearInterval(intervalId);
  }, []);
  
  // 手动刷新API配置
  const refreshApiConfig = () => {
    setApiConfig(mayApi.getApiConfig());
  };
  
  // 获取简化的模型名称
  const getShortModelName = () => {
    if (!apiConfig.modelName) return '未知模型';
    
    // 尝试提取模型名称的主要部分
    // 例如从 "火山DeepSeek V3 (deepseek-v3-250324)" 提取 "DeepSeek V3"
    const match = apiConfig.modelName.match(/DeepSeek\s+V\d+/i);
    if (match) return match[0];
    
    // 如果没有匹配到特定模式，则返回前15个字符
    return apiConfig.modelName.length > 15 
      ? apiConfig.modelName.substring(0, 15) + '...' 
      : apiConfig.modelName;
  };
  
  // 遮蔽API密钥
  const maskApiKey = (key?: string) => {
    if (!key) return '未设置';
    if (key.length <= 8) return '******';
    return '******' + key.slice(-4);
  };

  return (
    <div 
      className="api-status-indicator"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* 简化版状态指示器 - 默认显示 */}
      <div 
        className="status-indicator-simple"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: 'var(--space-xs) var(--space-sm)',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
        }}
      >
        {/* 状态指示点 */}
        <div 
          className="status-dot"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: apiConfig.initialized ? 'var(--brand-color)' : 'var(--error-color)',
          }}
        />
        
        {/* 简化模型名称 */}
        <span 
          className="model-name-short"
          style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-light-gray)',
          }}
        >
          {getShortModelName()}
        </span>
        
        {/* 刷新按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            refreshApiConfig();
          }}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-light-gray)',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            fontSize: 'var(--font-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="刷新API配置"
        >
          ⟳
        </button>
      </div>
      
      {/* 详细信息卡片 - 悬停时显示 */}
      {isHovered && (
        <div 
          className="status-indicator-detailed"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            right: 0,
            width: '250px',
            backgroundColor: 'var(--card-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-sm)',
          }}>
            <h3 style={{ 
              color: 'var(--text-white)', 
              margin: 0, 
              fontSize: 'var(--font-sm)' 
            }}>
              MayAPI配置状态
            </h3>
            <button
              onClick={refreshApiConfig}
              style={{
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-xs)',
              }}
            >
              刷新配置
            </button>
          </div>
          
          <div style={{ 
            color: 'var(--text-light-gray)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-xs)',
          }}>
            <div>BaseURL: <span style={{ color: 'var(--text-white)' }}>{apiConfig.baseUrl}</span></div>
            <div>API密钥: <span style={{ color: apiConfig.apiKey ? 'var(--brand-color)' : 'var(--error-color)' }}>
              {maskApiKey(apiConfig.apiKey)}
            </span></div>
            <div>模型: <span style={{ color: 'var(--text-white)' }}>
              {apiConfig.modelName} <span style={{ color: 'var(--text-light-gray)' }}>({apiConfig.modelId})</span>
            </span></div>
            <div>初始化状态: <span style={{ 
              color: apiConfig.initialized ? 'var(--brand-color)' : 'var(--error-color)',
            }}>
              {apiConfig.initialized ? '已初始化' : '未初始化'}
            </span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator;
