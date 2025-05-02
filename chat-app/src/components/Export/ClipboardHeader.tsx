import React from 'react';
import { ClipboardTab as ClipboardTabType } from '../../types';
import ClipboardTab from './ClipboardTab';

interface ClipboardHeaderProps {
  tabs: ClipboardTabType[];
  activeTabId: string;
  itemCount: number;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onSelectMode: () => void;
  onSortMode: () => void; // 新增排序模式回调
  onExportMarkdown: () => void;
  onExportPDF: () => void;
  onClearAll: () => void;
}

/**
 * 剪贴板头部组件 - 包含标签栏和工具栏
 */
const ClipboardHeader: React.FC<ClipboardHeaderProps> = ({
  tabs,
  activeTabId,
  itemCount,
  onTabChange,
  onTabClose,
  onSelectMode,
  onSortMode,
  onExportMarkdown,
  onExportPDF,
  onClearAll
}) => {
  // 更多操作菜单状态
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  
  // 创建点击外部关闭菜单的效果
  React.useEffect(() => {
    if (!showMoreMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuButton = document.querySelector('.more-menu-button');
      const menuContent = document.querySelector('.more-menu-content');
      
      // 如果点击的不是菜单按钮，也不是菜单内容，则关闭菜单
      if (menuButton && menuContent && 
          !menuButton.contains(target) && 
          !menuContent.contains(target)) {
        setShowMoreMenu(false);
      }
    };
    
    // 添加全局点击事件监听
    document.addEventListener('click', handleClickOutside);
    
    // 清理函数
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMoreMenu]);
  
  return (
    <>
      {/* 标签栏 - 始终显示 */}
      <div 
        className="clipboard-tabs-bar"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--sidebar-bg)',
          padding: 0,
          margin: 0,
        }}
      >
        {tabs.map(tab => (
          <ClipboardTab 
            key={tab.id}
            id={tab.id}
            title={tab.title}
            isActive={activeTabId === tab.id}
            closable={tab.closable}
            onClick={() => onTabChange(tab.id)}
            onClose={() => onTabClose(tab.id)}
          />
        ))}
      </div>
      
      {/* 工具栏 */}
      <div 
        className="clipboard-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-sm) var(--space-md)',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--secondary-bg)',
        }}
      >
        <div className="toolbar-title">
          剪贴板内容 ({itemCount})
        </div>
        
        <div className="toolbar-actions" style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {/* 更多按钮 */}
          <div style={{ position: 'relative' }}>
            <button
              className="more-menu-button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              aria-label="更多操作"
              title="更多操作"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-light-gray)',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            
            {/* 更多菜单 */}
            {showMoreMenu && (
              <div
                className="more-menu-content"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) 0',
                  minWidth: '160px',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  <li>
                    <button
                      onClick={() => {
                        onSelectMode();
                        setShowMoreMenu(false);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-white)',
                        padding: 'var(--space-xs) var(--space-md)',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      选择
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onSortMode();
                        setShowMoreMenu(false);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-white)',
                        padding: 'var(--space-xs) var(--space-md)',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      排序
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onExportMarkdown();
                        setShowMoreMenu(false);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-white)',
                        padding: 'var(--space-xs) var(--space-md)',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      导出为Markdown
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onExportPDF();
                        setShowMoreMenu(false);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-white)',
                        padding: 'var(--space-xs) var(--space-md)',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      导出为PDF
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onClearAll();
                        setShowMoreMenu(false);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--error-color)',
                        padding: 'var(--space-xs) var(--space-md)',
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      清空剪贴板
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClipboardHeader;
