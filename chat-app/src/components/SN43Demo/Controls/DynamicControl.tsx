import React from 'react';

/**
 * 控件类型定义
 */
export interface ControlDefinition {
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  id: string;
  label: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

interface DynamicControlProps {
  control: ControlDefinition;
  value: any;
  onChange: (id: string, value: any) => void;
}

/**
 * 动态控件组件
 * 根据控件定义渲染不同类型的表单控件
 */
const DynamicControl: React.FC<DynamicControlProps> = ({
  control,
  value,
  onChange
}) => {
  const {
    type,
    id,
    label,
    required = false,
    placeholder = '',
    options = []
  } = control;
  
  // 处理值变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let newValue: any;
    
    // 根据控件类型处理值
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = parseFloat((e.target as HTMLInputElement).value);
      if (isNaN(newValue)) newValue = 0;
    } else {
      newValue = e.target.value;
    }
    
    onChange(id, newValue);
  };
  
  // 根据控件类型返回不同的UI组件
  const renderControl = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            id={id}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            id={id}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
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
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={id}
            value={value || 0}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          />
        );
        
      case 'select':
        return (
          <select
            id={id}
            value={value || ''}
            onChange={handleChange}
            required={required}
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <option value="" disabled>
              {placeholder || '请选择...'}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id={id}
              checked={!!value}
              onChange={handleChange}
              required={required}
              style={{
                marginRight: 'var(--space-sm)'
              }}
            />
            <label htmlFor={id} style={{ cursor: 'pointer' }}>
              {label}
            </label>
          </div>
        );
        
      case 'radio':
        return (
          <div>
            {options.map((option) => (
              <div 
                key={option.value} 
                style={{ 
                  marginBottom: 'var(--space-xs)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  type="radio"
                  id={`${id}-${option.value}`}
                  name={id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  required={required}
                  style={{
                    marginRight: 'var(--space-sm)'
                  }}
                />
                <label 
                  htmlFor={`${id}-${option.value}`}
                  style={{ cursor: 'pointer' }}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return <div>不支持的控件类型: {type}</div>;
    }
  };
  
  return (
    <div className="dynamic-control" style={{ marginBottom: 'var(--space-md)' }}>
      {/* 对于checkbox类型，标签在控件渲染内部 */}
      {type !== 'checkbox' && (
        <label 
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: 'var(--space-xs)',
            color: 'var(--text-white)',
            fontSize: 'var(--font-md)'
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}
      
      {renderControl()}
    </div>
  );
};

export default DynamicControl;
