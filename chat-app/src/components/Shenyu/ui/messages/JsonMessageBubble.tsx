import React, { useState, useEffect, useRef } from 'react';
import { extractJsonStructureInfo } from '../../utils/shenyuSystemPrompt';
import { ShenyuMessage } from '../../types';
import { Message } from '../../../../sharedTypes'; // 导入扩展后的Message类型
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
  
  // 记录前一次的loading状态，用于检测状态变化
  const prevLoadingRef = useRef<boolean | undefined>(loading);
  
  // 恢复自动渲染逻辑 - 由于我们已解决对话切换时的覆盖问题，可以安全地恢复此功能
  useEffect(() => {
    // 只处理JSON类型的消息
    if (message.type === 'json' && message.content && jsonInfo.isValidJson) {
      // 检查是否已经自动渲染过 - 使用Message对象自身的属性，确保切换对话后也能保持状态
      if (!(message as Message).hasAutoRendered) {
        console.log(`[JsonMessageBubble] 首次展示JSON消息，自动触发渲染。Message ID: ${message.id}`);
        
        // 标记为已自动渲染 - 直接修改消息对象，这个修改将在内存中保持
        (message as Message).hasAutoRendered = true;
        
        // 触发渲染事件
        window.dispatchEvent(new CustomEvent('shenyu-view-json', {
          detail: { 
            jsonContent: contentWithoutMarkdown,
            messageId: message.id 
          }
        }));
      } else {
        console.log(`[JsonMessageBubble] JSON消息已经自动渲染过，跳过。Message ID: ${message.id}`);
      }
    }
  }, [message, message.content, contentWithoutMarkdown, jsonInfo.isValidJson]);
  
  // 处理组件生命周期事件
  useEffect(() => {
    // 仅执行一次的挂载逻辑
    console.log(`[JsonMessageBubble] 组件挂载，Message ID: ${message.id}, hasAutoRendered: ${(message as Message).hasAutoRendered || false}`);
    
    return () => {
      // 清理逻辑
      console.log(`[JsonMessageBubble] 组件卸载。Message ID: ${message.id}`);
    };
  }, []); // 空依赖数组确保只执行一次
  
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
            // 直接传递原始JSON内容和消息ID
            console.log('[JsonMessageBubble] 点击查看按钮，传递原始JSON和消息ID:', message.id);
            
            window.dispatchEvent(new CustomEvent('shenyu-view-json', {
              detail: { 
                jsonContent: contentWithoutMarkdown,
                messageId: message.id 
              }
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
