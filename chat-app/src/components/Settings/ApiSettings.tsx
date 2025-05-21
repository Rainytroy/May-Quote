import React, { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, getModel, saveModel } from '../../utils/storage';
// 使用新的数据库服务进行重置
import { sendMessage } from '../../services/ai-service';
import { resetDatabase } from '../../utils/db';
import ConfirmDialog from '../UI/ConfirmDialog';

// 组件props类型
interface ApiSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// 可用模型列表
const AVAILABLE_MODELS = [
  // 火山引擎API模型
  { id: 'deepseek-r1-250120', name: '火山Deepseek R1' },
  { id: 'deepseek-v3-250324', name: '火山DeepSeek V3' },
  { id: 'doubao-1-5-thinking-pro-250415', name: '豆包 1.5 Thinking Pro' },
  { id: 'doubao-1-5-pro-256k-250115', name: '豆包 1.5 Pro 256k' },
  
  // 官方DeepSeek API模型
  { id: 'deepseek-chat', name: '官方DeepSeek V3' },
  { id: 'deepseek-reasoner', name: '官方DeepSeek R1' }
];

// API基础URL映射
const API_BASE_URLS = {
  'volcengine': 'https://ark.cn-beijing.volces.com/api/v3',
  'deepseek': 'https://api.deepseek.com'
};

const ApiSettings: React.FC<ApiSettingsProps> = ({ isOpen, onClose, onSave }) => {
  // 状态
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-r1-250120');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  // 重置相关状态
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // 加载已保存的设置
  useEffect(() => {
    if (isOpen) {
      const savedApiKey = getApiKey();
      const savedModel = getModel();
      
      setApiKey(savedApiKey);
      setModel(savedModel);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  // 处理保存
  const handleSave = () => {
    saveApiKey(apiKey);
    saveModel(model);
    
    // 触发自定义事件，通知App组件模型已更改
    const event = new StorageEvent('storage', {
      key: 'MODEL',
      newValue: model,
      oldValue: null,
      storageArea: localStorage
    });
    window.dispatchEvent(event);
    
    onSave();
    onClose();
  };

  // 处理重置系统
  const handleResetSystem = () => {
    setShowResetConfirm(true);
    setResetError(null);
  };
  
  // 确认重置
  const confirmReset = async () => {
    try {
      setIsResetting(true);
      setResetError(null);
      
      // 调用重置数据库函数
      const success = await resetDatabase();
      
      if (success) {
        // 清空当前输入
        setApiKey('');
        setModel(AVAILABLE_MODELS[0].id);
        setShowResetConfirm(false);
        
        // 通知父组件设置已更改
        onSave();
        
        // 显示重置成功消息
        alert('系统已重置成功，页面将刷新');
        
        // 刷新页面以加载重置后的状态
        setTimeout(() => {
          window.location.reload();
        }, 1000); // 延迟1秒，让用户看到提示
      } else {
        setResetError('系统重置失败，请重试');
      }
    } catch (error: any) {
      setResetError(`重置时发生错误: ${error.message || '未知错误'}`);
    } finally {
      setIsResetting(false);
    }
  };
  
  // 取消重置
  const cancelReset = () => {
    setShowResetConfirm(false);
  };
  
  // 处理测试API连接
  const handleTestConnection = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setTestMessage('请输入API密钥');
      return;
    }

    setTestStatus('testing');
    setTestMessage('正在测试连接...');

    try {
      const result = await sendMessage(
        apiKey,
        [
          { role: 'system', content: '你是一个AI助手' },
          { role: 'user', content: '请回复"连接测试成功"' }
        ],
        model
      );

      if (result.error) {
        setTestStatus('error');
        setTestMessage(`连接测试失败: ${result.error}`);
      } else {
        setTestStatus('success');
        setTestMessage('连接测试成功！');
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(`连接测试失败: ${error.message || '未知错误'}`);
    }
  };

  // 如果面板未打开，不渲染任何内容
  if (!isOpen) return null;

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
      <div style={{
        backgroundColor: 'var(--secondary-bg)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        color: 'var(--text-white)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-md)' }}>设置</h2>
        
        {/* 模型选择 - 首先展示模型选择 */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label htmlFor="model-select" style={{ 
            display: 'block', 
            marginBottom: 'var(--space-xs)',
            fontWeight: 'bold',
            color: 'var(--text-light-gray)'
          }}>
            选择模型
          </label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--card-bg)',
              border: `1px solid var(--border-color)`,
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              color: 'var(--text-white)',
              fontSize: 'var(--font-md)'
            }}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <small style={{ 
            display: 'block', 
            marginTop: 'var(--space-xs)', 
            color: 'var(--text-mid-gray)',
            fontSize: 'var(--font-xs)'
          }}>
            请先选择模型，再配置API密钥
          </small>
        </div>
        
        {/* API密钥输入 */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label htmlFor="api-key" style={{ 
            display: 'block', 
            marginBottom: 'var(--space-xs)',
            fontWeight: 'bold',
            color: 'var(--text-light-gray)'
          }}>
            API密钥
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入你的API密钥"
            style={{
              width: '100%',
              backgroundColor: 'var(--card-bg)',
              border: `1px solid var(--border-color)`,
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              color: 'var(--text-white)',
              fontSize: 'var(--font-md)'
            }}
          />
          <small style={{ 
            display: 'block', 
            marginTop: 'var(--space-xs)', 
            color: 'var(--text-mid-gray)',
            fontSize: 'var(--font-xs)'
          }}>
            {model.includes('deepseek-chat') || model.includes('deepseek-reasoner') 
              ? 'DeepSeek官方API需使用DeepSeek API密钥' 
              : '火山引擎API需使用ARK API密钥'}
          </small>
        </div>
        
        {/* 测试状态显示 */}
        {testStatus !== 'idle' && (
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-md)',
            backgroundColor: testStatus === 'success' ? 'rgba(165, 232, 135, 0.2)' : 
                            testStatus === 'error' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(0, 132, 255, 0.2)',
            color: testStatus === 'success' ? 'var(--brand-color)' : 
                   testStatus === 'error' ? 'var(--error-color)' : 'var(--text-white)'
          }}>
            {testMessage}
          </div>
        )}
        
        {/* 分隔线 */}
        <hr style={{ 
          border: 'none', 
          height: '1px', 
          backgroundColor: 'var(--border-color)', 
          margin: 'var(--space-lg) 0' 
        }} />
        
        {/* 系统重置部分 */}
        <h3 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--text-light-gray)' }}>
          系统重置
        </h3>
        
        <p style={{ 
          fontSize: 'var(--font-sm)',
          color: 'var(--text-mid-gray)',
          marginBottom: 'var(--space-md)'
        }}>
          重置系统将清空所有数据，包括对话、对话中的剪切板和API设置
        </p>
        
        {/* 重置按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={handleResetSystem}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--error-color)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 'bold',
              opacity: 0.9
            }}
          >
            重置
          </button>
        </div>
        
        {/* 分隔线 */}
        <hr style={{ 
          border: 'none', 
          height: '1px', 
          backgroundColor: 'var(--border-color)', 
          margin: 'var(--space-lg) 0' 
        }} />
        
        {/* 隐藏设置部分 */}
        <h3 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--text-light-gray)' }}>
          隐藏设置
        </h3>
        
        <div style={{ marginBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <a 
            href="/?demo=shenyu" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'var(--brand-color)',
              textDecoration: 'none',
              fontSize: 'var(--font-sm)',
              display: 'inline-block',
              padding: 'var(--space-xs) 0'
            }}
          >
            神谕调试实验室
          </a>
          
          <a 
            href="/?template-manager" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'var(--brand-color)',
              textDecoration: 'none',
              fontSize: 'var(--font-sm)',
              display: 'inline-block',
              padding: 'var(--space-xs) 0'
            }}
          >
            提示词模板管理
          </a>
        </div>
        
        {/* 按钮区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-lg)'
        }}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer'
            }}
          >
            {testStatus === 'testing' ? '测试中...' : '测试连接'}
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          
          <button
            onClick={handleSave}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            保存
          </button>
        </div>
      </div>

      {/* 系统重置确认对话框 */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="确认重置系统"
        message="您确定要重置系统吗？这将清空所有数据，包括对话、对话中的剪切板和API设置。此操作无法撤销。"
        confirmLabel="重置系统"
        cancelLabel="取消"
        onConfirm={confirmReset}
        onCancel={cancelReset}
        isLoading={isResetting}
        error={resetError}
      />
    </div>
  );
};

export default ApiSettings;
