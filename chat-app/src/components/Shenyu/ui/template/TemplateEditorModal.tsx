import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../../types/templateTypes';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, content: string) => void;
  template: PromptTemplate | null;
  mode: 'create' | 'edit';
}

/**
 * 模板编辑器弹窗组件
 * 用于创建或编辑提示词模板
 */
const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  template, 
  mode
}) => {
  // 表单状态
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  
  // 加载模板数据
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && template) {
        setName(template.name);
        setContent(template.content);
      } else {
        // 创建新模板时使用默认值
        setName('');
        setContent('');
      }
      
      // 重置错误状态
      setNameError(null);
      setContentError(null);
    }
  }, [isOpen, template, mode]);
  
  // 验证表单
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('模板名称不能为空');
      isValid = false;
    } else {
      setNameError(null);
    }
    
    if (!content.trim()) {
      setContentError('模板内容不能为空');
      isValid = false;
    } else {
      setContentError(null);
    }
    
    return isValid;
  };
  
  // 处理保存
  const handleSave = () => {
    if (validateForm()) {
      onSave(name, content);
    }
  };
  
  // 如果弹窗关闭，不渲染内容
  if (!isOpen) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {/* 弹窗内容 */}
      <div style={{
        backgroundColor: 'var(--main-bg)',
        borderRadius: 'var(--radius-md)',
        width: '80%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--border-color)'
      }}>
        {/* 弹窗标题 */}
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>
            {mode === 'create' ? '创建新模板' : '编辑模板'}
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light-gray)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 var(--space-xs)',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        
        {/* 弹窗内容 */}
        <div style={{
          padding: 'var(--space-lg)',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* 名称输入 */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label 
              htmlFor="template-name"
              style={{
                display: 'block', 
                marginBottom: 'var(--space-xs)',
                color: 'var(--text-light-gray)',
                fontSize: 'var(--font-sm)'
              }}
            >
              模板名称
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--secondary-bg)',
                border: `1px solid ${nameError ? 'var(--error-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                color: 'var(--text-white)',
                fontSize: 'var(--font-md)'
              }}
              placeholder="输入模板名称"
            />
            {nameError && (
              <div style={{ color: 'var(--error-color)', fontSize: 'var(--font-xs)', marginTop: 'var(--space-xs)' }}>
                {nameError}
              </div>
            )}
          </div>
          
          {/* 内容输入 */}
          <div>
            <label 
              htmlFor="template-content"
              style={{
                display: 'block', 
                marginBottom: 'var(--space-xs)',
                color: 'var(--text-light-gray)',
                fontSize: 'var(--font-sm)'
              }}
            >
              模板内容
            </label>
            <textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: 'var(--secondary-bg)',
                border: `1px solid ${contentError ? 'var(--error-color)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                color: 'var(--text-white)',
                fontSize: 'var(--font-sm)',
                fontFamily: 'monospace',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
              placeholder="输入模板内容"
            />
            {contentError && (
              <div style={{ color: 'var(--error-color)', fontSize: 'var(--font-xs)', marginTop: 'var(--space-xs)' }}>
                {contentError}
              </div>
            )}
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-md)'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-lg)',
              cursor: 'pointer',
              fontSize: 'var(--font-sm)'
            }}
          >
            取消
          </button>
          
          <button
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-lg)',
              cursor: 'pointer',
              fontSize: 'var(--font-sm)',
              fontWeight: 'bold'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorModal;
