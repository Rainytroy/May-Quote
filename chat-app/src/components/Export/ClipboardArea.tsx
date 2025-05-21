import React, { useState, useEffect } from 'react';
import { ClipboardItem, ClipboardTab as ClipboardTabType } from '../../types';
import ClipboardTab from './ClipboardTab';
import ClipboardCard from './ClipboardCard';

interface ClipboardAreaProps {
  items?: ClipboardItem[];
  onCopy?: (itemId: string) => void;
  onQuote?: (itemId: string) => void;
  onLocate?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onExportMarkdown?: () => void;
  onExportPDF?: () => void;
  onClearAll?: () => void;
  onReorder?: (items: ClipboardItem[]) => void;
}

/**
 * 剪贴板区域组件
 * 
 * 提供剪贴板功能，包括Tab栏、工具栏、内容列表和多选模式
 * 设计为可扩展的多Tab系统，支持VS Code样式的Tab
 */
const ClipboardArea: React.FC<ClipboardAreaProps> = ({
  items = [],
  onCopy,
  onQuote,
  onLocate,
  onDelete,
  onExportMarkdown,
  onExportPDF,
  onClearAll,
  onReorder
}) => {
  // Tab状态
  const [tabs, setTabs] = useState<ClipboardTabType[]>([
    { id: 'clipboard', title: '剪贴板', type: 'clipboard', closable: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('clipboard');
  
  // 多选状态
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 更多操作菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // 选择所有项
  const handleSelectAll = () => {
    if (items.length === selectedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };
  
  // 处理单个项目选择
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };
  
  // 处理Tab切换
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };
  
  // 处理Tab关闭
  const handleTabClose = (tabId: string) => {
    // 默认的剪贴板tab不可关闭
    if (tabId === 'clipboard') return;
    
    // 移除Tab
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    // 如果关闭的是当前活动Tab，切换到剪贴板Tab
    if (tabId === activeTabId) {
      setActiveTabId('clipboard');
    }
  };
  
  // 取消多选模式
  const handleCancelSelection = () => {
    setSelectMode(false);
    setSelectedItems([]);
  };
  
  // 处理批量导出为Markdown
  const handleExportSelectedMarkdown = () => {
    // 如果有导出函数，则调用
    if (onExportMarkdown) {
      onExportMarkdown();
    }
    
    // 退出多选模式
    handleCancelSelection();
  };
  
  // 处理批量导出为PDF
  const handleExportSelectedPDF = () => {
    // 如果有导出函数，则调用
    if (onExportPDF) {
      onExportPDF();
    }
    
    // 退出多选模式
    handleCancelSelection();
  };
  
  // 处理批量引用
  const handleQuoteSelected = () => {
    // 引用功能预留位置
    console.log('引用选中项:', selectedItems);
    
    // 退出多选模式
    handleCancelSelection();
  };
  
  // 渲染空状态
  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ textAlign: 'center' }}>
        {/* 剪贴板图标 */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ color: 'var(--text-light-gray)' }}
          >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M12 11v6"></path>
            <path d="M9 14h6"></path>
          </svg>
        </div>
        <p>右键点击对话中的消息，或点击消息底部的"添加到剪贴板"按钮，可将内容添加到剪贴板</p>
        <p style={{ 
          marginTop: 'var(--space-md)',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-mid-gray)'
        }}>
          添加后可以将内容导出为Markdown或PDF格式
        </p>
      </div>
    );
  }
  
  return (
    <div className="clipboard-area-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标签栏 */}
      <div 
        className="clipboard-tabs-bar"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--sidebar-bg)',
        }}
      >
        {tabs.map(tab => (
          <ClipboardTab 
            key={tab.id}
            id={tab.id}
            title={tab.title}
            isActive={activeTabId === tab.id}
            closable={tab.closable}
            onClick={() => handleTabChange(tab.id)}
            onClose={() => handleTabClose(tab.id)}
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
          剪贴板内容 ({items.length})
        </div>
        
        <div className="toolbar-actions" style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {/* 更多按钮 */}
          <div style={{ position: 'relative' }}>
            <button
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
                        setSelectMode(true);
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
                        if (onExportMarkdown) onExportMarkdown();
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
                        if (onExportPDF) onExportPDF();
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
                        if (onClearAll) onClearAll();
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
      
      {/* 内容区 */}
      <div 
        className="clipboard-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-md)',
          position: 'relative', // 用于绝对定位多选工具栏
        }}
      >
        {/* 卡片列表 */}
        <div style={{ paddingLeft: selectMode ? '30px' : 0 }}>
          {items.map(item => (
            <ClipboardCard
              key={item.id}
              item={item}
              selectMode={selectMode}
              selected={selectedItems.includes(item.id)}
              onSelect={handleItemSelect}
              onCopy={onCopy}
              onQuote={onQuote}
              onLocate={onLocate}
              onDelete={onDelete}
            />
          ))}
        </div>
        
        {/* 多选工具栏 */}
        {selectMode && (
          <div
            className="selection-toolbar"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 'var(--space-md)',
              backgroundColor: 'var(--main-bg)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <div className="selection-info">
              已选择 {selectedItems.length} / {items.length} 项
            </div>
            
            <div className="selection-actions" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-light-gray)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer',
                }}
              >
                {items.length === selectedItems.length ? '取消全选' : '全选'}
              </button>
              
              <button
                onClick={handleQuoteSelected}
                disabled={selectedItems.length === 0}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-light-gray)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedItems.length === 0 ? 0.5 : 1,
                }}
              >
                引用所选
              </button>
              
              <button
                onClick={handleExportSelectedMarkdown}
                disabled={selectedItems.length === 0}
                style={{
                  backgroundColor: 'var(--brand-color)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-dark)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedItems.length === 0 ? 0.5 : 1,
                }}
              >
                导出为Markdown
              </button>
              
              <button
                onClick={handleExportSelectedPDF}
                disabled={selectedItems.length === 0}
                style={{
                  backgroundColor: 'var(--brand-color)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-dark)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedItems.length === 0 ? 0.5 : 1,
                }}
              >
                导出为PDF
              </button>
              
              <button
                onClick={handleCancelSelection}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-light-gray)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipboardArea;
