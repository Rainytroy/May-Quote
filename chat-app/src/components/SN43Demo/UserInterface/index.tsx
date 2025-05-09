import React, { useState, useEffect } from 'react';
import { UserInputs, AdminInputs, PromptBlock, ExecutionStatus } from '../types';
import { sn43API } from '../api';

interface UserInterfaceProps {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
  isEditing: boolean;
  outputResult: string;
  inputCounter: number;
  isConfigModified: boolean;
  selectedJsonFile: string;
  onUpdateUserInputs: (inputs: UserInputs) => void;
  onUpdateAdminInputs: (inputs: AdminInputs) => void;
  onUpdatePromptBlocks: (blocks: PromptBlock[]) => void;
  onUpdateInputCounter: (counter: number) => void;
  onUpdateSelectedJsonFile: (file: string) => void;
  onExecutionComplete: (result: string) => void;
}

/**
 * SN43 用户界面组件
 * 
 * 负责向用户展示交互式问卷界面，包括：
 * - 动态表单生成
 * - 表单验证和提交
 * - 执行状态反馈
 * - 结果展示
 */
const UserInterface: React.FC<UserInterfaceProps> = ({
  userInputs,
  adminInputs,
  promptBlocks,
  isEditing,
  outputResult,
  inputCounter,
  isConfigModified,
  selectedJsonFile,
  onUpdateUserInputs,
  onUpdateAdminInputs,
  onUpdatePromptBlocks,
  onUpdateInputCounter,
  onUpdateSelectedJsonFile,
  onExecutionComplete
}) => {
  // 本地状态
  const [localUserInputs, setLocalUserInputs] = useState<UserInputs>({...userInputs});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  
  // 更新单个输入字段
  const updateInputField = (fieldId: string, value: string) => {
    const updatedInputs = { ...localUserInputs, [fieldId]: value };
    setLocalUserInputs(updatedInputs);
  };
  
  // 同步props到本地状态
  useEffect(() => {
    setLocalUserInputs({...userInputs});
  }, [userInputs]);
  
  // 提交问卷
  const handleSubmit = async () => {
    setExecutionStatus(ExecutionStatus.PREPARING);
    setIsExecuting(true);
    setExecutionError(null);
    
    try {
      // 验证所有必填字段
      const requiredFields = Object.keys(localUserInputs).filter(field => 
        !field.startsWith('optional_')
      );
      
      const missingFields = requiredFields.filter(field => 
        !localUserInputs[field] || localUserInputs[field].trim() === ''
      );
      
      if (missingFields.length > 0) {
        throw new Error(`请填写所有必填字段: ${missingFields.join(', ')}`);
      }
      
      // 将本地输入同步到父组件
      onUpdateUserInputs(localUserInputs);
      
      // 执行调用流程
      setExecutionStatus(ExecutionStatus.EXECUTING);
      
      // 使用API执行SN43请求
      const response = await sn43API.execute({
        userInputs: localUserInputs,
        adminInputs: adminInputs,
        promptBlocks: promptBlocks,
        configFile: selectedJsonFile
      });
      
      if (response.success && response.data) {
        // 设置执行完成
        setExecutionStatus(ExecutionStatus.COMPLETED);
        onExecutionComplete(response.data.result);
        
        // 保存历史记录
        await sn43API.saveHistory({
          id: `exec-${Date.now()}`,
          timestamp: Date.now(),
          userInputs: localUserInputs,
          adminInputs: adminInputs,
          promptBlocks: promptBlocks,
          selectedJsonFile: selectedJsonFile,
          result: response.data.result
        });
      } else {
        throw new Error(response.error || '执行请求失败');
      }
      
    } catch (error) {
      console.error('执行错误:', error);
      setExecutionStatus(ExecutionStatus.ERROR);
      setExecutionError((error as Error).message || '执行过程中发生未知错误');
    } finally {
      setIsExecuting(false);
    }
  };
  
  // 生成标题文本
  const getTitleText = () => {
    if (isEditing) {
      return '编辑问卷';
    } else if (isConfigModified) {
      return '配置已修改，请填写表单';
    } else {
      return '请填写以下问卷';
    }
  };
  
  return (
    <div className="user-interface" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      {/* 问卷标题 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <h2 style={{ color: 'var(--text-white)', fontSize: 'var(--font-lg)' }}>
          {getTitleText()}
        </h2>
        <div>
          <button
            onClick={handleSubmit}
            disabled={isExecuting}
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: isExecuting ? 0.7 : 1
            }}
          >
            {isExecuting ? '执行中...' : '执行'}
          </button>
        </div>
      </div>
      
      {/* 主要内容区 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        height: 'calc(100% - 50px)' // 减去标题和状态栏的高度
      }}>
        {/* 问卷表单区 */}
        <div className="form-panel" style={{
          flex: '1 0 60%',
          overflowY: 'auto',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>
            请填写信息
          </h3>
          
          {/* 动态生成表单 */}
          <div className="form-fields">
            {Object.keys(userInputs).length === 0 ? (
              <div style={{ color: 'var(--text-light-gray)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                请先在配置面板中添加输入字段。
              </div>
            ) : (
              Object.entries(userInputs).map(([fieldId, defaultValue]) => (
                <div key={fieldId} className="form-field" style={{
                  marginBottom: 'var(--space-md)'
                }}>
                  <label 
                    htmlFor={fieldId}
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-xs)',
                      color: 'var(--text-white)',
                      fontSize: 'var(--font-md)'
                    }}
                  >
                    {fieldId}
                    {!fieldId.startsWith('optional_') && (
                      <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>
                    )}
                  </label>
                  
                  {fieldId.includes('multiline') ? (
                    <textarea
                      id={fieldId}
                      value={localUserInputs[fieldId] || ''}
                      onChange={(e) => updateInputField(fieldId, e.target.value)}
                      placeholder={`请输入${fieldId}...`}
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
                  ) : (
                    <input
                      type="text"
                      id={fieldId}
                      value={localUserInputs[fieldId] || ''}
                      onChange={(e) => updateInputField(fieldId, e.target.value)}
                      placeholder={`请输入${fieldId}...`}
                      style={{
                        width: '100%',
                        padding: 'var(--space-sm)',
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text-white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 结果展示区 */}
        <div className="result-panel" style={{
          flex: '1 0 40%',
          overflowY: 'auto',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>
            执行结果
          </h3>
          
          {executionStatus === ExecutionStatus.IDLE && !outputResult && (
            <div style={{ 
              color: 'var(--text-light-gray)', 
              textAlign: 'center', 
              padding: 'var(--space-lg)',
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              点击"执行"按钮开始处理
            </div>
          )}
          
          {executionStatus === ExecutionStatus.PREPARING && (
            <div style={{ 
              color: 'var(--text-light-gray)', 
              textAlign: 'center', 
              padding: 'var(--space-lg)',
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              正在准备执行...
            </div>
          )}
          
          {executionStatus === ExecutionStatus.EXECUTING && (
            <div style={{ 
              color: 'var(--text-light-gray)', 
              textAlign: 'center', 
              padding: 'var(--space-lg)',
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  执行中，请稍候...
                </div>
                <div className="loading-spinner" style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'var(--brand-color)',
                  animation: 'spin 1s ease-in-out infinite'
                }} />
                <style>
                  {`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                  `}
                </style>
              </div>
            </div>
          )}
          
          {executionStatus === ExecutionStatus.ERROR && (
            <div style={{ 
              color: 'var(--error-color)', 
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--error-color)'
            }}>
              <strong>执行错误:</strong> {executionError}
            </div>
          )}
          
          {(executionStatus === ExecutionStatus.COMPLETED || outputResult) && (
            <div className="result-content" style={{
              color: 'var(--text-white)', 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              flex: 1,
              overflowY: 'auto'
            }}>
              {outputResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInterface;
