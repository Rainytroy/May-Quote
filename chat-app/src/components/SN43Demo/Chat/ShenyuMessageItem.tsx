import React, { useState, useEffect } from 'react';
import { formatSmartTime } from '../../../utils/date-utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePromptTemplates } from '../contexts/PromptTemplateContext';

// 神谕消息数据结构
export interface ShenyuMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
  jsonOutput?: string;   // JSON输出内容
  apiRawResponse?: string; // API原始响应
  activeTemplate?: string; // 当前使用的模板ID
  sender?: string;        // 自定义发送者名称
  type?: 'json' | 'prompt'; // 消息类型：json(默认) 或 prompt(纯文本提示词)
}

interface ShenyuMessageItemProps {
  message: ShenyuMessage;
  onGenerateControls?: (jsonText: string) => void; // 生成控件回调
}

/**
 * 神谕特有的消息气泡组件
 * 
 * 扩展May的气泡结构，支持JSON内容展示和特殊交互
 */
const ShenyuMessageItem: React.FC<ShenyuMessageItemProps> = ({ 
  message, 
  onGenerateControls 
}) => {
  // 使用提示词模板上下文获取当前激活的模板
  const { activeTemplates, savedTemplates } = usePromptTemplates();
  
  // 用于切换API原始响应和JSON视图
  const [activeView, setActiveView] = useState<'json' | 'raw'>('json');
  
  // 判断是否是用户消息
  const isUser = message.role === 'user';
  
  // 获取显示的内容
  const getDisplayContent = () => {
    if (isUser) {
      return message.content;
    }
    
    if (message.loading) {
      return "神谕运行中...";
    }
    
    if (activeView === 'raw' && message.apiRawResponse) {
      return message.apiRawResponse;
    }
    
    return message.jsonOutput || message.content;
  };
  
  // 获取显示状态信息
  const getStatusDescription = () => {
    if (message.loading) {
      return "神谕正在运行，可能需要几秒钟...";
    }
    
    if (!message.jsonOutput && !message.apiRawResponse) {
      return "处理中，等待API响应...";
    }
    
    return null;
  };
  
  // 方便调试，在控制台输出消息状态
  useEffect(() => {
    console.log('[ShenyuMessageItem] 消息状态:', {
      id: message.id,
      role: message.role,
      loading: message.loading,
      hasJsonOutput: !!message.jsonOutput,
      hasApiResponse: !!message.apiRawResponse,
      activeView,
      content: message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '')
    });
  }, [message, activeView]);
  
  // 处理生成控件按钮点击
  const handleGenerateControls = () => {
    if (onGenerateControls && message.jsonOutput) {
      onGenerateControls(message.jsonOutput);
    }
  };
  
  // 获取模板名称
  const getTemplateName = () => {
    if (!message.activeTemplate) return "默认模板";
    
    const template = savedTemplates.find(t => t.id === message.activeTemplate);
    return template ? template.name : "未知模板";
  };
  
  return (
    <div 
      id={`message-${message.id}`}
      className={`shenyu-message-item ${isUser ? 'user' : 'ai'}`} 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        marginBottom: 'var(--space-md)'
      }}
    >
      {/* 消息头部：发送者和时间 */}
      <div 
        className="message-header"
        style={{
          textAlign: isUser ? 'right' : 'left',
          width: '100%',
          maxWidth: '80%',
          color: 'var(--text-light-gray)',
          fontSize: 'var(--font-sm)',
          marginBottom: 'var(--space-xs)'
        }}
      >
        {isUser ? '你' : message.sender || 'May the 神谕 be with you'}
        <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--font-xs)' }}>
          {formatSmartTime(message.timestamp)}
        </span>
      </div>
      
      {/* 消息内容 */}
      <div 
        className={`message-bubble ${isUser ? 'user' : 'ai'}`}
        style={{
          backgroundColor: isUser ? 'var(--brand-color)' : 'var(--card-bg)',
          color: isUser ? 'var(--text-dark)' : 'var(--text-white)',
          padding: 'var(--space-md)',
          borderRadius: '6px',
          maxWidth: '80%',
          minWidth: '200px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative',
          ...(isUser 
            ? { borderTopRightRadius: '0', alignSelf: 'flex-end' } 
            : { borderTopLeftRadius: '0', alignSelf: 'flex-start' }
          )
        }}
      >
        {/* 神谕AI消息的特殊顶部工具栏 */}
        {!isUser && !message.loading && message.jsonOutput && (
          <div className="shenyu-message-toolbar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 'var(--space-sm)',
            paddingBottom: 'var(--space-sm)'
          }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--brand-color)' }}>
              神谕版本：{getTemplateName()}
            </div>
          </div>
        )}
        
        {/* 用户消息保持纯文本 */}
        {isUser ? (
          <div>{message.content}</div>
        ) : (
          <div>
            {/* AI消息加载状态显示加载动画 */}
            {/* 根据消息类型和状态显示不同内容 */}
            {message.loading || (!message.jsonOutput && !message.apiRawResponse) ? (
              /* 加载状态显示 */
              <div className="loading-state" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 'var(--space-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{message.loading ? "神谕运行中" : "等待API响应"}</span>
                  <span className="typing-indicator" style={{ display: 'inline-block', marginLeft: 'var(--space-xs)' }}>
                    <span className="dot" style={{ 
                      display: 'inline-block', 
                      width: '4px', 
                      height: '4px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--text-white)', 
                      margin: '0 2px',
                      opacity: 0.7,
                      animation: 'blink 1s infinite'
                    }}></span>
                    <span className="dot" style={{ 
                      display: 'inline-block', 
                      width: '4px', 
                      height: '4px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--text-white)', 
                      margin: '0 2px',
                      opacity: 0.7,
                      animation: 'blink 1s infinite 0.2s'
                    }}></span>
                    <span className="dot" style={{ 
                      display: 'inline-block', 
                      width: '4px', 
                      height: '4px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--text-white)', 
                      margin: '0 2px',
                      opacity: 0.7,
                      animation: 'blink 1s infinite 0.4s'
                    }}></span>
                    <style>
                      {`
                        @keyframes blink {
                          0%, 100% { opacity: 0.3; }
                          50% { opacity: 1; }
                        }
                      `}
                    </style>
                  </span>
                </div>
                
                {getStatusDescription() && (
                  <div style={{ 
                    fontSize: 'var(--font-xs)', 
                    color: 'var(--text-light-gray)', 
                    fontStyle: 'italic'
                  }}>
                    {getStatusDescription()}
                  </div>
                )}
              </div>
            ) : message.type === 'prompt' ? (
              /* Prompt类型消息 - 类似May的普通消息，仅显示内容，没有工具栏 */
              <div 
                className="markdown-body"
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  overflow: 'visible' // 不限制高度
                }}
              >
                {/* 简单的Markdown渲染，与May类似 */}
                <div
                  dangerouslySetInnerHTML={{ 
                    __html: getDisplayContent()
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                      .replace(/\*([^*]*)\*/g, '<em>$1</em>') // Italic
                      .replace(/`([^`]*)`/g, '<code style="background-color: #2d3748; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>') // Inline code
                      .replace(/\n/g, '<br/>') // Line breaks
                  }} 
                />
              </div>
            ) : (
              /* 默认JSON类型消息 - 原有的JSON/API双视图 */
              <>
                {/* JSON/API响应内容 - 根据内容类型决定渲染方式 */}
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {(() => {
                    // 检查是否是JSON字符串
                    const content = getDisplayContent();
                    const isJsonContent = (() => {
                      try {
                        // 尝试检测是否是JSON格式 - 以{ 开头且包含"adminInputs"和"promptBlocks"
                        return content.trim().startsWith('{') && 
                          content.includes('"adminInputs"') && 
                          content.includes('"promptBlocks"');
                      } catch (e) {
                        return false;
                      }
                    })();
                    
                    if (isJsonContent) {
                      // 如果是JSON，使用语法高亮显示
                      console.log('[ShenyuMessageItem] 渲染为JSON格式');
                      return (
                        <SyntaxHighlighter
                          style={atomDark}
                          language="json"
                          wrapLines={true}
                          wrapLongLines={true}
                        >
                          {content}
                        </SyntaxHighlighter>
                      );
                    } else {
                      // 如果不是JSON，渲染为普通文本
                      // 这里可以实现Markdown渲染
                      console.log('[ShenyuMessageItem] 渲染为Markdown格式');
                      return (
                        <div 
                          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                          dangerouslySetInnerHTML={{ 
                            __html: content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                              .replace(/\*([^*]*)\*/g, '<em>$1</em>') // Italic
                              .replace(/`([^`]*)`/g, '<code>$1</code>') // Inline code
                              .replace(/\n/g, '<br/>') // Line breaks
                          }} 
                        />
                      );
                    }
                  })()}
                </div>
                
                {/* 底部工具栏 - 只在JSON类型消息中显示 */}
                {message.jsonOutput && message.apiRawResponse && (
                  <div className="shenyu-message-footer" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'var(--space-sm)',
                    paddingTop: 'var(--space-sm)'
                  }}>
                    {/* 视图切换 */}
                    <div style={{
                      backgroundColor: 'var(--secondary-bg)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px',
                      display: 'flex'
                    }}>
                      <button
                        onClick={() => setActiveView('json')}
                        style={{
                          backgroundColor: activeView === 'json' ? 'var(--main-bg)' : 'transparent',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-xs)'
                        }}
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => setActiveView('raw')}
                        style={{
                          backgroundColor: activeView === 'raw' ? 'var(--main-bg)' : 'transparent',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-xs)'
                        }}
                      >
                        API原始响应
                      </button>
                    </div>
                    
                    {/* 生成控件按钮 */}
                    <button
                      onClick={handleGenerateControls}
                      style={{
                        backgroundColor: 'var(--brand-color)',
                        color: 'var(--text-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-xs)',
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
                      查看
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShenyuMessageItem;
