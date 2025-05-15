import React, { useState, useEffect } from 'react';
import ApiSettings from './components/Settings/ApiSettings';
import ChatInterface from './components/Chat/ChatInterface';
import DraggableClipboardArea from './components/Export/DraggableClipboardArea';
import ConversationList from './components/Conversation/ConversationList';
import NewConversationDialog from './components/Dialog/NewConversationDialog';
import { getApiKey, clearCache, getModel } from './utils/storage';
import { getModelDisplayName } from './utils/model-adapters';
import { useConversations } from './hooks/useConversations';
import { ClipboardItem } from './types';
import { exportAsMarkdown, exportAsPDF } from './utils/export-utils';
import { ReferenceProvider } from './contexts/ReferenceContext';
import { ModeProvider } from './contexts/ModeContext';
import DebugToggleButton from './components/Shenyu/ui/debug/DebugToggleButton';
import ShenyuDebugPanel from './components/Shenyu/ui/debug/ShenyuDebugPanel';
import './styles/global.css'; // 引入全局样式

// 主应用组件
function App() {
  // 设置状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentModelId, setCurrentModelId] = useState('');
  const [isDevLinkHovered, setIsDevLinkHovered] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  
  // 获取对话管理Hook
  const {
    conversationMetas,
    activeConversationId,
    activeConversation,
    isLoading: isConversationsLoading,
    error: conversationsError,
    createNewConversation,
    selectConversation,
    deleteConversation,
    updateActiveConversation,
    addToClipboard,
    addSelectedTextToClipboard,
    removeFromClipboard,
    reorderClipboardItems
  } = useConversations();
  
  // 处理剪贴板项更新
  const handleClipboardUpdate = (items: ClipboardItem[]) => {
    if (activeConversationId && activeConversation) {
      // 更新对话
      updateActiveConversation(activeConversation.messages, items);
    }
  };
  
  // 初始化
  useEffect(() => {
    // 清理任何内存缓存
    clearCache();
    console.log('应用初始化完成');
  }, []);
  
  // 检查API密钥
  useEffect(() => {
    const apiKey = getApiKey();
    setHasApiKey(!!apiKey);
  }, []);
  
  // 加载并监听模型ID
  useEffect(() => {
    // 初始加载当前模型ID
    const model = getModel();
    setCurrentModelId(model);
    
    // 创建一个事件侦听器，监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'MODEL') {
        setCurrentModelId(e.newValue || '');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // 处理设置保存
  const handleSettingsSave = () => {
    const apiKey = getApiKey();
    setHasApiKey(!!apiKey);
  };
  
  // 处理更新消息
  const handleUpdateMessages = (messages: any[]) => {
    if (activeConversationId) {
      updateActiveConversation(messages, activeConversation?.clipboardItems || []);
    }
  };
  
  // 处理新对话创建 - 用户手动创建新对话
  const handleCreateNewConversation = async () => {
    // 传入true标记为手动创建，确保总是能创建新对话
    await createNewConversation(true);
  };
  
  // 处理消息添加到剪贴板
  const handleAddToClipboard = async (messageId: string) => {
    if (activeConversationId) {
      await addToClipboard(messageId);
    }
  };
  
  // 处理选中文本添加到剪贴板
  const handleAddSelectedTextToClipboard = async (selectedText: string, messageId: string) => {
    if (activeConversationId) {
      console.log('[DEBUG-clipboard] App.handleAddSelectedTextToClipboard', {
        selectedText: selectedText.substring(0, 20) + '...',
        messageId,
        activeConversationId,
        时间: new Date().toISOString()
      });
      try {
        const result = await addSelectedTextToClipboard(selectedText, messageId);
        console.log('[DEBUG-clipboard] App: 添加选中文本到剪贴板结果:', result);
        return result;
      } catch (error) {
        console.error('[DEBUG-clipboard] App: 添加选中文本到剪贴板失败:', error);
        return false;
      }
    } else {
      console.error('[DEBUG-clipboard] App: 无活动对话，无法添加到剪贴板');
      return false;
    }
  };
  
  // 引用对话框状态
  const [quoteDialogState, setQuoteDialogState] = useState<{
    isOpen: boolean;
    content: string;
  }>({
    isOpen: false,
    content: ''
  });

  // 处理打开引用对话框
  const handleOpenQuoteDialog = (content: string) => {
    setQuoteDialogState({
      isOpen: true,
      content
    });
  };

  // 处理关闭引用对话框
  const handleCloseQuoteDialog = () => {
    setQuoteDialogState({
      ...quoteDialogState,
      isOpen: false
    });
  };

  // 处理引用对话框确认
  const handleQuoteDialogConfirm = async (userPrompt: string) => {
    try {
      // 创建引用格式的内容
      const combinedContent = `我引用了以下内容：\n\n---\n${quoteDialogState.content}\n---\n\n${userPrompt}`;
      
      // 调用现有的创建新对话函数
      await handleCreateNewConversationWithContent(combinedContent);
      
      // 关闭对话框
      handleCloseQuoteDialog();
    } catch (error) {
      console.error('引用到新对话失败:', error);
    }
  };

  // 创建新对话并发送初始内容
  const handleCreateNewConversationWithContent = async (content: string): Promise<string> => {
    console.log('创建引用对话, 内容长度:', content.length);
    
    try {
      // 创建新对话前，先保存当前对话ID，以便后续恢复
      const currentConversationId = activeConversationId;
      
      // 创建新对话
      const newConversationId = await createNewConversation(true);
      
      if (!newConversationId) {
        throw new Error('创建新对话失败');
      }
      
      console.log('新对话创建成功, ID:', newConversationId, '准备发送初始消息');
      
      // 将消息存储在APP级别的状态变量中，供useChat初始化使用
      // 这是为了在ChatInterface组件创建时能立即使用该消息
      window.localStorage.setItem('_may_pending_message', content);
      
      // 延迟一点时间，确保新对话的组件完全初始化
      setTimeout(() => {
        // 移除存储的消息
        window.localStorage.removeItem('_may_pending_message');
      }, 2000);
      
      return newConversationId;
    } catch (error) {
      console.error('创建引用对话失败:', error);
      throw error;
    }
  };
  
  // 处理从剪贴板移除项目
  const handleRemoveFromClipboard = async (itemId: string) => {
    if (activeConversationId) {
      await removeFromClipboard(itemId);
    }
  };

  return (
    <ModeProvider>
      <ReferenceProvider>
        <div className="app-container">
        {/* 顶部导航 */}
        <nav className="navbar">
          <div className="logo">May</div>
          
          {/* 调试按钮 - 在Logo后面添加 */}
          <DebugToggleButton
            isActive={isDebugPanelOpen}
            onClick={() => setIsDebugPanelOpen(!isDebugPanelOpen)}
          />
          
          {/* 开发者信息 */}
          <a
            href="https://github.com/rainytroy/May-Quote.git"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsDevLinkHovered(true)}
            onMouseLeave={() => setIsDevLinkHovered(false)}
            style={{
              color: isDevLinkHovered ? 'var(--brand-color)' : '#444444',
              fontSize: '13px',
              marginLeft: 'auto',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              textDecoration: 'none',
              border: `1px solid ${isDevLinkHovered ? 'var(--brand-color)' : '#444444'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px',
              display: 'inline-block',
              transition: 'color 0.2s, border-color 0.2s'
            }}
          >
            Rainytroy云透@github
          </a>
          
          {/* 显示当前模型名称和ID */}
          <div 
            style={{
              color: 'var(--text-mid-gray)',
              fontSize: '13px',
              marginLeft: '12px',
              marginRight: '8px',
              fontFamily: 'monospace'
            }}
          >
            {currentModelId ? `${getModelDisplayName(currentModelId)} / ${currentModelId}` : ''}
          </div>
          
          <button 
            className="settings-button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="设置"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--brand-color)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '4px',
              padding: 0
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </nav>
        
        {/* 主内容区 */}
        <div className="main-container">
          {/* 对话列表侧边栏 */}
          <div className="sidebar">
            <ConversationList
              conversations={conversationMetas}
              activeConversationId={activeConversationId}
              onSelect={selectConversation}
              onDelete={async (id) => {
                // 包装删除函数，确保返回Promise<boolean>
                try {
                  return await deleteConversation(id);
                } catch (error: any) {
                  console.error('删除对话失败:', error);
                  return false;
                }
              }}
              onCreateNew={handleCreateNewConversation}
              isLoading={isConversationsLoading}
            />
          </div>
          
          {/* 主聊天区域 */}
          <div className="chat-area">
            <ChatInterface 
              onOpenSettings={() => setIsSettingsOpen(true)}
              conversationId={activeConversationId}
              initialMessages={activeConversation?.messages || []}
              onUpdateMessages={handleUpdateMessages}
              onNewConversation={handleCreateNewConversation}
              onAddToClipboard={handleAddToClipboard}
              onAddSelectedTextToClipboard={handleAddSelectedTextToClipboard}
              activeConversationId={activeConversationId}
              onCreateNewConversationWithContent={handleCreateNewConversationWithContent}
              onOpenQuoteDialog={handleOpenQuoteDialog}
            />
          </div>
          
          {/* 剪贴板区域 */}
          <DraggableClipboardArea 
            className="clipboard-area"
            items={activeConversation?.clipboardItems || []}
            onCopy={(id) => console.log('复制剪贴板项', id)}
            onLocate={(id) => {
              // 获取剪贴板项目
              if (!activeConversation) return;
              
              const clipboardItem = activeConversation.clipboardItems.find(item => item.id === id);
              if (!clipboardItem || !clipboardItem.source) {
                console.error('找不到剪贴板项或源信息');
                return;
              }
              
              const { conversationId, messageId } = clipboardItem.source;
              
              // 如果消息在当前对话中
              if (conversationId === activeConversationId) {
                // 定位到消息元素
                const messageElement = document.getElementById(`message-${messageId}`);
                if (messageElement) {
                  // 找到消息气泡元素
                  const messageBubble = messageElement.querySelector('.message-bubble');
                  if (messageBubble) {
                    // 滚动到消息并高亮显示气泡
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    messageBubble.classList.add('highlight');
                    
                    // 3秒后移除高亮
                    setTimeout(() => {
                      messageBubble.classList.remove('highlight');
                    }, 3000);
                  }
                } else {
                  console.error('找不到消息元素:', messageId);
                }
              } else {
              // 如果在其他对话中，先切换对话再定位
              selectConversation(conversationId).then(success => {
                if (success) {
                  // 等待对话切换和DOM更新完成
                  setTimeout(() => {
                    const messageElement = document.getElementById(`message-${messageId}`);
                    if (messageElement) {
                      // 找到消息气泡元素
                      const messageBubble = messageElement.querySelector('.message-bubble');
                      if (messageBubble) {
                        // 滚动到消息并高亮显示气泡
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        messageBubble.classList.add('highlight');
                        
                        // 3秒后移除高亮
                        setTimeout(() => {
                          messageBubble.classList.remove('highlight');
                        }, 3000);
                      }
                    } else {
                      console.error('找不到消息元素:', messageId);
                    }
                  }, 300); // 给DOM更新一些时间
                } else {
                  console.error('切换到对话失败:', conversationId);
                }
              });
              }
            }}
            onDelete={(id) => {
              if (activeConversationId && activeConversation) {
                removeFromClipboard(id);
              }
            }}
            onExportMarkdown={(selectedIds) => {
              if (!activeConversation?.clipboardItems || activeConversation.clipboardItems.length === 0) return;
              
              // 如果提供了选中项ID列表，则只导出选中项
              let itemsToExport = activeConversation.clipboardItems;
              if (selectedIds && selectedIds.length > 0) {
                itemsToExport = activeConversation.clipboardItems.filter(item => 
                  selectedIds.includes(item.id)
                );
              }
              
              if (itemsToExport.length > 0) {
                exportAsMarkdown(itemsToExport, `may-export-${new Date().getTime()}.md`);
              }
            }}
            onExportPDF={(selectedIds) => {
              if (!activeConversation?.clipboardItems || activeConversation.clipboardItems.length === 0) return;
              
              // 如果提供了选中项ID列表，则只导出选中项
              let itemsToExport = activeConversation.clipboardItems;
              if (selectedIds && selectedIds.length > 0) {
                itemsToExport = activeConversation.clipboardItems.filter(item => 
                  selectedIds.includes(item.id)
                );
              }
              
              if (itemsToExport.length > 0) {
                exportAsPDF(itemsToExport, `may-export-${new Date().getTime()}.pdf`);
              }
            }}
            onClearAll={() => {
              // 如果有活动对话，则更新对话
              if (activeConversationId && activeConversation) {
                updateActiveConversation(activeConversation.messages, []);
              }
            }}
            onReorder={(items) => {
              if (activeConversationId && activeConversation) {
                reorderClipboardItems(items);
              }
            }}
          />
        </div>
        
        {/* API设置面板 */}
        <ApiSettings 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
        
        {/* 引用到新对话弹窗 - 移到顶层渲染 */}
        <NewConversationDialog
          isOpen={quoteDialogState.isOpen}
          title="引用到新对话"
          referenceContent={quoteDialogState.content}
          onConfirm={handleQuoteDialogConfirm}
          onCancel={handleCloseQuoteDialog}
        />
      </div>
      
      {/* 神谕调试面板 */}
      <ShenyuDebugPanel 
        isOpen={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
      />
      </ReferenceProvider>
    </ModeProvider>
  );
}

export default App;
