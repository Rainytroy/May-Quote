import React, { useState, useRef, useEffect } from 'react';
import { useReference } from '../../contexts/ReferenceContext';
import ReferenceTag from '../Reference/ReferenceTag';
import ModeSelector from '../ModeSelector';
import { useMode } from '../../contexts/ModeContext';
import { getShenyuSystemPromptSync, triggerDebugEvent } from '../Shenyu/utils/shenyuSystemPrompt';
import { ChatMode } from '../Shenyu/types';

interface InputAreaProps {
  onSendMessage: (content: string, mode?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = '输入消息...'
}) => {
  // 引用状态管理
  const { references, deleteReference, getFullPrompt, clearAllReferences } = useReference();
  
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  // 获取当前模式
  const { currentMode } = useMode();
  
  // 发送消息处理
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || references.length > 0) && !disabled) {
      // 使用引用内容和用户输入构建完整提示
      let fullPrompt = getFullPrompt(trimmedMessage);
      
      // 神谕模式下添加系统提示词
      if (currentMode === 'shenyu') {
        // 记录原始用户输入用于调试
        const originalUserInput = fullPrompt;
        
        // 获取神谕系统提示词
        const systemPrompt = getShenyuSystemPromptSync(fullPrompt);
        
        // 记录请求信息到调试工具
        triggerDebugEvent({
          systemPrompt,
          userInput: originalUserInput,
          contextMessagesCount: 0, // 这里无法获取上下文消息数量，由useChat内部处理
          fullPayload: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: originalUserInput }
          ]
        });
        
        // 这里我们不修改用户输入内容，系统提示词的添加由useChat内部处理
        // 我们只是记录用于调试目的
      }
      
      // 传递当前模式作为第二个参数，确保与消息一起准确传递
      onSendMessage(fullPrompt, currentMode);
      setMessage('');
      // 清除所有引用
      clearAllReferences();
    }
  };
  
  // 按键处理：Enter换行，Shift+Enter发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="input-area">
      {/* 引用标签区域 */}
      {references.length > 0 && (
        <div className="reference-tags-container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '8px',
          padding: '8px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          {references.map(ref => (
            <ReferenceTag 
              key={ref.id}
              reference={ref}
              onDelete={deleteReference}
            />
          ))}
        </div>
      )}
      
      <div className="input-container" ref={inputContainerRef}>
        <ModeSelector 
          className="input-mode-selector"
        />
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            minHeight: '24px',
            maxHeight: '150px'
          }}
          className="chat-textarea"
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={(message.trim() === '' && references.length === 0) || disabled}
        >
          发送
        </button>
      </div>
      <div style={{
        fontSize: 'var(--font-xs)',
        color: 'var(--text-mid-gray)',
        marginTop: 'var(--space-xs)',
        textAlign: 'right'
      }}>
        按Enter换行，Shift+Enter发送
      </div>
    </div>
  );
};

export default InputArea;
