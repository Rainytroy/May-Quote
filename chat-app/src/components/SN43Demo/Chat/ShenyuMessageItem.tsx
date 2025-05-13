// @ts-nocheck - 禁用整个文件的TypeScript检查
import React, { useState, useEffect, useMemo } from 'react';
import { formatSmartTime } from '../../../utils/date-utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 使用自定义样式代替atomDark
import { PrismTheme } from 'react-syntax-highlighter';
import { usePromptTemplates } from '../contexts/PromptTemplateContext';
import ReactMarkdown from 'react-markdown'; // <--- 引入
import remarkGfm from 'remark-gfm'; // <--- 引入

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
  // 内联Markdown样式 - 根据记录的最佳实践调整
  const markdownStyles = `
    /* Markdown 样式 - 适配深色主题 */
    .shenyu-markdown-body {
      color: inherit;
      line-height: 1.6;
      font-size: var(--font-md);
      word-break: break-word;
    }

    /* 标题 */
    .shenyu-markdown-body h1,
    .shenyu-markdown-body h2,
    .shenyu-markdown-body h3,
    .shenyu-markdown-body h4,
    .shenyu-markdown-body h5,
    .shenyu-markdown-body h6 {
      margin-top: var(--space-sm); 
      margin-bottom: var(--space-xs); 
      font-weight: 600;
      line-height: 1.3;
      color: inherit;
    }

    .shenyu-markdown-body h1 { font-size: 1.6em; }
    .shenyu-markdown-body h2 { font-size: 1.4em; }
    .shenyu-markdown-body h3 { font-size: 1.2em; }
    .shenyu-markdown-body h4 { font-size: 1.1em; }
    .shenyu-markdown-body h5 { font-size: 1em; }
    .shenyu-markdown-body h6 { font-size: 0.9em; }

    /* 段落和间距 */
    .shenyu-markdown-body p {
      margin-top: 0;
      margin-bottom: var(--space-sm); 
    }
    
    .shenyu-markdown-body ul,
    .shenyu-markdown-body ol {
      margin-top: 0;
      margin-bottom: var(--space-sm);
      padding-left: 1.5em; 
    }

    .shenyu-markdown-body li {
      margin-bottom: 0.25em; 
    }

    .shenyu-markdown-body li > p {
      margin-top: 0.25em; 
    }
    
    .shenyu-markdown-body pre {
      margin-top: 0; /* 之前是 var(--space-sm) */
      margin-bottom: var(--space-sm);
      overflow: auto;
      border-radius: var(--radius-md);
      background-color: transparent !important; 
    }

    .shenyu-markdown-body pre code {
      background-color: transparent;
      padding: 0;
      white-space: pre;
    }

    /* 内联代码 */
    .shenyu-markdown-body code {
      padding: 0.2em 0.4em;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      font-size: 0.9em;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }

    /* 链接 */
    .shenyu-markdown-body a {
      color: var(--brand-color);
      text-decoration: none;
    }

    .shenyu-markdown-body a:hover {
      text-decoration: underline;
    }

    /* 引用块 */
    .shenyu-markdown-body blockquote {
      padding: var(--space-sm) var(--space-md);
      border-left: 4px solid var(--brand-color);
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-light-gray);
      margin-left: 0;
      margin-right: 0;
      margin-bottom: var(--space-sm);
    }

    .shenyu-markdown-body blockquote > :last-child {
      margin-bottom: 0;
    }

    /* 表格 */
    .shenyu-markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: var(--space-md);
      overflow: auto;
      display: block;
    }

    .shenyu-markdown-body table th,
    .shenyu-markdown-body table td {
      padding: var(--space-xs) var(--space-sm);
      border: 1px solid var(--border-color);
    }

    .shenyu-markdown-body table th {
      font-weight: 600;
      background-color: rgba(255, 255, 255, 0.05);
    }

    /* 图片 */
    .shenyu-markdown-body img {
      max-width: 100%;
      border-radius: var(--radius-sm);
    }

    /* 水平线 */
    .shenyu-markdown-body hr {
      height: 1px;
      padding: 0;
      margin: var(--space-md) 0;
      background-color: var(--border-color);
      border: 0;
    }
  `;

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

  // 自定义代码块样式 (与之前版本保持一致或根据需要调整)
  const customCodeStyle: PrismTheme = {
    'code[class*="language-"]': { color: '#ffffff', fontSize: '0.85em', fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', wordSpacing: 'normal', wordBreak: 'break-word', lineHeight: '1.5', MozTabSize: '4', OTabSize: '4', tabSize: '4', WebkitHyphens: 'none', MozHyphens: 'none', msHyphens: 'none', hyphens: 'none' },
    'pre[class*="language-"]': { color: '#ffffff', fontSize: '0.85em', fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', wordSpacing: 'normal', wordBreak: 'break-word', lineHeight: '1.5', MozTabSize: '4', OTabSize: '4', tabSize: '4', WebkitHyphens: 'none', MozHyphens: 'none', msHyphens: 'none', hyphens: 'none', padding: '1em', margin: '0', overflow: 'auto', overflowX: 'hidden', background: '#333333' },
    ':not(pre) > code[class*="language-"]': { background: '#333333', padding: '0.1em', borderRadius: '0.3em', whiteSpace: 'normal' },
    'comment': { color: '#ffffff' }, 'prolog': { color: '#ffffff' }, 'doctype': { color: '#ffffff' }, 'cdata': { color: '#ffffff' }, 'punctuation': { color: '#ffffff' }, 'property': { color: '#ffffff' }, 'tag': { color: '#ffffff' }, 'boolean': { color: '#ffffff' }, 'number': { color: '#ffffff' }, 'constant': { color: '#ffffff' }, 'symbol': { color: '#ffffff' }, 'deleted': { color: '#ffffff' }, 'selector': { color: '#ffffff' }, 'attr-name': { color: '#ffffff' }, 'string': { color: '#ffffff' }, 'char': { color: '#ffffff' }, 'builtin': { color: '#ffffff' }, 'inserted': { color: '#ffffff' }, 'operator': { color: '#ffffff' }, 'entity': { color: '#ffffff' }, 'url': { color: '#ffffff' }, 'atrule': { color: '#ffffff' }, 'attr-value': { color: '#ffffff' }, 'keyword': { color: '#ffffff' }, 'function': { color: '#ffffff' }, 'regex': { color: '#ffffff' }, 'important': { color: '#ffffff' }, 'variable': { color: '#ffffff' }, 'bold': { fontWeight: 'bold' }, 'italic': { fontStyle: 'italic' }
  };
  
  // 定义Markdown渲染组件配置
  const markdownComponents = {
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={customCodeStyle} // <--- 使用自定义样式
          language={match[1]}
          PreTag="div"
          customStyle={{ backgroundColor: '#333333', fontSize: '0.8em', margin: 0, padding: '0', lineHeight: '1.3', overflowX: 'hidden' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };
  
  return (
    <>
      <style>{markdownStyles}</style> {/* <--- 应用内联样式 */}
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
            width: '80%', // 固定宽度替代maxWidth，与气泡保持一致
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
            width: '80%', // 固定宽度替代maxWidth，保持视觉一致性
            minWidth: '200px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            position: 'relative',
            ...(isUser 
              ? { borderTopRightRadius: '0', alignSelf: 'flex-end' } 
              : { borderTopLeftRadius: '0', alignSelf: 'flex-start' }
            )
          }}
        >
          {/* 神谕AI消息的特殊顶部工具栏 - 移除，因为prompt类型不应显示 */}
          
          {/* 用户消息保持纯文本 */}
          {isUser ? (
            <div>{message.content}</div>
          ) : (
            <div>
              {message.loading || (!message.jsonOutput && !message.apiRawResponse && message.type !== 'prompt') ? ( // 调整加载判断
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
                      <span className="dot" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-white)', margin: '0 2px', opacity: 0.7, animation: 'blink 1s infinite'}}></span>
                      <span className="dot" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-white)', margin: '0 2px', opacity: 0.7, animation: 'blink 1s infinite 0.2s'}}></span>
                      <span className="dot" style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-white)', margin: '0 2px', opacity: 0.7, animation: 'blink 1s infinite 0.4s'}}></span>
                      <style>{` @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } } `}</style>
                    </span>
                  </div>
                  {getStatusDescription() && (<div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-light-gray)', fontStyle: 'italic' }}>{getStatusDescription()}</div>)}
                </div>
              ) : message.type === 'prompt' ? (
                /* Prompt类型消息 - 使用ReactMarkdown渲染 */
                <div className="shenyu-markdown-body"> {/* <--- 应用className */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {getDisplayContent()}
                  </ReactMarkdown>
                </div>
              ) : (
                /* 默认JSON类型消息 - 原有的JSON/API双视图 */
                <>
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {(() => {
                      const content = getDisplayContent();
                      const isJsonContent = (() => {
                        try {
                          return content.trim().startsWith('{') && content.includes('"adminInputs"'); // 简化JSON判断
                        } catch (e) { return false; }
                      })();
                      
                      // 无论是JSON内容还是API原始响应，都使用SyntaxHighlighter统一样式
                      if (isJsonContent || activeView === 'raw') {
                        console.log('[ShenyuMessageItem] 渲染为JSON/API格式');
                        return (
                          <SyntaxHighlighter 
                            style={customCodeStyle} 
                            language={isJsonContent ? "json" : "text"} 
                            wrapLines={true} 
                            wrapLongLines={true}
                            customStyle={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowX: 'hidden',
                              backgroundColor: '#333333', 
                              fontSize: '0.85em',
                              margin: 0, 
                              padding: '0',
                              lineHeight: '1.5'
                            }}
                          >
                            {content}
                          </SyntaxHighlighter>
                        );
                      } else {
                        console.log('[ShenyuMessageItem] 内容非JSON，渲染为Markdown');
                        return (
                          <div className="shenyu-markdown-body"> {/* <--- 应用className */}
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                               {content}
                             </ReactMarkdown>
                          </div>
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
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ backgroundColor: 'var(--secondary-bg)', borderRadius: 'var(--radius-sm)', padding: '2px', display: 'flex' }}>
                          <button onClick={() => setActiveView('json')} style={{ backgroundColor: activeView === 'json' ? 'var(--main-bg)' : 'transparent', color: 'var(--text-white)', border: 'none', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-xs)' }}>JSON</button>
                          <button onClick={() => setActiveView('raw')} style={{ backgroundColor: activeView === 'raw' ? 'var(--main-bg)' : 'transparent', color: 'var(--text-white)', border: 'none', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-xs)' }}>API原始响应</button>
                        </div>
                        <div style={{ 
                          marginLeft: 'var(--space-sm)',
                          color: '#666',
                          fontSize: 'var(--font-xs)',
                          fontWeight: 'normal'
                        }}>
                          神谕版本：{getTemplateName()}
                        </div>
                      </div>
                      <button onClick={handleGenerateControls} style={{ backgroundColor: 'var(--brand-color)', color: 'var(--text-dark)', border: 'none', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
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
    </>
  );
};

export default ShenyuMessageItem;
