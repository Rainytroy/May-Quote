import React from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { useChat } from '../../hooks/useChat';
import { getApiKey } from '../../utils/storage';
import { Message } from './MessageItem';
import { ClipboardItem } from '../../types';
import { generateId } from '../../utils/storage-db';

interface ChatInterfaceProps {
  onOpenSettings: () => void;
  conversationId?: string | null;
  initialMessages?: Message[];
  onUpdateMessages?: (messages: Message[]) => void;
  onNewConversation?: () => void;
  onAddToClipboard?: (messageId: string) => void;
  onAddSelectedTextToClipboard?: (selectedText: string, messageId: string) => void; // 添加选中文本到剪贴板
  activeConversationId?: string | null; // 当前活动对话ID，用于添加选中文本到剪贴板
  onCreateNewConversationWithContent?: (content: string) => Promise<string>; // 创建新对话并返回ID
  onOpenQuoteDialog?: (content: string) => void; // 打开引用对话框
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onOpenSettings, 
  conversationId,
  initialMessages = [],
  onUpdateMessages,
  onNewConversation,
  onAddToClipboard,
  onAddSelectedTextToClipboard,
  activeConversationId,
  onCreateNewConversationWithContent,
  onOpenQuoteDialog
}) => {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages,
    setInitialMessages
  } = useChat(conversationId, onUpdateMessages);
  
  const hasApiKey = !!getApiKey();
  
  // 本地消息状态 - 用于实时更新UI
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  
  // 初始消息加载跟踪
  const [initialMessagesLoaded, setInitialMessagesLoaded] = React.useState<boolean>(false);
  
  // 当useChat的messages变化时，同步到本地状态
  React.useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);
  
  // 加载初始消息 - 使用setInitialMessages直接设置消息
  React.useEffect(() => {
    if (initialMessages && initialMessages.length > 0 && messages.length === 0 && !initialMessagesLoaded) {
      // 使用hook提供的方法直接设置初始消息
      setInitialMessages(initialMessages);
      setInitialMessagesLoaded(true);
    }
  }, [initialMessages, messages.length, initialMessagesLoaded, setInitialMessages]);
  
  // 添加神谕消息事件监听器 - 实时更新UI
  React.useEffect(() => {
    // 处理神谕消息添加事件
    const handleShenyuMessageAdded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { conversationId: eventConversationId, message } = customEvent.detail;
      
      // 确保消息属于当前对话
      if (eventConversationId === conversationId && message) {
        console.log('[ChatInterface] 收到神谕消息添加事件，立即更新UI:', message.type);
        
        // 添加消息到UI
        setLocalMessages(prev => [...prev, message]);
      }
    };
    
    // 处理神谕消息更新事件
    const handleShenyuMessageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { conversationId: eventConversationId, messageId, message } = customEvent.detail;
      
      // 确保消息属于当前对话
      if (eventConversationId === conversationId && message) {
        console.log('[ChatInterface] 收到神谕消息更新事件，messageId:', messageId);
        
        // 更新消息
        setLocalMessages((prev: Message[]) => {
          return prev.map((msg: Message) => {
            if (msg.id === messageId) {
              // 保留原有消息的所有属性，但使用新的progress
              return { ...msg, ...message };
            }
            return msg;
          });
        });
      }
    };
    
    // 处理神谕消息流式生成事件 - 用于实时更新提示词块内容
    const handleShenyuMessageStreaming = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { conversationId: eventConversationId, messageId, content } = customEvent.detail;
      
      // 确保消息属于当前对话
      if (eventConversationId === conversationId && messageId && content) {
        console.log('[ChatInterface] 收到神谕消息流式更新，messageId:', messageId.substring(0, 8));
        
        // 更新流式内容 - 只更新内容，保持其他属性不变
        setLocalMessages((prev: Message[]) => {
          return prev.map((msg: Message) => {
            if (msg.id === messageId) {
              return { ...msg, content };
            }
            return msg;
          });
        });
      }
    };
    
    // 添加事件监听器
    window.addEventListener('shenyu-message-added', handleShenyuMessageAdded);
    window.addEventListener('shenyu-message-updated', handleShenyuMessageUpdated);
    window.addEventListener('shenyu-message-streaming', handleShenyuMessageStreaming);
    
    // 清理函数
    return () => {
      window.removeEventListener('shenyu-message-added', handleShenyuMessageAdded);
      window.removeEventListener('shenyu-message-updated', handleShenyuMessageUpdated);
      window.removeEventListener('shenyu-message-streaming', handleShenyuMessageStreaming);
    };
  }, [conversationId]); // 仅依赖conversationId，确保在对话切换时重新设置监听器
  
  // 当对话ID变化时重置加载状态和检查是否有待处理的消息
  React.useEffect(() => {
    setInitialMessagesLoaded(false);
    
    // 检查是否有待处理的消息需要发送（针对引用到新对话的场景）
    const pendingMessage = window.localStorage.getItem('_may_pending_message');
    if (pendingMessage && conversationId) {
      console.log('检测到待处理消息，准备发送', pendingMessage.substring(0, 30) + '...');
      // 延迟一点时间，确保新对话的组件完全初始化
      setTimeout(() => {
        try {
          sendMessage(pendingMessage);
          console.log('待处理消息已发送');
        } catch (error) {
          console.error('发送待处理消息时出错:', error);
        } finally {
          // 无论成功与否，都清除待处理消息
          window.localStorage.removeItem('_may_pending_message');
        }
      }, 500);
    }
  }, [conversationId, sendMessage]);
  
  // 处理右键菜单（后续可扩展复制和导出功能）
  const handleContextMenu = (event: React.MouseEvent, messageId: string) => {
    event.preventDefault();
    // 暂时不处理右键菜单，后续可扩展
    console.log(`右键点击消息: ${messageId}`);
  };
  
  // 处理消息复制
  const handleCopy = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      console.log(`已复制消息: ${messageId}`);
    }
  };
  
  // 处理消息添加到剪贴板
  const handleAddToClipboard = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      console.log(`添加消息到剪贴板: ${messageId}`);
      
      // 调用外部传入的添加到剪贴板方法
      if (onAddToClipboard) {
        onAddToClipboard(messageId);
      }
    }
  };
  
  // 处理选中文本添加到剪贴板
  const handleAddSelectedTextToClipboard = (clipboardItem: ClipboardItem) => {
    if (activeConversationId && clipboardItem.source && clipboardItem.source.messageId) {
      // 添加到当前对话的剪贴板
      console.log('[DEBUG-clipboard] ChatInterface.handleAddSelectedTextToClipboard: 接收到剪贴板项', {
        id: clipboardItem.id,
        content: clipboardItem.content.substring(0, 20) + '...',
        messageId: clipboardItem.source.messageId,
        activeConversationId: activeConversationId,
        处理时间: new Date().toISOString()
      });
      
      // 使用专门的选中文本添加函数
      if (onAddSelectedTextToClipboard) {
        console.log('[DEBUG-clipboard] ChatInterface: 调用onAddSelectedTextToClipboard');
        onAddSelectedTextToClipboard(clipboardItem.content, clipboardItem.source.messageId);
      } else {
        console.error('[DEBUG-clipboard] ChatInterface: onAddSelectedTextToClipboard回调未定义!');
      }
    } else {
      console.error('[DEBUG-clipboard] ChatInterface: 缺少关键字段', { 
        activeConversationId, 
        hasSource: !!clipboardItem.source, 
        messageId: clipboardItem.source?.messageId 
      });
    }
  };
  
  // 处理消息引用
  const handleQuote = (messageId: string) => {
    console.log(`引用消息: ${messageId}`);
  };
  
  // 处理引用到新对话
  const handleQuoteToNewConversation = (messageContent: string, userPrompt: string) => {
    console.log('引用到新对话:', { messageContent: messageContent.substring(0, 50) + '...', userPrompt });
    
    // 如果提供了创建新对话的回调函数
    if (onCreateNewConversationWithContent) {
      // 创建引用格式的内容
      const combinedContent = `我引用了以下内容：\n\n---\n${messageContent}\n---\n\n${userPrompt}`;
      
      // 创建新对话并发送内容
      onCreateNewConversationWithContent(combinedContent)
        .then(newConversationId => {
          console.log(`新对话创建成功，ID: ${newConversationId}`);
        })
        .catch(error => {
          console.error('创建新对话失败:', error);
        });
    } else {
      console.error('未提供创建新对话的回调函数');
    }
  };
  
  // 如果没有API密钥，显示配置提示
  if (!hasApiKey) {
    return (
      <div className="empty-state">
        <h2 style={{ marginBottom: 'var(--space-md)' }}>还未配置API密钥</h2>
        <p style={{
          marginBottom: 'var(--space-lg)',
          color: 'var(--text-light-gray)',
          maxWidth: '400px'
        }}>
          请先配置你的API密钥以开始使用聊天功能。API密钥将安全地存储在你的浏览器中。
        </p>
        <button
          className="settings-button"
          onClick={onOpenSettings}
        >
          配置API密钥
        </button>
      </div>
    );
  }
  
  // 如果没有活动对话，显示欢迎页面
  if (!conversationId) {
    return (
      <div className="empty-state">
        <h2 style={{ marginBottom: 'var(--space-md)' }}>开始一个新对话</h2>
        <p style={{
          marginBottom: 'var(--space-lg)',
          color: 'var(--text-light-gray)',
          maxWidth: '400px'
        }}>
          点击下方按钮开始一个新的对话，或从左侧列表中选择已有对话。
        </p>
        <button
          className="settings-button"
          onClick={onNewConversation}
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'var(--text-dark)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          创建新对话
        </button>
      </div>
    );
  }
  
  return (
    <>
      {/* 错误消息显示 */}
      {error && (
        <div className="error-message">
          错误: {error}
        </div>
      )}
      
      {/* 消息列表 - 使用localMessages以实时显示神谕消息 */}
      <MessageList 
        messages={localMessages}
        onContextMenu={handleContextMenu}
        onCopy={handleCopy}
        onQuote={handleQuote}
        onAddToClipboard={handleAddToClipboard}
        onAddSelectedTextToClipboard={handleAddSelectedTextToClipboard}
        onQuoteToNewConversation={handleQuoteToNewConversation}
        onOpenQuoteDialog={onOpenQuoteDialog}
      />
      
      {/* 输入区域 */}
      <InputArea 
        onSendMessage={sendMessage}
        disabled={isLoading}
        placeholder={isLoading ? "AI正在回复中..." : "输入消息..."}
      />
    </>
  );
};

export default ChatInterface;
