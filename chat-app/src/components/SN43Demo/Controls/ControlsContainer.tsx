import React, { useState, useEffect } from 'react';
import { UserInputs, AdminInputs, PromptBlock } from '../types';
import DynamicControl, { ControlDefinition } from './DynamicControl';
import { mayApi } from '../api/mayApi';

interface ControlsContainerProps {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
  controlsTemplate?: string;
  onControlValuesChange?: (values: Record<string, any>) => void;
  presetControls?: ControlDefinition[]; // 预设控件定义，优先级高于API生成
}

/**
 * 控件容器组件
 * 
 * 负责:
 * 1. 从API动态生成控件
 * 2. 管理控件值状态
 * 3. 提供读取控件值的能力
 */
const ControlsContainer: React.FC<ControlsContainerProps> = ({
  userInputs,
  adminInputs,
  promptBlocks,
  controlsTemplate,
  onControlValuesChange,
  presetControls
}) => {
  // 控件定义和值的状态
  const [controls, setControls] = useState<ControlDefinition[]>([]);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 当预设控件、用户输入、管理员输入或提示词块变化时，生成新的控件
  useEffect(() => {
    if (presetControls && presetControls.length > 0) {
      initializeWithPresetControls(presetControls);
    } else {
      generateControls();
    }
  }, [userInputs, adminInputs, promptBlocks, controlsTemplate, presetControls]);
  
  // 使用预设控件初始化
  const initializeWithPresetControls = (controlDefs: ControlDefinition[]) => {
    // 更新控件定义
    setControls(controlDefs);
    
    // 为预设控件创建初始值
    const initialValues: Record<string, any> = {};
    controlDefs.forEach(control => {
      initialValues[control.id] = control.defaultValue || 
        (control.type === 'number' ? 0 : 
         control.type === 'checkbox' ? false : 
         control.type === 'select' && control.options?.length ? control.options[0].value : 
         '');
    });
    
    // 更新控件值
    setControlValues(initialValues);
    
    // 通知父组件控件值变化
    if (onControlValuesChange) {
      onControlValuesChange(initialValues);
    }
  };
  
  // 生成控件
  const generateControls = async () => {
    // 检查是否有足够的数据生成控件
    if (Object.keys(userInputs).length === 0 && 
        Object.keys(adminInputs).length === 0 && 
        promptBlocks.every(block => !block.text)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 调用API生成控件
      const generatedControls = await mayApi.generateControls({
        userInputs,
        adminInputs,
        controlsTemplate
      });
      
      // 更新控件定义
      setControls(generatedControls);
      
      // 为新控件创建初始值
      const initialValues: Record<string, any> = {};
      generatedControls.forEach(control => {
        initialValues[control.id] = control.defaultValue || 
          (control.type === 'number' ? 0 : 
           control.type === 'checkbox' ? false : 
           control.type === 'select' && control.options?.length ? control.options[0].value : 
           '');
      });
      
      // 更新控件值
      setControlValues(initialValues);
      
      // 通知父组件控件值变化
      if (onControlValuesChange) {
        onControlValuesChange(initialValues);
      }
      
    } catch (error) {
      console.error('生成控件失败:', error);
      setError('生成控件失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 读取控件值
  const readControlValues = async () => {
    if (controls.length === 0) return {};
    
    try {
      // 获取所有控件ID
      const controlIds = controls.map(control => control.id);
      
      // 从API读取控件值
      return await mayApi.readControlValues(controlIds);
    } catch (error) {
      console.error('读取控件值失败:', error);
      return {};
    }
  };
  
  // 处理控件值变化
  const handleControlChange = (id: string, value: any) => {
    // 更新本地状态
    const updatedValues = {
      ...controlValues,
      [id]: value
    };
    
    setControlValues(updatedValues);
    
    // 通知父组件
    if (onControlValuesChange) {
      onControlValuesChange(updatedValues);
    }
  };
  
  // 暴露readControlValues方法给父组件
  if (typeof window !== 'undefined') {
    (window as any).readControlValues = readControlValues;
  }
  
  return (
    <div className="controls-container">
      {/* 显示加载状态或错误 */}
      {isLoading ? (
        <div style={{ 
          color: 'var(--text-light-gray)', 
          textAlign: 'center', 
          padding: 'var(--space-md)' 
        }}>
          生成控件中...
        </div>
      ) : error ? (
        <div style={{ 
          color: 'var(--error-color)', 
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--error-color)'
        }}>
          {error}
        </div>
      ) : controls.length === 0 ? (
        <div style={{ 
          color: 'var(--text-light-gray)', 
          textAlign: 'center', 
          padding: 'var(--space-md)' 
        }}>
          没有控件可显示，请先配置输入和提示词
        </div>
      ) : (
        // 渲染控件列表
        <div className="controls-list">
          {controls.map(control => (
            <DynamicControl
              key={control.id}
              control={control}
              value={controlValues[control.id]}
              onChange={handleControlChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlsContainer;
