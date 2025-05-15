import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { ClipboardItem, ClipboardTab as ClipboardTabType } from '../../types';
import ClipboardHeader from './ClipboardHeader';
import ClipboardDraggableList from './ClipboardDraggableList';
import SelectionToolbar from './SelectionToolbar';
import SortModeToolbar from './SortModeToolbar';
import SortModeList from './SortModeList';
import { useClipboardSelection } from '../../hooks/useClipboardSelection';
import { useSortMode } from '../../hooks/useSortMode';
import { useReference } from '../../contexts/ReferenceContext';
import { useMode } from '../../contexts/ModeContext';

interface DraggableClipboardAreaProps {
  items?: ClipboardItem[];
  onCopy?: (itemId: string) => void;
  onQuote?: (itemId: string) => void;
  onLocate?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  onExportMarkdown?: (selectedIds?: string[]) => void;
  onExportPDF?: (selectedIds?: string[]) => void;
  onClearAll?: () => void;
  onReorder?: (items: ClipboardItem[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 支持拖拽功能的剪贴板区域组件
 * 
 * 提供剪贴板功能，包括Tab栏、工具栏、可拖拽内容列表和多选模式
 * 使用react-beautiful-dnd实现流畅的拖拽体验
 */
const DraggableClipboardArea: React.FC<DraggableClipboardAreaProps> = ({
  items = [],
  onCopy,
  onQuote,
  onLocate,
  onDelete,
  onExportMarkdown,
  onExportPDF,
  onClearAll,
  onReorder,
  className,
  style
}) => {
  // 获取引用上下文
  const { addReference } = useReference();
  
  // 获取当前模式
  const { currentMode } = useMode();
  
  // Tab状态
  const [tabs, setTabs] = useState<ClipboardTabType[]>([
    { id: 'clipboard', title: '剪贴板', type: 'clipboard', closable: false },
    { id: 'shenyu', title: '神谕', type: 'shenyu', closable: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('clipboard');
  
  // 根据当前模式自动切换tab
  useEffect(() => {
    if (currentMode === 'may') {
      setActiveTabId('clipboard');
    } else if (currentMode === 'shenyu') {
      setActiveTabId('shenyu');
    }
  }, [currentMode]);
  
  // 剪贴板项目状态 - 保持本地副本以便拖拽排序
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);

  // 使用自定义Hook管理选择相关状态
  const {
    selectMode,
    selectedItems,
    enterSelectMode,
    cancelSelection,
    selectAll,
    isAllSelected,
    handleItemSelect
  } = useClipboardSelection(items);
  
  // 使用自定义Hook管理排序相关状态
  const {
    sortMode,
    tempSortedItems,
    enterSortMode,
    exitSortMode,
    moveItemUp,
    moveItemDown
  } = useSortMode(clipboardItems, onReorder);
  
  // 创建最后一项的引用，用于自动滚动
  const lastItemRef = useRef<HTMLDivElement>(null);
  
  // 创建容器的引用，用于计算工具栏位置
  const containerRef = useRef<HTMLDivElement>(null);
  
  
  // 同步外部items到本地状态
  useEffect(() => {
    // 确保items按order排序
    const sortedItems = [...(items || [])].sort((a, b) => a.order - b.order);
    setClipboardItems(sortedItems);
    
  // 如果有新项目添加，滚动到容器的最底部
  if (sortedItems.length > 0 && (items?.length ?? 0) > (clipboardItems?.length ?? 0)) {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
  }
  }, [items, clipboardItems?.length]);
  
  // 确保默认tab永远存在
  useEffect(() => {
    // 如果tabs为空或者不包含默认tab，则添加默认tab
    if (tabs.length === 0 || !tabs.some(tab => tab.id === 'clipboard')) {
      setTabs(prevTabs => [
        { id: 'clipboard', title: '剪贴板', type: 'clipboard', closable: false },
        ...prevTabs.filter(tab => tab.id !== 'clipboard')
      ]);
      // 如果当前活动tab不存在，则切换到默认tab
      if (!tabs.some(tab => tab.id === activeTabId)) {
        setActiveTabId('clipboard');
      }
    }
  }, [tabs, activeTabId]);
  
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
  
  // 处理批量引用
  const handleQuoteSelected = () => {
    // 获取选中的剪贴板项
    const selectedClipboardItems = clipboardItems.filter(item => 
      selectedItems.includes(item.id)
    );
    
    // 将每个选中项的内容添加到引用
    selectedClipboardItems.forEach(item => {
      addReference(item.content);
    });
    
    // 显示添加成功提示（可以考虑添加Toast提示）
    console.log(`已添加${selectedClipboardItems.length}项引用`);
    
    // 退出多选模式
    cancelSelection();
  };
  
  // 处理删除
  const handleDeleteItem = (itemId: string) => {
    if (onDelete) {
      onDelete(itemId);
    }
  };
  
  // 处理拖拽结束事件
  const handleDragEnd = (result: DropResult) => {
    // 如果没有目标或拖拽被取消，则不做处理
    if (!result.destination) return;
    
    // 如果位置没有变化，也不处理
    if (result.destination.index === result.source.index) return;
    
    // 重新排序项目
    const reorderedItems = [...clipboardItems];
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    
    // 更新order字段
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    // 更新本地状态
    setClipboardItems(updatedItems);
    
    // 调用外部回调函数
    if (onReorder) {
      onReorder(updatedItems);
    }
  };
  
  // 处理批量导出为Markdown
  const handleExportSelectedMarkdown = () => {
    // 如果有导出函数，则调用
    if (onExportMarkdown) {
      // 如果有选中项目，则只导出选中项目
      if (selectedItems.length > 0) {
        onExportMarkdown(selectedItems);
      } else {
        onExportMarkdown();
      }
    }
    
    // 退出多选模式
    cancelSelection();
  };
  
  // 处理批量导出为PDF
  const handleExportSelectedPDF = () => {
    // 如果有导出函数，则调用
    if (onExportPDF) {
      // 如果有选中项目，则只导出选中项目
      if (selectedItems.length > 0) {
        onExportPDF(selectedItems);
      } else {
        onExportPDF();
      }
    }
    
    // 退出多选模式
    cancelSelection();
  };
  
  // 使用固定的droppableId，避免动态ID可能导致的问题
  const droppableId = 'clipboard-items';
  
  return (
    <div 
      className={`clipboard-area-container ${className || ''}`} 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        padding: 0,
        ...style
      }}
    >
      {/* 标签栏和工具栏 */}
      <ClipboardHeader 
        tabs={tabs}
        activeTabId={activeTabId}
        itemCount={clipboardItems.length}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        onSelectMode={enterSelectMode}
        onSortMode={enterSortMode}
        onExportMarkdown={() => onExportMarkdown && onExportMarkdown()}
        onExportPDF={() => onExportPDF && onExportPDF()}
        onClearAll={() => onClearAll && onClearAll()}
      />
      
      {/* 内容区 */}
      <div 
        ref={containerRef}
        className="clipboard-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: clipboardItems.length > 0 && activeTabId === 'clipboard' ? 'var(--space-md)' : 0,
          paddingBottom: (selectMode || sortMode) && activeTabId === 'clipboard' ? 'calc(var(--space-md) + 60px)' : 'var(--space-md)', // 为工具栏预留空间
          position: 'relative',
          scrollBehavior: 'smooth', // 添加平滑滚动效果
        }}
      >
        {/* 神谕Tab内容 */}
        {activeTabId === 'shenyu' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 'var(--space-lg)',
            color: 'var(--text-mid-gray)',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: 'var(--font-lg)',
              marginBottom: 'var(--space-md)',
              color: 'var(--brand-color)'
            }}>
              神谕区域
            </div>
            <div style={{ fontSize: 'var(--font-sm)' }}>
              此区域将用于显示神谕相关内容
            </div>
          </div>
        )}
        
        {/* 剪贴板内容 - 仅在剪贴板tab激活时显示 */}
        {activeTabId === 'clipboard' && (
          sortMode ? (
            // 排序模式 - 使用简化的上下按钮控制排序
            <SortModeList 
              items={clipboardItems}
              lastItemRef={lastItemRef}
              onMoveUp={(itemId) => {
                // 调用移动方法并获取新排序的数组
                const newItems = moveItemUp(itemId);
                
                // 如果成功移动了项目，更新本地状态以刷新视图
                if (newItems) {
                  setClipboardItems([...newItems]);
                }
              }}
              onMoveDown={(itemId) => {
                // 调用移动方法并获取新排序的数组
                const newItems = moveItemDown(itemId);
                
                // 如果成功移动了项目，更新本地状态以刷新视图
                if (newItems) {
                  setClipboardItems([...newItems]);
                }
              }}
            />
          ) : (
            // 正常模式 - 禁用拖拽功能，只有排序模式才允许拖拽
            <DragDropContext onDragEnd={handleDragEnd}>
              <ClipboardDraggableList 
                items={clipboardItems}
                selectMode={selectMode}
                isDragDisabled={true} // 非排序模式下禁用拖拽功能
                selectedItems={selectedItems}
                onItemSelect={handleItemSelect}
                onCopy={onCopy}
                onQuote={onQuote}
                onLocate={onLocate}
                onDelete={handleDeleteItem}
                droppableId={droppableId}
                lastItemRef={lastItemRef as React.RefObject<HTMLDivElement>}
              />
            </DragDropContext>
          )
        )}
        
        {/* 根据当前模式显示不同的工具栏 */}
        {selectMode && (
          <SelectionToolbar 
            containerRef={containerRef}
            selectedCount={selectedItems.length}
            totalCount={clipboardItems.length}
            onSelectAll={selectAll}
            onQuoteSelected={handleQuoteSelected}
            onExportMarkdown={handleExportSelectedMarkdown}
            onExportPDF={handleExportSelectedPDF}
            onCancel={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              cancelSelection();
            }}
            isAllSelected={isAllSelected}
          />
        )}
        
        {/* 排序模式工具栏 */}
        {sortMode && (
          <SortModeToolbar 
            containerRef={containerRef}
            onCancel={() => exitSortMode()}
          />
        )}
      </div>
    </div>
  );
};

export default DraggableClipboardArea;
