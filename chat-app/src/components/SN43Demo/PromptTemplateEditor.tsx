import React, { useState, useEffect } from 'react';
import { usePromptTemplates, PromptTemplateSet } from './contexts/PromptTemplateContext';
import { TemplateType, getDefaultFirstStagePrompt, getDefaultSecondStagePrompt } from './AgentConfigPanel/promptTemplates';

interface PromptTemplateEditorProps {
  // 未来可能需要传入props来管理模板状态
}

const PromptTemplateEditor: React.FC<PromptTemplateEditorProps> = () => {
  const { 
    activeTemplates, 
    savedTemplates, 
    loadTemplates, 
    setActiveTemplate, 
    saveTemplate, 
    deleteTemplate, 
    resetToDefaultTemplates 
  } = usePromptTemplates();
  
  const [editableName, setEditableName] = useState(activeTemplates.name);
  const [editableFirstStage, setEditableFirstStage] = useState(activeTemplates.firstStage);
  const [editableSecondStage, setEditableSecondStage] = useState(activeTemplates.secondStage);
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeTemplates.id);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // 当激活模板变化时，更新编辑区内容
  useEffect(() => {
    if (!isCreatingNew) {
      setEditableName(activeTemplates.name);
      setEditableFirstStage(activeTemplates.firstStage);
      setEditableSecondStage(activeTemplates.secondStage);
      setSelectedTemplateId(activeTemplates.id);
    }
  }, [activeTemplates, isCreatingNew]);

  // 加载模板列表
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleResetDefaults = async (templateType?: TemplateType) => {
    // 获取对应类型的默认模板内容
    const defaultContent = templateType === TemplateType.ADVANCED 
      ? { 
          firstStage: getDefaultFirstStagePrompt(TemplateType.ADVANCED),
          secondStage: getDefaultSecondStagePrompt(TemplateType.ADVANCED)
        }
      : {
          firstStage: getDefaultFirstStagePrompt(TemplateType.ORIGINAL),
          secondStage: getDefaultSecondStagePrompt(TemplateType.ORIGINAL)
        };
    
    // 直接更新当前编辑区的内容，而不是切换模板
    setEditableFirstStage(defaultContent.firstStage);
    setEditableSecondStage(defaultContent.secondStage);
    
    const templateName = templateType === TemplateType.ADVANCED ? '迭代版提示词' : '原版提示词';
    alert(`当前编辑内容已重置为${templateName}默认内容。需要点击保存应用更改。`);
  };

  const handleSaveChanges = async () => {
    if (!editableName.trim()) {
      alert('模板名称不能为空');
      return;
    }
    
    const templateToSave: Omit<PromptTemplateSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      id: (!isCreatingNew && activeTemplates.id !== 'default') ? activeTemplates.id : undefined,
      name: editableName,
      firstStage: editableFirstStage,
      secondStage: editableSecondStage,
    };
    
    const saved = await saveTemplate(templateToSave);
    if (saved) {
      alert(`模板 "${saved.name}" 已保存。`);
      setIsCreatingNew(false);
    } else {
      alert('模板保存失败。');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    setIsCreatingNew(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm(`确定要删除模板 "${savedTemplates.find(t=>t.id === templateId)?.name}" 吗？`)) {
      await deleteTemplate(templateId);
      alert('模板已删除。');
    }
  };
  
  const handleCreateNew = () => {
    // 清空编辑区，准备创建新模板
    setEditableName('我的新模板');
    setEditableFirstStage('');
    setEditableSecondStage('');
    setSelectedTemplateId('new');
    setIsCreatingNew(true);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%',
      color: 'var(--text-white)',
      backgroundColor: 'var(--main-bg)',
      overflow: 'hidden'
    }}>
      {/* 侧边栏 - 模板列表 */}
      <div style={{
        width: '200px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--secondary-bg)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: 'var(--font-md)', 
            fontWeight: 'bold',
            color: 'var(--text-white)'
          }}>
            提示词模板
          </h3>
          <button 
            onClick={handleCreateNew}
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-xs)'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>+</span> 新建模板
          </button>
        </div>
        
        {/* 模板列表 */}
        <div style={{ 
          overflow: 'auto', 
          flex: 1,
          padding: 'var(--space-xs)'
        }}>
          {savedTemplates.map(template => (
            <div 
              key={template.id} 
              onClick={() => handleLoadTemplate(template.id)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                marginBottom: 'var(--space-xs)',
                backgroundColor: (template.id === selectedTemplateId || 
                                 (template.id === activeTemplates.id && !isCreatingNew)) 
                                 ? 'var(--main-bg)' 
                                 : 'transparent',
                color: 'var(--text-white)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                transition: 'background-color 0.15s'
              }}
            >
              <div style={{ 
                width: '3px', 
                position: 'absolute', 
                left: 0, 
                top: '5%', 
                bottom: '5%',
                backgroundColor: (template.id === selectedTemplateId || 
                                 (template.id === activeTemplates.id && !isCreatingNew)) 
                                 ? 'var(--brand-color)' 
                                 : 'transparent',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                transition: 'background-color 0.15s'
              }}/>
              <span style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                fontSize: 'var(--font-sm)',
                maxWidth: '75%',
                fontWeight: (template.id === selectedTemplateId || 
                            (template.id === activeTemplates.id && !isCreatingNew)) 
                           ? 'bold' 
                           : 'normal'
              }}>
                {template.name}
                {template.isDefault && <span style={{
                  color: 'var(--text-light-gray)',
                  fontSize: '0.8em',
                  marginLeft: 'var(--space-xs)'
                }}>（内置）</span>}
              </span>
              
              {!template.isDefault && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDeleteTemplate(template.id); 
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-light-gray)',
                    cursor: 'pointer',
                    padding: 'var(--space-xs)',
                    fontSize: 'var(--font-sm)',
                    opacity: 0.7,
                    transition: 'opacity 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                  aria-label={`删除模板 ${template.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 主编辑区 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* 模板名称编辑区域 */}
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)'
        }}>
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            fontSize: 'var(--font-md)',
            whiteSpace: 'nowrap'
          }}>
            模板名称:
          </h3>
          <input
            type="text"
            value={editableName}
            onChange={(e) => setEditableName(e.target.value)}
            placeholder="输入模板名称"
            readOnly={!isCreatingNew && activeTemplates.isDefault}
            disabled={!isCreatingNew && activeTemplates.isDefault}
            style={{
              flex: 1,
              padding: 'var(--space-xs) var(--space-sm)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-md)',
              fontWeight: 'bold'
            }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button 
              onClick={handleSaveChanges} 
              disabled={!isCreatingNew && activeTemplates.isDefault}
              style={{
                padding: 'var(--space-xs) var(--space-md)',
                backgroundColor: 'var(--brand-color)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: (!isCreatingNew && activeTemplates.isDefault) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: (!isCreatingNew && activeTemplates.isDefault) ? 0.5 : 1
              }}
            >
              {isCreatingNew || activeTemplates.id === 'default' ? '另存为新模板' : '保存更改'}
            </button>
            {(!isCreatingNew && activeTemplates.isDefault) ? null : (
              <div style={{position: 'relative'}}>
                <button 
                  onClick={() => {
                    const menu = document.getElementById('resetMenu');
                    if (menu) {
                      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                    }
                  }}
                  style={{ 
                    padding: 'var(--space-xs) var(--space-sm)',
                    backgroundColor: 'var(--secondary-bg)',
                    color: 'var(--text-white)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  重置为默认模板
                  <span style={{fontSize: '0.7em', marginTop: '2px'}}>▼</span>
                </button>
                <div 
                  id="resetMenu" 
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    width: '160px',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    onClick={() => handleResetDefaults()}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      cursor: 'pointer',
                      color: 'var(--text-white)',
                      transition: 'background-color 0.15s',
                      fontSize: 'var(--font-sm)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    原版提示词
                  </div>
                  <div 
                    onClick={() => handleResetDefaults(TemplateType.ADVANCED)}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      cursor: 'pointer',
                      color: 'var(--text-white)',
                      transition: 'background-color 0.15s',
                      fontSize: 'var(--font-sm)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    迭代版提示词
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 编辑器区域 - 两列布局 */}
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* 第一阶段提示词编辑器 */}
          <div style={{ 
            width: '50%', 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid var(--border-color)',
            padding: 'var(--space-md)'
          }}>
            <div style={{
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 'var(--space-md)'
            }}>
              <h3 style={{ 
                margin: 0, 
                marginBottom: 'var(--space-xs)',
                fontSize: 'var(--font-md)',
                fontWeight: 'bold',
                color: 'var(--text-white)' 
              }}>
                第一阶段提示词
              </h3>
              <div style={{ 
                fontSize: 'var(--font-xs)',
                color: 'var(--text-light-gray)'
              }}>
                用于生成初始JSON结构的提示词模板
              </div>
            </div>
            <textarea
              value={editableFirstStage}
              onChange={(e) => setEditableFirstStage(e.target.value)}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                backgroundColor: 'var(--main-bg)',
                color: 'var(--text-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-sm)',
                resize: 'none',
                lineHeight: 1.5
              }}
              placeholder="请在这里输入第一阶段提示词模板..."
              aria-label="第一阶段提示词编辑器"
              readOnly={!isCreatingNew && activeTemplates.isDefault}
            />
          </div>
          
          {/* 第二阶段提示词编辑器 */}
          <div style={{ 
            width: '50%', 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 'var(--space-md)'
          }}>
            <div style={{
              paddingBottom: 'var(--space-sm)',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 'var(--space-md)'
            }}>
              <h3 style={{ 
                margin: 0, 
                marginBottom: 'var(--space-xs)',
                fontSize: 'var(--font-md)',
                fontWeight: 'bold',
                color: 'var(--text-white)' 
              }}>
                第二阶段提示词
              </h3>
              <div style={{ 
                fontSize: 'var(--font-xs)',
                color: 'var(--text-light-gray)'
              }}>
                用于根据调整建议优化JSON的提示词模板
              </div>
            </div>
            <textarea
              value={editableSecondStage}
              onChange={(e) => setEditableSecondStage(e.target.value)}
              style={{
                flex: 1,
                padding: 'var(--space-md)',
                backgroundColor: 'var(--main-bg)',
                color: 'var(--text-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-sm)',
                resize: 'none',
                lineHeight: 1.5
              }}
              placeholder="请在这里输入第二阶段提示词模板..."
              aria-label="第二阶段提示词编辑器"
              readOnly={!isCreatingNew && activeTemplates.isDefault}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateEditor;
