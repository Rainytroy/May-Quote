import React, { useState, useEffect } from 'react';
import { SN43History } from '../types';

interface HistoryPanelProps {
  storageKey?: string;
  onSelect: (history: SN43History) => void;
  onNewChat: () => void;
}

/**
 * 历史记录面板组件
 * 
 * 负责显示和管理历史记录，包括：
 * - 显示历史记录列表
 * - 加载历史记录
 * - 删除历史记录
 * - 创建新会话
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({
  storageKey = 'sn43-history',
  onSelect,
  onNewChat
}) => {
  // 本地状态
  const [histories, setHistories] = useState<SN43History[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 初始化时加载历史记录
  useEffect(() => {
    loadHistories();
  }, []);
  
  // 加载历史记录
  const loadHistories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: 实际环境中，应该从服务器或本地存储加载历史记录
      // 这里使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 300)); // 模拟加载时间
      
      // 创建一些示例历史记录数据
      const mockHistories: SN43History[] = [
        {
          id: '1',
          timestamp: Date.now() - 3600000, // 1小时前
          userInputs: { inputA1: '市场调研', inputA2: '智能手表' },
          adminInputs: { inputB1: '竞品分析' },
          promptBlocks: [{ text: '分析智能手表市场...' }],
          result: '这是一份市场分析结果...',
          selectedJsonFile: 'marketing_assistant.json'
        },
        {
          id: '2',
          timestamp: Date.now() - 86400000, // 1天前
          userInputs: { inputA1: '技术文档', inputA2: 'React组件' },
          adminInputs: { inputB1: '代码示例' },
          promptBlocks: [{ text: '编写React组件文档...' }],
          result: '这是React组件的文档...',
          selectedJsonFile: 'technical_writing.json'
        },
        {
          id: '3',
          timestamp: Date.now() - 172800000, // 2天前
          userInputs: { inputA1: '故事创作', inputA2: '科幻小说' },
          adminInputs: { inputB1: '未来世界' },
          promptBlocks: [{ text: '创作科幻小说情节...' }],
          result: '这是一个科幻故事...',
          selectedJsonFile: 'storytelling.json'
        }
      ];
      
      setHistories(mockHistories);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      setError('无法加载历史记录');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 选择历史记录
  const handleSelectHistory = (history: SN43History) => {
    setActiveHistoryId(history.id);
    onSelect(history);
  };
  
  // 删除确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  
  // 显示删除确认
  const confirmDelete = (historyId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止冒泡到选择事件
    setHistoryToDelete(historyId);
    setShowDeleteConfirm(true);
  };
  
  // 删除历史记录
  const handleDeleteHistory = async () => {
    if (!historyToDelete) return;
    
    try {
      // TODO: 实际环境中，应该从服务器或本地存储删除历史记录
      // 这里直接更新本地状态
      setHistories(prev => prev.filter(h => h.id !== historyToDelete));
      
      // 如果删除的是当前选中的历史记录，取消选中
      if (activeHistoryId === historyToDelete) {
        setActiveHistoryId(null);
      }
      
      // 重置删除状态
      setHistoryToDelete(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('删除历史记录失败:', error);
      // 使用console.error代替alert
      console.error('删除历史记录失败');
      setShowDeleteConfirm(false);
    }
  };
  
  // 取消删除
  const cancelDelete = () => {
    setHistoryToDelete(null);
    setShowDeleteConfirm(false);
  };
  
  // 创建日期格式化函数
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // 生成历史记录标题
  const getHistoryTitle = (history: SN43History) => {
    // 从用户输入中生成标题
    const firstInput = Object.values(history.userInputs)[0] || '';
    return firstInput.length > 30 ? firstInput.substring(0, 30) + '...' : firstInput || '未命名对话';
  };
  
  // 更新或创建历史记录
  const updateOrCreateHistory = (history: SN43History) => {
    // 检查是否已存在相同ID的历史记录
    const index = histories.findIndex(h => h.id === history.id);
    
    if (index !== -1) {
      // 更新现有历史记录
      const updatedHistories = [...histories];
      updatedHistories[index] = { ...history, timestamp: Date.now() }; // 更新时间戳
      setHistories(updatedHistories);
    } else {
      // 创建新历史记录
      const newHistory = { ...history, id: Date.now().toString(), timestamp: Date.now() };
      setHistories([newHistory, ...histories]);
    }
    
    // 设置为当前选中的历史记录
    setActiveHistoryId(history.id);
  };
  
  return (
    <div className="history-panel" style={{
      width: isExpanded ? '250px' : '50px',
      height: '100%',
      backgroundColor: 'var(--card-bg)',
      borderRight: '1px solid var(--border-color)',
      transition: 'width 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 展开/折叠按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--text-light-gray)',
          padding: 'var(--space-sm)',
          cursor: 'pointer',
          alignSelf: isExpanded ? 'flex-end' : 'center',
          marginBottom: isExpanded ? '0' : 'var(--space-md)'
        }}
        aria-label={isExpanded ? '折叠侧边栏' : '展开侧边栏'}
        title={isExpanded ? '折叠侧边栏' : '展开侧边栏'}
      >
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18"></polyline>
          </svg>
        )}
      </button>
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            width: '240px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}>
            <h4 style={{ 
              margin: '0 0 var(--space-md) 0', 
              color: 'var(--text-white)', 
              textAlign: 'center' 
            }}>
              确认删除
            </h4>
            <p style={{ 
              margin: '0 0 var(--space-md) 0', 
              color: 'var(--text-light-gray)', 
              textAlign: 'center',
              fontSize: 'var(--font-sm)'
            }}>
              确定要删除此历史记录吗？此操作不可恢复。
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-md)'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteHistory}
                style={{
                  backgroundColor: 'var(--error-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer'
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 历史记录面板内容 - 仅在展开时显示 */}
      {isExpanded && (
        <>
          {/* 标题和新建按钮 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 'var(--space-sm) var(--space-md)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ 
              margin: 0, 
              color: 'var(--text-white)', 
              fontSize: 'var(--font-md)'
            }}>
              历史记录
            </h3>
            <button
              onClick={onNewChat}
              style={{
                backgroundColor: 'var(--brand-color)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新对话
            </button>
          </div>
          
          {/* 历史记录列表 */}
          <div className="history-list" style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-sm)'
          }}>
            {isLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--space-md)',
                color: 'var(--text-light-gray)'
              }}>
                加载中...
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--space-md)',
                color: 'var(--error-color)'
              }}>
                {error}
              </div>
            ) : histories.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--space-md)',
                color: 'var(--text-light-gray)'
              }}>
                没有历史记录
              </div>
            ) : (
              histories.map(history => (
                <div
                  key={history.id}
                  onClick={() => handleSelectHistory(history)}
                  style={{
                    padding: 'var(--space-sm)',
                    marginBottom: 'var(--space-sm)',
                    backgroundColor: history.id === activeHistoryId ? 'var(--secondary-bg)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>
                    {getHistoryTitle(history)}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-light-gray)' }}>
                    {formatDate(history.timestamp)}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--font-xs)', 
                    color: 'var(--brand-color)',
                    marginTop: '4px'
                  }}>
                    {history.selectedJsonFile ? history.selectedJsonFile.replace('.json', '') : '默认配置'}
                  </div>
                  
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => confirmDelete(history.id, e)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-light-gray)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      opacity: 0.7
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                    title="删除历史记录"
                    aria-label="删除历史记录"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPanel;
