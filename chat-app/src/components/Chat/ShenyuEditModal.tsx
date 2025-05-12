/**
 * ShenyuEditModal.tsx
 * 
 * 神谕编辑模态框组件，用于在用户点击修改按钮后打开一个模态框进行修改
 */

import React, { useState, useEffect } from 'react';
import { ShenyuEditModalProps } from '../Shenyu/types';
import { formatJson } from '../Shenyu/core/JsonExtractor';

/**
 * 神谕编辑模态框组件
 */
const ShenyuEditModal: React.FC<ShenyuEditModalProps> = ({
  isOpen,
  onClose,
  message,
  onSubmit
}) => {
  const [editContent, setEditContent] = useState<string>('');
  const [jsonData, setJsonData] = useState<any>(null);
  
  // 当消息变化时，更新编辑内容
  useEffect(() => {
    if (message && isOpen) {
      setEditContent('');
      const data = message.shenyuData || {};
      setJsonData(data);
    }
  }, [message, isOpen]);
  
  if (!isOpen || !message) return null;
  
  const isValidJson = jsonData?.isValidJson !== false;
  
  // 结构分析项目
  const structureItems = [
    { label: '卡片数量', value: jsonData?.cards || 0 },
    { label: '管理员输入字段', value: jsonData?.adminInputs || 0 },
    { label: '提示词块', value: jsonData?.promptBlocks || 0 },
    { label: '全局提示词', value: jsonData?.hasGlobalPrompt ? '存在' : '不存在' }
  ];
  
  // 模态框样式
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)'
  };
  
  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--radius-lg)',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    padding: 'var(--space-md)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 'var(--space-sm)'
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--text-white)'
  };
  
  const closeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-light-gray)',
    fontSize: 'var(--font-xl)',
    cursor: 'pointer',
    padding: 'var(--space-xs)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px'
  };
  
  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    overflow: 'auto',
    flex: 1
  };
  
  const sectionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-md)'
  };
  
  const sectionStyle: React.CSSProperties = {
    flex: 1
  };
  
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: 'var(--text-white)',
    marginBottom: 'var(--space-sm)'
  };
  
  const jsonPreviewStyle: React.CSSProperties = {
    backgroundColor: 'var(--main-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-sm)',
    overflow: 'auto',
    maxHeight: '200px',
    fontFamily: 'monospace',
    fontSize: 'var(--font-xs)',
    color: 'var(--text-code)',
    marginBottom: 'var(--space-md)'
  };
  
  const structureListStyle: React.CSSProperties = {
    backgroundColor: 'var(--main-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-sm)',
    marginBottom: 'var(--space-md)'
  };
  
  const structureItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'var(--space-xs) 0',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-light-gray)'
  };
  
  const inputLabelStyle: React.CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-white)',
    marginBottom: 'var(--space-xs)'
  };
  
  const textAreaStyle: React.CSSProperties = {
    backgroundColor: 'var(--main-bg)',
    color: 'var(--text-white)',
    borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-sm)',
    border: '1px solid var(--border-color)',
    width: '100%',
    minHeight: '120px',
    fontFamily: 'inherit',
    fontSize: 'var(--font-sm)',
    resize: 'vertical'
  };
  
  const warningStyle: React.CSSProperties = {
    backgroundColor: 'var(--warning-bg)',
    color: 'var(--warning-color)',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-md)',
    fontSize: 'var(--font-sm)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-sm)'
  };
  
  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-md)',
    paddingTop: 'var(--space-sm)',
    borderTop: '1px solid var(--border-color)'
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: 'var(--space-sm) var(--space-md)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
  
  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'var(--brand-color)',
    color: 'var(--text-white)'
  };
  
  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'var(--secondary-bg)',
    color: 'var(--text-white)'
  };

  // 警告图标
  const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
  
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>修改神谕响应</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            &times;
          </button>
        </div>
        
        {/* 主体 */}
        <div style={bodyStyle}>
          <div style={sectionsContainerStyle}>
            {/* 左侧：当前JSON预览和结构分析 */}
            <div style={sectionStyle}>
              <h3 style={sectionHeaderStyle}>当前响应</h3>
              
              {isValidJson ? (
                <div style={jsonPreviewStyle}>
                  <pre>
                    <code>{formatJson(jsonData.jsonContent || message.content)}</code>
                  </pre>
                </div>
              ) : (
                <div style={warningStyle}>
                  <WarningIcon />
                  <div>
                    <p>当前响应不包含有效的JSON结构。</p>
                    <p>请在下方提供明确的修改请求，以便生成有效的JSON。</p>
                  </div>
                </div>
              )}
              
              {/* 仅在有效JSON时显示结构分析 */}
              {isValidJson && (
                <>
                  <h3 style={sectionHeaderStyle}>当前JSON结构</h3>
                  <div style={structureListStyle}>
                    {structureItems.map((item, index) => (
                      <div key={index} style={structureItemStyle}>
                        <span>{item.label}:</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* 右侧：修改请求输入区 */}
            <div style={sectionStyle}>
              <h3 style={sectionHeaderStyle}>修改请求</h3>
              
              {/* 非JSON情况的特殊提示 */}
              {!isValidJson && (
                <div style={warningStyle}>
                  <WarningIcon />
                  <div>
                    <p>上一次响应没有生成有效的JSON结构。请尝试提供更明确的指示，例如：</p>
                    <ul>
                      <li>"请使用JSON格式返回，包含adminInputs和promptBlocks字段"</li>
                      <li>"我需要一个包含3个管理员输入和2个提示词块的JSON结构"</li>
                      <li>"请按照多卡片系统格式构建JSON响应"</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="editContent" style={inputLabelStyle}>
                  请描述您希望如何修改当前的响应：
                </label>
                <textarea
                  id="editContent"
                  style={textAreaStyle}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="例如：'增加一个关于产品评分的管理员输入字段' 或 '将卡片数量增加到3个'"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div style={footerStyle}>
          <button style={secondaryButtonStyle} onClick={onClose}>
            取消
          </button>
          <button 
            style={primaryButtonStyle}
            onClick={() => {
              if (editContent.trim()) {
                onSubmit(editContent);
                onClose();
              }
            }}
            disabled={!editContent.trim()}
          >
            提交修改
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShenyuEditModal;
