/**
 * ShenyuBubble.tsx
 * 
 * 神谕响应气泡组件，用于在对话界面中显示神谕的JSON响应
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ShenyuMessage, ShenyuBubbleProps } from '../Shenyu/types';
import { formatJson } from '../Shenyu/core/JsonExtractor';

/**
 * 神谕气泡组件
 * 显示神谕响应，包括JSON结构和元数据
 */
const ShenyuBubble: React.FC<ShenyuBubbleProps> = ({
  message,
  onEdit,
  onView
}) => {
  if (!message) return null;
  
  // 如果消息仍在加载中，显示加载状态
  if (message.loading) {
    return (
      <div className="message-bubble shenyu-bubble loading">
        <div className="bubble-header">
          <div className="sender">{message.sender || 'May the 神谕 be with you'}</div>
        </div>
        <div className="bubble-content">
          <div className="loading-indicator">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 提取shenyuData (如果存在)
  const jsonData = message.shenyuData || {
    isValidJson: false,
    jsonContent: null,
    templateName: '未知模板',
    cards: 0,
    adminInputs: 0,
    promptBlocks: 0,
    hasGlobalPrompt: false
  };
  const isValidJson = jsonData.isValidJson !== false;
  
  // 计算JSON结构信息
  const structureInfo = isValidJson ? [
    jsonData.cards ? `${jsonData.cards} 张卡片` : '',
    jsonData.adminInputs ? `${jsonData.adminInputs} 个管理员输入` : '',
    jsonData.promptBlocks ? `${jsonData.promptBlocks} 个提示词块` : '',
    jsonData.hasGlobalPrompt ? "含全局提示词" : ''
  ].filter(Boolean).join(' · ') : '';
  
  // 气泡样式
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-md)',
    margin: 'var(--space-sm) 0',
    maxWidth: '90%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  };
  
  // 气泡头部样式
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-sm)',
    color: 'var(--text-light-gray)',
    fontSize: 'var(--font-xs)'
  };
  
  // 发送者样式
  const senderStyle: React.CSSProperties = {
    fontWeight: 600,
    color: 'var(--brand-color)'
  };
  
  // 模板名称样式
  const templateNameStyle: React.CSSProperties = {
    fontStyle: 'italic'
  };
  
  // 结构信息样式
  const structureInfoStyle: React.CSSProperties = {
    backgroundColor: 'var(--secondary-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-xs) var(--space-sm)',
    fontSize: 'var(--font-xs)',
    marginBottom: 'var(--space-sm)',
    color: 'var(--text-white)'
  };
  
  // 警告样式
  const warningStyle: React.CSSProperties = {
    backgroundColor: 'var(--warning-bg)',
    color: 'var(--warning-color)',
    padding: 'var(--space-xs) var(--space-sm)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-sm)',
    fontSize: 'var(--font-xs)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };
  
  // 内容样式
  const contentStyle: React.CSSProperties = {
    marginBottom: 'var(--space-sm)'
  };
  
  // JSON代码块样式
  const jsonContentStyle: React.CSSProperties = {
    backgroundColor: 'var(--main-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-sm)',
    overflow: 'auto',
    maxHeight: '300px',
    fontFamily: 'monospace',
    fontSize: 'var(--font-xs)',
    color: 'var(--text-code)'
  };
  
  // 纯文本内容样式
  const textContentStyle: React.CSSProperties = {
    color: 'var(--text-white)'
  };
  
  // 操作按钮区样式
  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-sm)'
  };
  
  // 按钮样式
  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-xs) var(--space-sm)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--secondary-bg)',
    color: 'var(--text-white)',
    cursor: 'pointer',
    fontSize: 'var(--font-xs)',
    transition: 'all 0.2s'
  };
  
  // 警告图标
  const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
  
  // 编辑图标
  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
  
  // 查看图标
  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  );
  
  return (
    <div 
      className={`message-bubble shenyu-bubble ${!isValidJson ? 'text-only' : ''}`}
      style={bubbleStyle}
    >
      {/* 顶部：显示发送者、模板名称和时间 */}
      <div className="bubble-header" style={headerStyle}>
        <div className="sender" style={senderStyle}>{message.sender || 'May the 神谕 be with you'}</div>
        <div className="template-name" style={templateNameStyle}>
          神谕版本：{jsonData.templateName || '未知模板'}
        </div>
      </div>
      
      {/* JSON结构概览 - 仅在有效JSON时显示 */}
      {isValidJson && structureInfo && (
        <div className="structure-info" style={structureInfoStyle}>
          {structureInfo}
        </div>
      )}
      
      {/* 无效JSON警告 */}
      {!isValidJson && (
        <div className="invalid-json-warning" style={warningStyle}>
          <WarningIcon />
          <span>未能生成有效的JSON结构</span>
        </div>
      )}
      
      {/* 内容区：根据内容类型渲染 */}
      <div 
        className={`bubble-content ${!isValidJson ? 'text-content' : 'json-content'}`}
        style={{...contentStyle, ...(isValidJson ? jsonContentStyle : textContentStyle)}}
      >
        {isValidJson ? (
          <pre>
            <code>{formatJson(jsonData.jsonContent || message.content)}</code>
          </pre>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
      
      {/* 底部：操作按钮 */}
      <div className="bubble-actions" style={actionsStyle}>
        <button 
          className="action-button edit" 
          style={buttonStyle}
          onClick={onEdit}
        >
          <EditIcon />
          修改
        </button>
        <button 
          className="action-button view" 
          style={buttonStyle}
          onClick={onView}
        >
          <ViewIcon />
          查看
        </button>
      </div>
    </div>
  );
};

export default ShenyuBubble;
