import React, { useState, useEffect } from 'react';
import { AdminInputs, UserInputs, PromptBlock, SN43ConfigFile } from '../types';
import JsonFileSelector from './JsonFileSelector';

interface ConfigPanelProps {
  adminInputs: AdminInputs;
  userInputs: UserInputs;
  promptBlocks: PromptBlock[];
  inputCounter: number;
  previewText: string;
  isPreviewLoading: boolean;
  selectedJsonFile?: string;
  onUpdateAdminInputs: (inputs: AdminInputs) => void;
  onUpdateUserInputs: (inputs: UserInputs) => void;
  onUpdatePromptBlocks: (blocks: PromptBlock[]) => void;
  onUpdateInputCounter: (counter: number) => void;
  onUpdatePreviewText: (text: string) => void;
  onUpdateIsPreviewLoading: (isLoading: boolean) => void;
  onUpdateSelectedJsonFile?: (file: string) => void;
  onConfigModified: () => void;
}

/**
 * SN43 配置面板组件
 * 
 * 负责提供问卷结构和提示词的编辑界面，包括：
 * - 自定义输入字段配置
 * - 提示词块编辑
 * - 系统提示词模板管理
 * - 配置预览生成
 */
const ConfigPanel: React.FC<ConfigPanelProps> = ({
  adminInputs,
  userInputs,
  promptBlocks,
  inputCounter,
  previewText,
  isPreviewLoading,
  selectedJsonFile,
  onUpdateAdminInputs,
  onUpdateUserInputs,
  onUpdatePromptBlocks,
  onUpdateInputCounter,
  onUpdatePreviewText,
  onUpdateIsPreviewLoading,
  onUpdateSelectedJsonFile,
  onConfigModified
}) => {
  // 当前选中的配置标签页
  const [activeSection, setActiveSection] = useState<'fields' | 'prompts' | 'preview'>('fields');
  
  // 复制adminInputs和userInputs进行本地编辑
  const [localAdminInputs, setLocalAdminInputs] = useState<AdminInputs>({...adminInputs});
  const [localUserInputs, setLocalUserInputs] = useState<UserInputs>({...userInputs});
  const [localPromptBlocks, setLocalPromptBlocks] = useState<PromptBlock[]>([...promptBlocks]);
  
  // 当外部属性变化时更新本地状态
  useEffect(() => {
    setLocalAdminInputs({...adminInputs});
    setLocalUserInputs({...userInputs});
    setLocalPromptBlocks([...promptBlocks]);
  }, [adminInputs, userInputs, promptBlocks]);
  
  // 添加用户输入字段
  const addUserInputField = () => {
    // 新字段ID: inputA 后跟数字，如 inputA1, inputA2, ...
    const newFieldId = `inputA${inputCounter + 1}`;
    const updatedUserInputs = {
      ...localUserInputs,
      [newFieldId]: '' // 初始值为空
    };
    
    setLocalUserInputs(updatedUserInputs);
    onUpdateUserInputs(updatedUserInputs);
    onUpdateInputCounter(inputCounter + 1);
    onConfigModified();
  };
  
  // 添加管理员配置字段
  const addAdminInputField = () => {
    // 新字段ID: inputB 后跟数字，如 inputB1, inputB2, ...
    const newFieldId = `inputB${inputCounter + 1}`;
    const updatedAdminInputs = {
      ...localAdminInputs,
      [newFieldId]: '' // 初始值为空
    };
    
    setLocalAdminInputs(updatedAdminInputs);
    onUpdateAdminInputs(updatedAdminInputs);
    onUpdateInputCounter(inputCounter + 1);
    onConfigModified();
  };
  
  // 删除用户输入字段
  const deleteUserInputField = (fieldId: string) => {
    const { [fieldId]: _, ...remainingInputs } = localUserInputs;
    setLocalUserInputs(remainingInputs);
    onUpdateUserInputs(remainingInputs);
    onConfigModified();
  };
  
  // 删除管理员配置字段
  const deleteAdminInputField = (fieldId: string) => {
    const { [fieldId]: _, ...remainingInputs } = localAdminInputs;
    setLocalAdminInputs(remainingInputs);
    onUpdateAdminInputs(remainingInputs);
    onConfigModified();
  };
  
  // 更新用户输入字段
  const updateUserInputField = (fieldId: string, value: string) => {
    const updatedInputs = { ...localUserInputs, [fieldId]: value };
    setLocalUserInputs(updatedInputs);
    onUpdateUserInputs(updatedInputs);
    onConfigModified();
  };
  
  // 更新管理员配置字段
  const updateAdminInputField = (fieldId: string, value: string) => {
    const updatedInputs = { ...localAdminInputs, [fieldId]: value };
    setLocalAdminInputs(updatedInputs);
    onUpdateAdminInputs(updatedInputs);
    onConfigModified();
  };
  
  // 添加提示词块
  const addPromptBlock = () => {
    const updatedBlocks = [...localPromptBlocks, { text: '' }];
    setLocalPromptBlocks(updatedBlocks);
    onUpdatePromptBlocks(updatedBlocks);
    onConfigModified();
  };
  
  // 删除提示词块
  const deletePromptBlock = (index: number) => {
    if (localPromptBlocks.length <= 1) {
      // 保留至少一个提示词块
      return;
    }
    
    const updatedBlocks = [...localPromptBlocks];
    updatedBlocks.splice(index, 1);
    setLocalPromptBlocks(updatedBlocks);
    onUpdatePromptBlocks(updatedBlocks);
    onConfigModified();
  };
  
  // 更新提示词块
  const updatePromptBlock = (index: number, text: string) => {
    const updatedBlocks = [...localPromptBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], text };
    setLocalPromptBlocks(updatedBlocks);
    onUpdatePromptBlocks(updatedBlocks);
    onConfigModified();
  };
  
  // 生成预览
  const generatePreview = async () => {
    onUpdateIsPreviewLoading(true);
    try {
      // TODO: 实现预览生成逻辑，例如调用API生成预览
      // 临时实现：直接将所有提示词拼接在一起
      const preview = localPromptBlocks.map(block => block.text).join('\n\n');
      onUpdatePreviewText(preview);
    } catch (error) {
      console.error('生成预览失败:', error);
    } finally {
      onUpdateIsPreviewLoading(false);
    }
  };
  
  return (
    <div className="config-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      {/* 配置标签页选择器 */}
      <div className="config-tabs" style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: 'var(--space-md)'
      }}>
        <button
          onClick={() => setActiveSection('fields')}
          className={`tab ${activeSection === 'fields' ? 'active' : ''}`}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: activeSection === 'fields' ? 'var(--secondary-bg)' : 'transparent',
            color: activeSection === 'fields' ? 'var(--brand-color)' : 'var(--text-light-gray)',
            border: 'none',
            borderBottom: activeSection === 'fields' ? '2px solid var(--brand-color)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeSection === 'fields' ? 'bold' : 'normal'
          }}
        >
          输入字段配置
        </button>
        <button
          onClick={() => setActiveSection('prompts')}
          className={`tab ${activeSection === 'prompts' ? 'active' : ''}`}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: activeSection === 'prompts' ? 'var(--secondary-bg)' : 'transparent',
            color: activeSection === 'prompts' ? 'var(--brand-color)' : 'var(--text-light-gray)',
            border: 'none',
            borderBottom: activeSection === 'prompts' ? '2px solid var(--brand-color)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeSection === 'prompts' ? 'bold' : 'normal'
          }}
        >
          提示词编辑
        </button>
        <button
          onClick={() => setActiveSection('preview')}
          className={`tab ${activeSection === 'preview' ? 'active' : ''}`}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: activeSection === 'preview' ? 'var(--secondary-bg)' : 'transparent',
            color: activeSection === 'preview' ? 'var(--brand-color)' : 'var(--text-light-gray)',
            border: 'none',
            borderBottom: activeSection === 'preview' ? '2px solid var(--brand-color)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeSection === 'preview' ? 'bold' : 'normal'
          }}
        >
          预览
        </button>
      </div>
      
      {/* 主要内容区 */}
      <div className="config-content" style={{ flex: 1, overflowY: 'auto' }}>
        {/* 输入字段配置区 */}
        {activeSection === 'fields' && (
          <div className="fields-config">
            {/* 用户输入字段 */}
            <div className="user-fields-section">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-sm)'
              }}>
                <h2 style={{ color: 'var(--text-white)', fontSize: 'var(--font-lg)' }}>用户输入字段</h2>
                <button 
                  onClick={addUserInputField}
                  style={{
                    backgroundColor: 'var(--brand-color)',
                    color: 'var(--text-dark)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span>+</span> 添加字段
                </button>
              </div>
              
              <div className="user-fields-list" style={{ marginBottom: 'var(--space-lg)' }}>
                {Object.entries(localUserInputs).map(([fieldId, value]) => (
                  <div key={fieldId} className="field-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)',
                    gap: 'var(--space-sm)'
                  }}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateUserInputField(fieldId, e.target.value)}
                      placeholder={`字段 ${fieldId} 的值`}
                      style={{
                        flex: 1,
                        padding: 'var(--space-sm)',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                    <button
                      onClick={() => deleteUserInputField(fieldId)}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-light-gray)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs)',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {Object.keys(localUserInputs).length === 0 && (
                  <div style={{
                    color: 'var(--text-light-gray)',
                    textAlign: 'center',
                    padding: 'var(--space-md)'
                  }}>
                    没有用户输入字段。点击"添加字段"按钮添加新字段。
                  </div>
                )}
              </div>
              
              {/* 管理员配置字段 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-sm)'
              }}>
                <h2 style={{ color: 'var(--text-white)', fontSize: 'var(--font-lg)' }}>管理员配置字段</h2>
                <button 
                  onClick={addAdminInputField}
                  style={{
                    backgroundColor: 'var(--brand-color)',
                    color: 'var(--text-dark)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)'
                  }}
                >
                  <span>+</span> 添加字段
                </button>
              </div>
              
              <div className="admin-fields-list">
                {Object.entries(localAdminInputs).map(([fieldId, value]) => (
                  <div key={fieldId} className="field-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)',
                    gap: 'var(--space-sm)'
                  }}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateAdminInputField(fieldId, e.target.value)}
                      placeholder={`字段 ${fieldId} 的值`}
                      style={{
                        flex: 1,
                        padding: 'var(--space-sm)',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                    <button
                      onClick={() => deleteAdminInputField(fieldId)}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-light-gray)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs)',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {Object.keys(localAdminInputs).length === 0 && (
                  <div style={{
                    color: 'var(--text-light-gray)',
                    textAlign: 'center',
                    padding: 'var(--space-md)'
                  }}>
                    没有管理员配置字段。点击"添加字段"按钮添加新字段。
                  </div>
                )}
              </div>
            </div>

            {/* 添加JSON文件选择器 */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <JsonFileSelector
                selectedFile={selectedJsonFile || ''}
                onSelectFile={(filename) => {
                  if (onUpdateSelectedJsonFile) {
                    onUpdateSelectedJsonFile(filename);
                    onConfigModified();
                  }
                }}
                onLoadConfig={(config) => {
                  // 加载配置文件内容
                  onUpdateUserInputs(config.userInputs);
                  onUpdateAdminInputs(config.adminInputs);
                  onUpdatePromptBlocks(config.promptBlocks);
                  onConfigModified();
                }}
              />
            </div>
          </div>
        )}
        
        {/* 提示词编辑区 */}
        {activeSection === 'prompts' && (
          <div className="prompts-config">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--space-sm)'
            }}>
              <h2 style={{ color: 'var(--text-white)', fontSize: 'var(--font-lg)' }}>提示词块</h2>
              <button 
                onClick={addPromptBlock}
                style={{
                  backgroundColor: 'var(--brand-color)',
                  color: 'var(--text-dark)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)'
                }}
              >
                <span>+</span> 添加提示词块
              </button>
            </div>
            
            <div className="prompt-blocks-list">
              {localPromptBlocks.map((block, index) => (
                <div key={index} className="prompt-block-item" style={{
                  marginBottom: 'var(--space-md)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <h3 style={{ color: 'var(--text-white)' }}>提示词块 #{index + 1}</h3>
                    <button
                      onClick={() => deletePromptBlock(index)}
                      disabled={localPromptBlocks.length <= 1}
                      style={{
                        backgroundColor: 'transparent',
                        color: localPromptBlocks.length <= 1 ? 'var(--text-mid-gray)' : 'var(--text-light-gray)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs)',
                        cursor: localPromptBlocks.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </div>
                  <textarea
                    value={block.text}
                    onChange={(e) => updatePromptBlock(index, e.target.value)}
                    placeholder="请输入提示词内容..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--main-bg)',
                      color: 'var(--text-white)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 预览区 */}
        {activeSection === 'preview' && (
          <div className="preview-config">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--space-md)'
            }}>
              <h2 style={{ color: 'var(--text-white)', fontSize: 'var(--font-lg)' }}>预览</h2>
              <button 
                onClick={generatePreview}
                disabled={isPreviewLoading}
                style={{
                  backgroundColor: 'var(--brand-color)',
                  color: 'var(--text-dark)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: isPreviewLoading ? 'not-allowed' : 'pointer',
                  opacity: isPreviewLoading ? 0.7 : 1
                }}
              >
                {isPreviewLoading ? '生成中...' : '生成预览'}
              </button>
            </div>
            
            <div className="preview-content" style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              minHeight: '200px',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'pre-wrap'
            }}>
              {previewText || (
                <div style={{ color: 'var(--text-light-gray)', textAlign: 'center' }}>
                  点击"生成预览"按钮查看效果
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
