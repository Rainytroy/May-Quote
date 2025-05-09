import React, { useState } from 'react';
import { UserInputs, AdminInputs, PromptBlock } from '../types';
import ControlsContainer from '../Controls/ControlsContainer';
import { mayApi } from '../api/mayApi';

interface ShenyuDebugPanelProps {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
}

/**
 * 神谕调试面板
 * 
 * 用于测试原版神谕功能：
 * 1. 输入生成控件
 * 2. 动态控件展示
 * 3. 控件值读取
 * 4. 神谕执行
 */
const ShenyuDebugPanel: React.FC<ShenyuDebugPanelProps> = ({
  userInputs,
  adminInputs,
  promptBlocks
}) => {
  // 控件模板
  const [controlsTemplate, setControlsTemplate] = useState<string>('');
  
  // 控件值
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  
  // 执行结果
  const [result, setResult] = useState<string>('');
  
  // 执行状态
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 执行神谕请求
  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    
    try {
      // 执行神谕请求
      const response = await mayApi.executeShenyuRequest({
        userInputs,
        adminInputs,
        promptBlocks,
        controls: controlValues
      });
      
      // 设置结果
      setResult(response.result);
    } catch (error) {
      console.error('执行神谕请求失败:', error);
      setError('执行失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsExecuting(false);
    }
  };
  
  // 处理控件值变化
  const handleControlValuesChange = (values: Record<string, any>) => {
    setControlValues(values);
  };
  
  // 读取控件值
  const handleReadControls = async () => {
    // 这里使用了通过window暴露的方法
    if (typeof window !== 'undefined' && (window as any).readControlValues) {
      try {
        const values = await (window as any).readControlValues();
        console.log('读取到的控件值:', values);
        alert('控件值已读取，请查看控制台输出');
      } catch (error) {
        console.error('读取控件值失败:', error);
        alert('读取控件值失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
    } else {
      alert('readControlValues方法不可用');
    }
  };
  
  return (
    <div className="shenyu-debug-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      <h2 style={{ color: 'var(--text-white)' }}>神谕调试面板</h2>
      
      {/* 顶部说明 */}
      <div style={{
        backgroundColor: 'var(--secondary-bg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <p style={{ color: 'var(--text-white)', marginBottom: 'var(--space-sm)' }}>
          本面板用于测试原版神谕功能，包括：
        </p>
        <ul style={{ color: 'var(--text-light-gray)', paddingLeft: 'var(--space-lg)' }}>
          <li>输入生成控件</li>
          <li>动态控件展示</li>
          <li>控件值读取</li>
          <li>神谕执行</li>
        </ul>
      </div>
      
      {/* 控件模板输入 */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h3 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-sm)' }}>控件模板（可选）</h3>
        <textarea
          value={controlsTemplate}
          onChange={(e) => setControlsTemplate(e.target.value)}
          placeholder="输入控件模板JSON或留空自动生成"
          style={{
            width: '100%',
            minHeight: '80px',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--main-bg)',
            color: 'var(--text-white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            resize: 'vertical'
          }}
        />
      </div>
      
      {/* 控件容器 */}
      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: 'var(--space-md)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-md)'
        }}>
          <h3 style={{ color: 'var(--text-white)', margin: 0 }}>动态控件</h3>
          <button
            onClick={handleReadControls}
            style={{
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer'
            }}
          >
            读取控件值
          </button>
        </div>
        
        <ControlsContainer
          userInputs={userInputs}
          adminInputs={adminInputs}
          promptBlocks={promptBlocks}
          controlsTemplate={controlsTemplate || undefined}
          onControlValuesChange={handleControlValuesChange}
        />
      </div>
      
      {/* 执行按钮 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: 'var(--space-md)'
      }}>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'var(--text-dark)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-sm) var(--space-lg)',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 'var(--font-md)',
            opacity: isExecuting ? 0.7 : 1
          }}
        >
          {isExecuting ? '执行中...' : '执行神谕'}
        </button>
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ 
          color: 'var(--error-color)', 
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--error-color)',
          marginBottom: 'var(--space-md)'
        }}>
          {error}
        </div>
      )}
      
      {/* 结果展示 */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--card-bg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>执行结果</h3>
        {result ? (
          <div 
            style={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              color: 'var(--text-white)'
            }}
          >
            {result}
          </div>
        ) : (
          <div style={{ 
            color: 'var(--text-light-gray)', 
            textAlign: 'center', 
            padding: 'var(--space-lg)'
          }}>
            点击"执行神谕"按钮查看结果
          </div>
        )}
      </div>
    </div>
  );
};

export default ShenyuDebugPanel;
