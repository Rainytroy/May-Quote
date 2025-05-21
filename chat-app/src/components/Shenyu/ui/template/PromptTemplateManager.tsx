import React, { useState, useEffect } from 'react';
import { 
  getAllTemplates, 
  getTemplate, 
  createTemplate, 
  updateTemplate, 
  activateTemplate, 
  copyStandardToTemplate, 
  deleteTemplate 
} from '../../../../utils/templateDbService';
import { PromptTemplate } from '../../types/templateTypes';
import TemplateEditorModal from './TemplateEditorModal';

/**
 * 提示词模板管理器组件
 * 用于管理神谕的提示词模板
 */
const PromptTemplateManager: React.FC = () => {
  // 模板列表状态
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 编辑器状态
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  
  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      console.error('加载模板列表失败:', err);
      setError('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 首次加载
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // 处理激活模板
  const handleActivate = async (id: string) => {
    try {
      await activateTemplate(id);
      
      // 更新本地状态
      setTemplates(prev => prev.map(template => ({
        ...template,
        isActive: template.id === id ? 1 : 0
      })));
    } catch (err) {
      console.error('激活模板失败:', err);
      setError('激活模板失败');
    }
  };
  
  // 处理删除模板
  const handleDelete = async (id: string) => {
    try {
      if (window.confirm('确定要删除这个模板吗？此操作不可撤销。')) {
        await deleteTemplate(id);
        // 重新加载模板列表
        await loadTemplates();
      }
    } catch (err) {
      console.error('删除模板失败:', err);
      setError('删除模板失败');
    }
  };
  
  // 处理创建新模板
  const handleCreate = () => {
    setCurrentTemplate(null);
    setEditorMode('create');
    setIsEditorOpen(true);
  };
  
  // 处理编辑模板
  const handleEdit = async (id: string) => {
    try {
      const template = await getTemplate(id);
      if (template) {
        setCurrentTemplate(template);
        setEditorMode('edit');
        setIsEditorOpen(true);
      }
    } catch (err) {
      console.error('加载模板失败:', err);
      setError('加载模板失败');
    }
  };
  
  // 处理复制标准模板
  const handleCopyStandard = async (id: string) => {
    try {
      if (window.confirm('确定要用标准模板覆盖当前内容吗？此操作不可撤销。')) {
        await copyStandardToTemplate(id);
        // 重新加载模板列表
        await loadTemplates();
      }
    } catch (err) {
      console.error('复制标准模板失败:', err);
      setError('复制标准模板失败');
    }
  };
  
  // 保存模板（创建或更新）
  const handleSaveTemplate = async (name: string, content: string) => {
    try {
      if (editorMode === 'create') {
        // 创建新模板
        await createTemplate({
          name,
          content,
          isActive: 0 // 创建后不激活
        });
      } else if (currentTemplate) {
        // 更新现有模板
        await updateTemplate(currentTemplate.id, {
          name,
          content
        });
      }
      
      // 关闭编辑器并重新加载模板列表
      setIsEditorOpen(false);
      await loadTemplates();
    } catch (err) {
      console.error('保存模板失败:', err);
      setError('保存模板失败');
    }
  };
  
  return (
    <div className="prompt-template-manager">
      {/* 标题和操作栏 */}
      <div className="navbar" style={{ display: 'flex', alignItems: 'center', height: 'var(--nav-height)', padding: '0 var(--space-lg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="logo" style={{ color: 'var(--brand-color)', fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>
          神谕提示词模板
        </div>
        
        <button 
          onClick={handleCreate}
          style={{
            marginLeft: 'auto',
            backgroundColor: 'var(--brand-color)',
            color: 'var(--text-dark)',
            padding: '6px 12px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          创建新模板
        </button>
      </div>
      
      {/* 内容区域 */}
      <div className="main-container" style={{ padding: 'var(--space-lg)', overflowY: 'auto' }}>
        {/* 错误提示 */}
        {error && (
          <div className="error-message" style={{ marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}
        
        {/* 加载状态 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            正在加载模板列表...
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-mid-gray)' }}>
            没有找到任何模板。点击"创建新模板"按钮创建一个新的模板。
          </div>
        ) : (
          // 模板列表
          <div className="template-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {templates.map(template => (
              <div
                key={template.id}
                className="template-item"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${template.isActive === 1 ? 'var(--brand-color)' : 'var(--border-color)'}`,
                  padding: 'var(--space-md)',
                  position: 'relative'
                }}
              >
                {/* 模板标题和状态 */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>
                    {template.name}
                  </h3>
                  
                  {template.isBuiltIn && (
                    <span style={{ 
                      marginLeft: 'var(--space-sm)',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-mid-gray)',
                      backgroundColor: 'rgba(153, 153, 153, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      内置
                    </span>
                  )}
                  
                  {template.isActive === 1 && (
                    <span style={{ 
                      marginLeft: 'var(--space-sm)',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--brand-color)',
                      backgroundColor: 'rgba(165, 232, 135, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      当前激活
                    </span>
                  )}
                </div>
                
                {/* 模板信息 */}
                <div style={{ 
                  color: 'var(--text-mid-gray)',
                  fontSize: 'var(--font-sm)',
                  display: 'flex',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div>ID: {template.id}</div>
                  <div>创建时间: {new Date(template.createdAt).toLocaleString()}</div>
                  <div>更新时间: {new Date(template.updatedAt).toLocaleString()}</div>
                </div>
                
                {/* 内容预览 */}
                <div style={{ 
                  color: 'var(--text-light-gray)',
                  fontSize: 'var(--font-sm)',
                  marginBottom: 'var(--space-md)',
                  maxHeight: '100px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {template.content}
                  </div>
                  <div style={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '30px',
                    background: 'linear-gradient(rgba(51, 51, 51, 0), rgba(51, 51, 51, 1))'
                  }}></div>
                </div>
                
                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {template.isActive !== 1 && (
                    <button
                      onClick={() => handleActivate(template.id)}
                      style={{
                        backgroundColor: 'var(--brand-color)',
                        color: 'var(--text-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs) var(--space-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'bold'
                      }}
                    >
                      激活
                    </button>
                  )}
                  
                  {!template.isBuiltIn && (
                    <>
                      <button
                        onClick={() => handleEdit(template.id)}
                        style={{
                          backgroundColor: 'var(--secondary-bg)',
                          color: 'var(--text-white)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-md)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)'
                        }}
                      >
                        编辑
                      </button>
                      
                      <button
                        onClick={() => handleCopyStandard(template.id)}
                        style={{
                          backgroundColor: 'var(--secondary-bg)',
                          color: 'var(--text-white)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-md)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)'
                        }}
                      >
                        载入标准版
                      </button>
                      
                      <button
                        onClick={() => handleDelete(template.id)}
                        style={{
                          backgroundColor: 'var(--error-color)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-md)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)',
                          marginLeft: 'auto'
                        }}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 模板编辑器弹窗 */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTemplate}
        template={currentTemplate}
        mode={editorMode}
      />
    </div>
  );
};

export default PromptTemplateManager;
