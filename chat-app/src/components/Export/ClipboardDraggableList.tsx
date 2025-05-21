import React, { memo, forwardRef } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ClipboardItem } from '../../types';
import ClipboardCard from './ClipboardCard';
import '../../styles/draggable.css'; // 导入拖拽相关样式

interface ClipboardDraggableListProps {
  items: ClipboardItem[];
  selectMode: boolean;
  selectedItems: string[];
  onItemSelect: (itemId: string, selected: boolean) => void;
  onCopy?: (itemId: string) => void;
  onQuote?: (itemId: string) => void;
  onLocate?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  droppableId: string; // 添加唯一ID作为属性
  lastItemRef?: React.RefObject<HTMLDivElement>; // 添加引用，用于滚动到最新项目
  isDragDisabled?: boolean; // 新增：是否禁用拖拽功能
}

/**
 * 可拖拽的剪贴板列表组件
 * 负责处理react-beautiful-dnd相关的拖拽功能
 * 注意：应在外部包裹DragDropContext
 */
const ClipboardDraggableList: React.FC<ClipboardDraggableListProps> = ({
  items,
  selectMode,
  selectedItems,
  onItemSelect,
  onCopy,
  onQuote,
  onLocate,
  onDelete,
  droppableId,
  lastItemRef,
  isDragDisabled = false
}) => {
  // 使用状态来存储最新的剪贴板项目，确保它始终是一个数组
  const safeItems = Array.isArray(items) ? items : [];
  
  return (
    <Droppable 
      droppableId="clipboard-items"
      direction="vertical" // 限制为垂直方向拖拽，避免横向移动
      isDropDisabled={selectMode} // 明确指定为布尔值
      isCombineEnabled={false} // 明确指定为布尔值，防止错误
      ignoreContainerClipping={false} // 明确指定为布尔值，防止错误
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{ 
            paddingLeft: selectMode ? '30px' : 0,
            minHeight: '80px', // 确保即使为空也有足够的拖放区域
            transition: 'all 0.2s ease',
          }}
          className={`clipboard-droppable-container ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
          data-testid={droppableId} // 添加测试ID以便调试
        >
          {safeItems.length === 0 ? (
            // 空状态 - 但保持Droppable区域存在
            <div className="empty-state" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
              <p>右键点击对话中的消息，或点击消息底部的"添加到剪贴板"按钮，可将内容添加到剪贴板</p>
              
              {/* 剪贴板图标 - 放在两行文本中间 */}
              <div style={{ margin: 'var(--space-md) 0' }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="50" 
                  height="50" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: '#666666' }}
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M12 11v6"></path>
                  <path d="M9 14h6"></path>
                </svg>
              </div>
              
              <p style={{ 
                fontSize: 'var(--font-xs)',
                color: 'var(--text-mid-gray)'
              }}>
                添加后可以将内容导出为Markdown或PDF格式
              </p>
            </div>
          ) : (
            // 剪贴板项列表
            safeItems.map((item, index) => {
              const isLastItem = index === safeItems.length - 1;
              
              return (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                  isDragDisabled={selectMode || isDragDisabled} // 多选模式或外部设置禁用拖拽
                >
                  {(provided, snapshot) => (
                  <div
                    ref={isLastItem && lastItemRef ? (el) => {
                      // 合并引用：既满足react-beautiful-dnd的引用，又满足我们的滚动引用
                      provided.innerRef(el);
                      if (lastItemRef) {
                        // @ts-ignore - 类型不完全匹配，但在运行时工作正常
                        lastItemRef.current = el;
                      }
                    } : provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`clipboard-draggable-item ${snapshot.isDragging ? 'is-dragging' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      marginBottom: 'var(--space-md)',
                      position: 'relative',
                    }}
                  >
                    {/* 插入指示器 - 在每项之间显示 */}
                    <div className="drop-indicator" />
                    
                    {/* 太长内容的拖拽预览版本 */}
                    {snapshot.isDragging && (
                      <div 
                        className="clipboard-drag-preview"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: -1,
                        }}
                      >
                        <div className="clipboard-preview-content">
                          {item.content.length > 150 
                            ? item.content.substring(0, 150) + '...' 
                            : item.content}
                        </div>
                      </div>
                    )}
                      <ClipboardCard
                        item={item}
                        selectMode={selectMode}
                        selected={selectedItems.includes(item.id)}
                        onSelect={onItemSelect}
                        onCopy={onCopy}
                        onQuote={onQuote}
                        onLocate={onLocate}
                        onDelete={onDelete}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })
          )}
          {/* 最后一个项目之后的插入指示器 */}
          {safeItems.length > 0 && snapshot.isDraggingOver && (
            <div className="drop-target-indicator" />
          )}
          
          {/* 强制始终渲染placeholder元素，防止拖拽区域丢失 */}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

// 使用memo包装组件，减少不必要的重新渲染
export default memo(ClipboardDraggableList);
