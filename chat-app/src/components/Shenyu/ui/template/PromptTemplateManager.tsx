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
import { PromptTemplate, CreateTemplateParams, UpdateTemplateParams } from '../../types/templateTypes';

/**
 * 提示词模板管理器组件
 * 用于管理神谕的提示词模板
 * 左右两栏布局：左侧是模板列表，右侧是模板详细内容
 */
const PromptTemplateManager: React.FC = () => {
  // 模板列表状态
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 选中和编辑状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
      
      // 如果没有选中的模板，默认选中标准模板或第一个模板
      if (!selectedTemplateId && allTemplates.length > 0) {
        // 先尝试找到标准模板
        const standardTemplate = allTemplates.find(t => t.id === 'standard-template');
        if (standardTemplate) {
          setSelectedTemplateId(standardTemplate.id);
          setEditName(standardTemplate.name);
          setEditContent(standardTemplate.content);
        } else {
          // 如果没有标准模板，选中第一个
          setSelectedTemplateId(allTemplates[0].id);
          setEditName(allTemplates[0].name);
          setEditContent(allTemplates[0].content);
        }
      }
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

  // 当选中的模板ID变化时，加载详细内容
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        setEditName(selectedTemplate.name);
        setEditContent(selectedTemplate.content);
        setIsEditing(false);
      }
    }
  }, [selectedTemplateId, templates]);
  
  // 获取当前选中的模板
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  // 处理选择模板
  const handleSelectTemplate = (id: string) => {
    if (isEditing && selectedTemplateId && selectedTemplateId !== id) {
      if (window.confirm('您有未保存的更改，确定要切换模板吗？')) {
        setSelectedTemplateId(id);
      }
    } else {
      setSelectedTemplateId(id);
    }
  };
  
  // 处理激活模板
  const handleActivate = async (id: string) => {
    try {
      setSaveLoading(true);
      await activateTemplate(id);
      
      // 更新本地状态
      setTemplates(prev => prev.map(template => ({
        ...template,
        isActive: template.id === id ? 1 : 0
      })));
    } catch (err) {
      console.error('激活模板失败:', err);
      setError('激活模板失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 处理删除模板
  const handleDelete = async (id: string) => {
    try {
      if (window.confirm('确定要删除这个模板吗？此操作不可撤销。')) {
        setSaveLoading(true);
        await deleteTemplate(id);
        
        // 如果删除的是当前选中的模板，选择标准模板或列表中第一个
        if (id === selectedTemplateId) {
          const remainingTemplates = templates.filter(t => t.id !== id);
          const standardTemplate = remainingTemplates.find(t => t.id === 'standard-template');
          if (standardTemplate) {
            setSelectedTemplateId(standardTemplate.id);
          } else if (remainingTemplates.length > 0) {
            setSelectedTemplateId(remainingTemplates[0].id);
          } else {
            setSelectedTemplateId(null);
          }
        }
        
        // 重新加载模板列表
        await loadTemplates();
      }
    } catch (err) {
      console.error('删除模板失败:', err);
      setError('删除模板失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 处理创建新模板
  const handleCreateNewTemplate = async () => {
    try {
      setSaveLoading(true);
      
      // 创建新模板
      const newTemplateId = await createTemplate({
        name: '新模板',
        content: '{\n  "cards": [\n    {\n      "name": "卡片1",\n      "promptBlocks": {\n        "block1": "输入你的提示词"\n      }\n    }\n  ]\n}',
        isActive: 0
      });
      
      if (newTemplateId) {
        // 重新加载模板并选中新创建的模板
        await loadTemplates();
        setSelectedTemplateId(newTemplateId);
        
        // 开始编辑新模板
        setIsEditing(true);
      }
    } catch (err) {
      console.error('创建模板失败:', err);
      setError('创建模板失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 处理复制标准模板内容
  const handleCopyStandard = async () => {
    if (!selectedTemplateId || !selectedTemplate || selectedTemplate.isBuiltIn) return;
    
    try {
      if (window.confirm('确定要用标准模板覆盖当前内容吗？此操作不可撤销。')) {
        setSaveLoading(true);
        await copyStandardToTemplate(selectedTemplateId);
        
        // 重新加载模板列表
        await loadTemplates();
      }
    } catch (err) {
      console.error('复制标准模板失败:', err);
      setError('复制标准模板失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 处理保存模板
  const handleSaveTemplate = async () => {
    if (!selectedTemplateId || !selectedTemplate) return;
    
    // 内置模板不可编辑
    if (selectedTemplate.isBuiltIn) {
      setError('内置模板不可编辑');
      return;
    }
    
    try {
      setSaveLoading(true);
      
      // 更新模板
      await updateTemplate(selectedTemplateId, {
        name: editName,
        content: editContent
      });
      
      // 停止编辑模式并重新加载
      setIsEditing(false);
      await loadTemplates();
      
      // 设置成功消息
      setError(null);
    } catch (err) {
      console.error('保存模板失败:', err);
      setError('保存模板失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 开始编辑
  const handleStartEdit = () => {
    if (selectedTemplate && !selectedTemplate.isBuiltIn) {
      setIsEditing(true);
    }
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    if (selectedTemplate) {
      setEditName(selectedTemplate.name);
      setEditContent(selectedTemplate.content);
      setIsEditing(false);
    }
  };
  
  return (
    <div className="prompt-template-manager" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--main-bg)'
    }}>
      {/* 标题和操作栏 */}
      <div className="navbar" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: 'var(--nav-height)', 
        padding: '0 var(--space-lg)', 
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="logo" style={{ 
          color: 'var(--brand-color)', 
          fontSize: 'var(--font-xl)', 
          fontWeight: 'bold'
        }}>
          神谕提示词模板
        </div>
      </div>
      
      {/* 内容区域 - 左右双栏 */}
      <div className="main-container" style={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* 左侧模板列表 */}
        <div className="template-list-panel" style={{ 
          width: '300px',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 创建按钮 */}
          <div style={{ 
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <button 
              onClick={handleCreateNewTemplate}
              disabled={saveLoading}
              style={{
                width: '100%',
                backgroundColor: 'var(--brand-color)',
                color: 'var(--text-dark)',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: saveLoading ? 0.7 : 1
              }}
            >
              创建新模板
            </button>
          </div>
          
          {/* 模板列表 */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-sm)'
          }}>
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--space-lg)',
                color: 'var(--text-mid-gray)'
              }}>
                正在加载模板列表...
              </div>
            ) : templates.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--space-lg)',
                color: 'var(--text-mid-gray)'
              }}>
                没有找到任何模板
              </div>
            ) : (
              <ul style={{ 
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-xs)'
              }}>
                {templates.map(template => (
                  <li 
                    key={template.id} 
                    onClick={() => handleSelectTemplate(template.id)}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      backgroundColor: selectedTemplateId === template.id ? 
                        'var(--card-bg)' : 'transparent',
                      border: `1px solid ${
                        selectedTemplateId === template.id ? 
                          (template.isActive === 1 ? 'var(--brand-color)' : 'var(--border-color)') : 
                          'transparent'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      overflow: 'hidden',
                      flex: 1
                    }}>
                      <div style={{ 
                        fontWeight: selectedTemplateId === template.id ? 'bold' : 'normal',
                        color: 'var(--text-white)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {template.name}
                      </div>
                      
                      <div style={{ 
                        fontSize: 'var(--font-xs)',
                        color: 'var(--text-mid-gray)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)'
                      }}>
                        {template.isBuiltIn && (
                          <span style={{ 
                            fontSize: '10px',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(153, 153, 153, 0.1)',
                            color: 'var(--text-mid-gray)'
                          }}>
                            内置
                          </span>
                        )}
                        
                        {template.isActive === 1 && (
                          <span style={{ 
                            fontSize: '10px',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(165, 232, 135, 0.1)',
                            color: 'var(--brand-color)'
                          }}>
                            已激活
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* 右侧模板详情与编辑 */}
        <div className="template-detail-panel" style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {selectedTemplate ? (
            <>
              {/* 错误提示 */}
              {error && (
                <div className="error-message" style={{ 
                  backgroundColor: 'rgba(255, 107, 107, 0.2)',
                  color: 'var(--error-color)',
                  padding: 'var(--space-sm) var(--space-md)',
                  margin: 'var(--space-md)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-sm)'
                }}>
                  {error}
                </div>
              )}
              
              {/* 模板操作栏 */}
              <div className="template-actions" style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-md) var(--space-lg)',
                borderBottom: '1px solid var(--border-color)',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: 'var(--font-lg)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {isEditing ? '编辑模板' : '模板详情'}
                    {selectedTemplate.isBuiltIn && (
                      <span style={{ 
                        marginLeft: 'var(--space-sm)',
                        fontSize: 'var(--font-sm)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(153, 153, 153, 0.1)',
                        color: 'var(--text-mid-gray)'
                      }}>
                        内置
                      </span>
                    )}
                  </h2>
                  
                  {selectedTemplate.isActive === 1 ? (
                    <span style={{ 
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(165, 232, 135, 0.1)',
                      color: 'var(--brand-color)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'normal'
                    }}>
                      当前激活
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(selectedTemplate.id)}
                      disabled={saveLoading}
                      style={{
                        backgroundColor: 'var(--brand-color)',
                        color: 'var(--text-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs) var(--space-md)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'bold',
                        opacity: saveLoading ? 0.7 : 1
                      }}
                    >
                      激活
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {/* 编辑状态的保存/取消按钮，或非编辑状态的编辑/删除按钮 */}
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saveLoading}
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--text-white)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-md)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)',
                          opacity: saveLoading ? 0.7 : 1
                        }}
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={saveLoading}
                        style={{
                          backgroundColor: 'var(--brand-color)',
                          color: 'var(--text-dark)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-md)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-sm)',
                          fontWeight: 'bold',
                          opacity: saveLoading ? 0.7 : 1
                        }}
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <>
                      {!selectedTemplate.isBuiltIn && (
                        <>
                          <button
                            onClick={handleStartEdit}
                            disabled={saveLoading}
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--text-white)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-xs) var(--space-md)',
                              cursor: 'pointer',
                              fontSize: 'var(--font-sm)',
                              opacity: saveLoading ? 0.7 : 1
                            }}
                          >
                            编辑
                          </button>
                          
                          <button
                            onClick={handleCopyStandard}
                            disabled={saveLoading}
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--text-white)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-xs) var(--space-md)',
                              cursor: 'pointer',
                              fontSize: 'var(--font-sm)',
                              opacity: saveLoading ? 0.7 : 1
                            }}
                          >
                            载入标准版
                          </button>
                          
                          <button
                            onClick={() => handleDelete(selectedTemplate.id)}
                            disabled={saveLoading}
                            style={{
                              backgroundColor: 'var(--error-color)',
                              color: 'var(--text-white)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-xs) var(--space-md)',
                              cursor: 'pointer',
                              fontSize: 'var(--font-sm)',
                              opacity: saveLoading ? 0.7 : 1
                            }}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* 模板详情内容 */}
              <div className="template-content" style={{ 
                flex: 1,
                padding: 'var(--space-md) var(--space-lg)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)'
              }}>
                {/* 模板名称 */}
                <div>
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
                  
                  {isEditing ? (
                    <input
                      id="template-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-sm) var(--space-md)',
                        color: 'var(--text-white)',
                        fontSize: 'var(--font-md)'
                      }}
                      disabled={saveLoading}
                    />
                  ) : (
                    <div style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-white)',
                      fontSize: 'var(--font-md)'
                    }}>
                      {selectedTemplate.name}
                    </div>
                  )}
                </div>
                
                {/* 模板元数据 */}
                <div style={{ 
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-mid-gray)',
                  display: 'flex',
                  gap: 'var(--space-md)'
                }}>
                  <div>ID: {selectedTemplate.id}</div>
                  <div>创建时间: {new Date(selectedTemplate.createdAt).toLocaleString()}</div>
                  <div>更新时间: {new Date(selectedTemplate.updatedAt).toLocaleString()}</div>
                </div>
                
                {/* 模板内容 */}
                <div style={{ flex: 1 }}>
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
                  
                  {isEditing ? (
                    <textarea
                      id="template-content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        height: 'calc(100vh - 330px)',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-sm) var(--space-md)',
                        color: 'var(--text-white)',
                        fontSize: 'var(--font-sm)',
                        fontFamily: 'monospace',
                        lineHeight: 1.5,
                        resize: 'none'
                      }}
                      disabled={saveLoading}
                    />
                  ) : (
                    <pre style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-white)',
                      fontSize: 'var(--font-sm)',
                      fontFamily: 'monospace',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      height: 'calc(100vh - 330px)',
                      margin: 0
                    }}>
                      {selectedTemplate.content}
                    </pre>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-mid-gray)'
            }}>
              {loading ? '正在加载模板...' : '选择一个模板查看详情'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateManager;
