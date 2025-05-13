import React, { useState, useRef, useEffect } from 'react';

interface ShenyuInputAreaProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  buttonText?: string;
  hasGenerated?: boolean;
}

/**
 * 神谕输入区组件
 * 
 * 与May的输入区类似，但含有特定于神谕的标签和行为
 */
const ShenyuInputArea: React.FC<ShenyuInputAreaProps> = ({ 
  onSubmit, 
  disabled = false,
  placeholder = '输入需求描述...',
  buttonText = '生成Agent卡片',
  hasGenerated = false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 焦点处理
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);
  
  // 自动调整文本区域高度
  useEffect(() => {
    if (textareaRef.current) {
      // 先重置高度，然后根据内容重新计算
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [message]);
  
  // 发送消息处理
  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    console.log('[ShenyuInputArea] 尝试提交，按钮状态:', { 
      hasMessage: !!trimmedMessage, 
      isDisabled: disabled, 
      buttonText 
    });
    
    if (trimmedMessage && !disabled) {
      console.log('[ShenyuInputArea] 提交用户输入:', trimmedMessage.substring(0, 30) + (trimmedMessage.length > 30 ? '...' : ''));
      
      // 尝试通过直接方式调用生成函数
      try {
        const agentGenerateFn = (window as any).shenyuGenerateAgent;
        
        if (typeof agentGenerateFn === 'function') {
          // 直接调用模式 - 绕过事件链路
          console.log('[ShenyuInputArea] 检测到全局生成函数，使用直接模式');
          agentGenerateFn(trimmedMessage);
          setMessage('');
          return;
        }
        
        // 如果没有找到全局函数，回退到默认模式
        console.log('[ShenyuInputArea] 未找到全局生成函数，使用标准提交模式');
        
        // 检查onSubmit是否存在
        if (typeof onSubmit !== 'function') {
          console.error('[ShenyuInputArea] 错误: onSubmit不是函数!', onSubmit);
          return;
        }
        
        // 直接调用并跟踪
        console.log('[ShenyuInputArea] 正在调用onSubmit函数...');
        onSubmit(trimmedMessage);
        console.log('[ShenyuInputArea] onSubmit回调成功调用');
        setMessage('');
      } catch (error) {
        console.error('[ShenyuInputArea] 提交处理错误:', error);
      }
    } else {
      console.warn('[ShenyuInputArea] 无法提交:',  
        disabled ? '输入框已禁用' : '输入内容为空');
    }
  };
  
  // 按键处理：Enter换行，Shift+Enter发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="shenyu-input-area" style={{
      padding: 'var(--space-md)',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--card-bg)'
    }}>
      <div className="input-container" style={{
        display: 'flex',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--main-bg)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-sm)',
        position: 'relative'
      }}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: '24px',
            maxHeight: '150px',
            backgroundColor: 'transparent',
            border: 'none',
            resize: 'none',
            outline: 'none',
            color: 'var(--text-white)',
            fontSize: 'var(--font-md)',
            padding: 'var(--space-xs) var(--space-sm)'
          }}
        />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px'
        }}>
          <button
            onClick={(e) => {
              e.preventDefault(); // 确保不会触发表单提交
              console.log('[ShenyuInputArea] 提交按钮被点击');
              handleSubmit();
            }}
            disabled={message.trim() === '' || disabled}
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0 var(--space-md)',
              cursor: message.trim() === '' || disabled ? 'not-allowed' : 'pointer',
              opacity: message.trim() === '' || disabled ? 0.7 : 1,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)'
            }}
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8"></path>
            <path d="M8 12h8"></path>
          </svg>
          {hasGenerated ? '修改Agent' : buttonText}
          </button>
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: 'var(--font-xs)',
        color: 'var(--text-mid-gray)',
        marginTop: 'var(--space-xs)',
        width: '100%'
      }}>
        <div>
          按Enter换行，Shift+Enter发送
        </div>
      </div>
    </div>
  );
};

export default ShenyuInputArea;
