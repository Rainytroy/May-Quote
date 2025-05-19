import React, { useState, useEffect } from 'react';
import { extractJsonStructureInfo } from '../../utils/shenyuSystemPrompt';
import { ShenyuMessage } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import './MessageBubble.css';

interface JsonMessageBubbleProps {
  message: ShenyuMessage;
  loading?: boolean;
}

/**
 * JSON消息气泡组件
 * 
 * 用于显示神谕模式下生成的JSON格式消息
 */
const JsonMessageBubble: React.FC<JsonMessageBubbleProps> = ({ 
  message, 
  loading = false 
}) => {
  // 先移除 markdown 代码块标记
  const contentWithoutMarkdown = message.content.replace(/^```json\s*\n|\n```\s*$/g, '');
  
  // 提取JSON结构信息
  const jsonInfo = extractJsonStructureInfo(contentWithoutMarkdown);
  
  // 颜色高亮显示的JSON字符串
  const formattedJson = jsonInfo.isValidJson && jsonInfo.jsonContent
    ? JSON.stringify(JSON.parse(jsonInfo.jsonContent), null, 2)
    : contentWithoutMarkdown;

  // 初始状态设为已高亮模式
  const [viewMode, setViewMode] = useState<'highlighted' | 'raw'>('highlighted');
  
  // 添加自动触发事件的逻辑 - 当消息加载完成时
  useEffect(() => {
    // 如果消息内容存在且已加载完成(不在loading状态)
    if (!loading && message.content && jsonInfo.isValidJson) {
      console.log('[JsonMessageBubble] JSON消息加载完成，自动触发事件');
      
      // 自动触发事件，传递JSON内容
      window.dispatchEvent(new CustomEvent('shenyu-view-json', {
        detail: { jsonContent: contentWithoutMarkdown }
      }));
    }
  }, [loading, message.content, contentWithoutMarkdown, jsonInfo.isValidJson]);
  
  // 自定义代码块样式 - 使用Record代替PrismTheme类型
  const customCodeStyle: Record<string, any> = {
    'code[class*="language-"]': { color: '#ffffff', fontSize: '0.85em', fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', wordSpacing: 'normal', wordBreak: 'break-word', lineHeight: '1.5', tabSize: '4', hyphens: 'none' },
    'pre[class*="language-"]': { color: '#ffffff', fontSize: '0.85em', fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', direction: 'ltr', textAlign: 'left', whiteSpace: 'pre-wrap', wordSpacing: 'normal', wordBreak: 'break-word', lineHeight: '1.5', tabSize: '4', hyphens: 'none', padding: '0', margin: '0', overflow: 'hidden auto', background: 'var(--ai-bubble)' },
    ':not(pre) > code[class*="language-"]': { background: 'var(--ai-bubble)', padding: '0.1em', borderRadius: '0.3em', whiteSpace: 'normal' },
    'comment': { color: '#ffffff' }, 'prolog': { color: '#ffffff' }, 'doctype': { color: '#ffffff' }, 'cdata': { color: '#ffffff' }, 'punctuation': { color: '#ffffff' }, 'property': { color: '#ffffff' }, 'tag': { color: '#ffffff' }, 'boolean': { color: '#ffffff' }, 'number': { color: '#ffffff' }, 'constant': { color: '#ffffff' }, 'symbol': { color: '#ffffff' }, 'deleted': { color: '#ffffff' }, 'selector': { color: '#ffffff' }, 'attr-name': { color: '#ffffff' }, 'string': { color: '#ffffff' }, 'char': { color: '#ffffff' }, 'builtin': { color: '#ffffff' }, 'inserted': { color: '#ffffff' }, 'operator': { color: '#ffffff' }, 'entity': { color: '#ffffff' }, 'url': { color: '#ffffff' }, 'atrule': { color: '#ffffff' }, 'attr-value': { color: '#ffffff' }, 'keyword': { color: '#ffffff' }, 'function': { color: '#ffffff' }, 'regex': { color: '#ffffff' }, 'important': { color: '#ffffff' }, 'variable': { color: '#ffffff' }, 'bold': { fontWeight: 'bold' }, 'italic': { fontStyle: 'italic' }
  };
  
  return (
    <div>
      {/* JSON内容区域 */}
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        {viewMode === 'highlighted' ? (
          <SyntaxHighlighter 
            language="json" 
            style={customCodeStyle} 
            wrapLines={true} 
            wrapLongLines={true}
            customStyle={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'hidden',
              backgroundColor: 'var(--ai-bubble)', 
              fontSize: '0.85em',
              margin: 0, 
              padding: '0',
              lineHeight: '1.5'
            }}
          >
            {formattedJson}
          </SyntaxHighlighter>
        ) : (
          <pre style={{ 
            color: '#ffffff', 
            fontSize: '0.85em', 
            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            whiteSpace: 'pre-wrap',
            margin: 0,
            padding: '1em',
            backgroundColor: 'var(--ai-bubble)'
          }}>
            {message.content} {/* 直接使用原始消息内容，保持API返回的原样 */}
          </pre>
        )}
      </div>
      
      {/* 底部工具栏 */}
      <div className="shenyu-message-footer" style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'var(--space-sm)',
        paddingTop: 'var(--space-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--secondary-bg)', borderRadius: 'var(--radius-sm)', padding: '2px', display: 'flex' }}>
            <button 
              onClick={() => setViewMode('highlighted')} 
              style={{ 
                backgroundColor: viewMode === 'highlighted' ? 'var(--main-bg)' : 'transparent', 
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
              onClick={() => setViewMode('raw')} 
              style={{ 
                backgroundColor: viewMode === 'raw' ? 'var(--main-bg)' : 'transparent', 
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
        </div>
        <button 
          onClick={() => {
            // 直接传递原始JSON内容，不做任何格式处理
            console.log('[JsonMessageBubble] 点击查看按钮，传递原始JSON');
            
            window.dispatchEvent(new CustomEvent('shenyu-view-json', {
              detail: { jsonContent: contentWithoutMarkdown }
            }));
          }}
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
    </div>
  );
};

export default JsonMessageBubble;
