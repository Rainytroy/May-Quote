import React from 'react';

// 交互记录类型
interface InteractionEntry {
  id: number;
  timestamp: number;
  type: 'prompt' | 'response';
  content: string;
  note?: string;
}

interface InteractionHistoryPanelProps {
  interactions: InteractionEntry[];
  currentPrompt: string;
}

/**
 * 交互历史面板组件
 * 
 * 负责展示当前提示词和交互历史记录，从主组件中提取
 */
const InteractionHistoryPanel: React.FC<InteractionHistoryPanelProps> = ({
  interactions,
  currentPrompt
}) => {
  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-md)',
      height: '100%',
      overflow: 'auto'
    }}>
      <div className="current-prompt-section" style={{
        marginBottom: 'var(--space-md)'
      }}>
        <h3 style={{ 
          color: 'var(--text-white)', 
          fontSize: 'var(--font-md)',
          marginBottom: 'var(--space-sm)'
        }}>
          当前提示词
        </h3>
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-light-gray)',
          fontFamily: 'monospace',
          wordBreak: 'break-word',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          {currentPrompt || '尚未生成提示词'}
        </div>
      </div>

      <div className="interactions-section" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <h3 style={{ 
          color: 'var(--text-white)', 
          fontSize: 'var(--font-md)',
          marginBottom: 'var(--space-sm)'
        }}>
          历史记录
        </h3>
        
        {interactions.length > 0 ? (
          <div className="interactions-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            flex: 1,
            overflow: 'auto'
          }}>
            {interactions.map((entry) => (
              <div 
                key={entry.id}
                className={`interaction-entry ${entry.type === 'prompt' ? 'prompt' : 'response'}`}
                style={{
                  backgroundColor: 'var(--secondary-bg)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${entry.type === 'prompt' ? 'var(--brand-color)' : 'var(--border-color)'}`
                }}
              >
                <div className="interaction-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-sm)',
                  color: entry.type === 'prompt' ? 'var(--brand-color)' : 'var(--text-white)',
                  fontWeight: 'bold'
                }}>
                  <span>{entry.type === 'prompt' ? '提示词' : '响应'} {entry.note && `(${entry.note})`}</span>
                  <span style={{ color: 'var(--text-light-gray)', fontSize: 'var(--font-xs)' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <div className="interaction-content" style={{
                  color: 'var(--text-white)',
                  fontFamily: entry.type === 'prompt' ? 'monospace' : 'inherit',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflow: 'auto',
                  wordBreak: 'break-word'
                }}>
                  {entry.content.length > 500 
                    ? `${entry.content.substring(0, 500)}... (${entry.content.length}字)` 
                    : entry.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'var(--text-light-gray)',
            backgroundColor: 'var(--secondary-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p>尚无交互记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionHistoryPanel;
