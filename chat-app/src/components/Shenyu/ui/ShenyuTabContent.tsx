import React, { useState, useEffect, useRef } from 'react';
import { useMode } from '../../../contexts/ModeContext';
import ShenyuCardView from './ShenyuCardView';
import { getActiveConversationId, getConversation, saveConversation } from '../../../utils/db';
import { ConversationMeta } from '../../../types';
import { Message } from '../../../sharedTypes'; // 导入扩展后的Message类型

interface ShenyuTabContentProps {
  className?: string;
  activeConversationId?: string | null; // <--- 添加 activeConversationId prop
}

/**
 * 神谕标签页内容组件
 * 
 * 专门用于剪贴板区域的神谕标签页，负责与神谕消息系统集成
 * 并确保与剪贴板功能完全隔离
 */
const ShenyuTabContent: React.FC<ShenyuTabContentProps> = ({ 
  className,
  activeConversationId // <--- 解构 activeConversationId prop
}) => {
  // JSON内容状态
  const [jsonContent, setJsonContent] = useState<string>('');
  // 加载和保存状态跟踪
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const skipNextLoadRef = useRef<boolean>(false);
  const lastSavedJsonRef = useRef<string>('');
  // 当前对话ID - 不再使用内部 state，直接使用 activeConversationId prop
  // const [conversationId, setConversationId] = useState<string>(''); 
  const { currentMode } = useMode();
  
  // 保存JSON到数据库 - 增强版，带状态跟踪和错误处理
  const saveShenyuJson = async (json: string) => {
    if (!activeConversationId) return false; // <--- 使用 prop
    if (isSaving) {
      console.log('[ShenyuTabContent] 已有保存操作进行中，忽略新请求');
      return false;
    }
    
    // 如果内容与上次保存的相同，跳过保存
    if (json === lastSavedJsonRef.current) {
      console.log('[ShenyuTabContent] 内容未变化，跳过保存');
      return true;
    }
    
    setIsSaving(true);
    try {
      console.log('[ShenyuTabContent] 保存神谕JSON，长度:', json.length, 'for conversation:', activeConversationId);
      
      // 获取当前对话
      const conversation = await getConversation(activeConversationId); // <--- 使用 prop
      if (!conversation) {
        console.error('[ShenyuTabContent] 保存失败: 未找到对话', activeConversationId);
        setIsSaving(false);
        return false;
      }
      
      // 直接保存原始JSON字符串，不做任何处理
      await saveConversation({
        ...conversation,
        shenyuJson: json // 直接保存原始字符串
      });
      
      // 更新最后保存的内容引用
      lastSavedJsonRef.current = json;
      
      console.log('[ShenyuTabContent] 成功保存神谕JSON到对话', activeConversationId);
      return true;
    } catch (error) {
      console.error('[ShenyuTabContent] 保存神谕JSON失败:', error, 'for conversation:', activeConversationId);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
    // 从数据库加载JSON - 增强版，尊重保存状态，支持活动消息优先
    const loadShenyuJson = async () => {
      console.log(`[ShenyuTabContent] 开始加载神谕JSON，当前对话ID: ${activeConversationId}, 时间戳: ${new Date().toISOString()}`);
    // 如果当前有保存操作，或者明确标记跳过加载，则跳过
    if (isSaving || skipNextLoadRef.current) {
      console.log('[ShenyuTabContent] 跳过加载，因为', 
                  isSaving ? '有保存操作正在进行' : '设置了跳过标记');
      skipNextLoadRef.current = false; // 重置跳过标记
      // 返回特殊标记，表示跳过而不是无数据
      return '[SKIP_LOADING]';
    }
    
    // 确保有有效的对话ID
    if (!activeConversationId) {
      console.log('[ShenyuTabContent] 无有效对话ID，无法加载数据');
      return '';
    }
    try {
      // 获取当前对话
      const conversation = await getConversation(activeConversationId); // <--- 使用 prop
      if (!conversation) {
        console.error('[ShenyuTabContent] 加载失败: 未找到对话', activeConversationId);
        return '';
      }
      
      // 检查是否有活动神谕消息
      if (conversation.messages) {
        // 使用类型断言将消息转换为扩展后的Message类型
        const messages = conversation.messages as Message[];
        const activeMessage = messages.find(msg => (msg as Message).isActiveShenyuMessage === true);
        
        if (activeMessage && (activeMessage as Message).type === 'json' && activeMessage.content) {
          // 如果有活动消息，使用其内容而不是shenyuJson
          const content = activeMessage.content.replace(/^```json\s*\n|\n```\s*$/g, '');
          console.log(`[ShenyuTabContent] 找到活动消息 ID: ${activeMessage.id}，使用其内容代替shenyuJson`);
          
          // 更新最后保存的内容引用
          lastSavedJsonRef.current = content;
          
          return content;
        }
      }
      
      // 如果没有活动消息，则使用对话的shenyuJson
      const json = conversation.shenyuJson || '';
      console.log('[ShenyuTabContent] 已加载神谕JSON数据，长度:', json.length, 'for conversation:', activeConversationId);
      
      // 更新最后保存的内容引用
      lastSavedJsonRef.current = json;
      
      return json;
    } catch (error) {
      console.error('[ShenyuTabContent] 加载神谕JSON失败:', error, 'for conversation:', activeConversationId);
      return '';
    }
  };
  
  // 不再需要此 useEffect 来加载 conversationId，因为它现在是 prop
  // useEffect(() => {
  //   const loadCurrentConversationId = async () => {
  //     try {
  //       const activeId = await getActiveConversationId();
  //       if (activeId) {
  //         setConversationId(activeId);
  //         console.log('[ShenyuTabContent] 当前对话ID:', activeId);
  //       }
  //     } catch (error) {
  //       console.error('[ShenyuTabContent] 获取当前对话ID失败:', error);
  //     }
  //   };
  //   loadCurrentConversationId();
  // }, []);
  
  // 监听JSON查看事件
  useEffect(() => {
    // 处理查看JSON事件的回调 - 优化版，改为先保存数据库，再更新UI
    const handleViewJson = async (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.jsonContent) {
        const newJson = customEvent.detail.jsonContent;
        const messageId = customEvent.detail.messageId; // 获取消息ID
        
        // 如果已经在保存中，忽略新请求
        if (isSaving) {
          console.log('[ShenyuTabContent] 忽略查看请求，因为有保存操作正在进行');
          return;
        }
        
        // 设置跳过下一次加载的标记 - 防止保存过程中的自动加载
        skipNextLoadRef.current = true;
        
        // 显示加载状态
        setIsLoading(true);
        
        // 尝试激活神谕标签页
        try {
          const { setActiveTabId } = window as any;
          if (typeof setActiveTabId === 'function') {
            setActiveTabId('shenyu');
          }
        } catch (error) {
          console.error('[ShenyuTabContent] 无法激活神谕标签页:', error);
        }
        
        try {
          // 1. 先保存到数据库
          if (activeConversationId && messageId) {
            console.log(`[ShenyuTabContent] 标记消息 ${messageId} 为活动消息`);
            
            // 获取当前对话
            const conversation = await getConversation(activeConversationId);
            if (conversation && conversation.messages) {
              // 重置所有消息的活动状态
              const messages = conversation.messages as Message[];
              const updatedMessages = messages.map(msg => ({
                ...msg,
                isActiveShenyuMessage: msg.id === messageId // 只有匹配ID的消息被标记为活动
              }));
              
              // 保存对话和JSON内容
              await saveConversation({
                ...conversation,
                messages: updatedMessages,
                shenyuJson: newJson
              });
              
              console.log(`[ShenyuTabContent] 成功更新活动消息状态和保存JSON`);
            } else {
              // 如果无法获取消息数组，仍然保存JSON内容
              const saveSuccess = await saveShenyuJson(newJson);
              if (!saveSuccess) {
                throw new Error('保存JSON失败');
              }
            }
          } else {
            // 如果没有messageId，退回到原来的保存逻辑
            const saveSuccess = await saveShenyuJson(newJson);
            if (!saveSuccess) {
              throw new Error('保存JSON失败');
            }
          }
          
          // 2. 然后从数据库重新加载最新状态
          if (!activeConversationId) {
            throw new Error('无效的对话ID');
          }
          
          const freshConversation = await getConversation(activeConversationId);
          if (!freshConversation) {
            throw new Error('加载最新对话失败');
          }
          
          // 检查是否有活动消息，优先使用活动消息的内容
          let contentToDisplay = '';
          if (freshConversation.messages) {
            const messages = freshConversation.messages as Message[];
            const activeMessage = messages.find(msg => (msg as Message).isActiveShenyuMessage === true);
            
            if (activeMessage && (activeMessage as Message).type === 'json' && activeMessage.content) {
              contentToDisplay = activeMessage.content.replace(/^```json\s*\n|\n```\s*$/g, '');
              console.log(`[ShenyuTabContent] 从数据库加载活动消息 ${activeMessage.id} 内容进行显示`);
            } else if (freshConversation.shenyuJson) {
              contentToDisplay = freshConversation.shenyuJson;
              console.log(`[ShenyuTabContent] 从数据库加载shenyuJson内容进行显示`);
            }
          } else if (freshConversation.shenyuJson) {
            contentToDisplay = freshConversation.shenyuJson;
          }
          
          // 3. 最后更新UI（使用数据库中的最新状态）
          if (contentToDisplay) {
            setJsonContent(contentToDisplay);
          } else {
            throw new Error('找不到有效的JSON内容显示');
          }
          
        } catch (error) {
          console.error('[ShenyuTabContent] 保存或加载失败:', error);
          // 尝试从数据库重新加载，以回滚UI
          const savedJson = await loadShenyuJson();
          if (savedJson && savedJson !== '[SKIP_LOADING]') {
            setJsonContent(savedJson);
          } else {
            // 如果完全失败，显示错误状态或空状态
            clearShenyuUI();
          }
        } finally {
          // 无论成功或失败，都要关闭加载状态
          setIsLoading(false);
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('shenyu-view-json', handleViewJson);
    
    // 清理函数 - 移除事件监听器
    return () => {
      window.removeEventListener('shenyu-view-json', handleViewJson);
    };
  }, [saveShenyuJson]); // <--- 添加 saveShenyuJson (它依赖 activeConversationId)
  
  // 创建一个清空神谕UI的函数
  const clearShenyuUI = () => {
    console.log('[ShenyuTabContent] 清空神谕UI');
    setJsonContent(JSON.stringify({
      name: "神谕配置示例",
      cards: [],
      globalPromptBlocks: {}
    }));
  };
  
  // 当 activeConversationId prop 变化时，加载对应的JSON数据
  useEffect(() => {
    // 如果没有对话ID，清空UI
    if (!activeConversationId) { // <--- 使用 prop
      clearShenyuUI();
      return;
    }
    
    const fetchSavedJson = async () => {
      console.log('[ShenyuTabContent] 尝试加载对话ID的神谕数据:', activeConversationId); // <--- 使用 prop
      
      // 加载对话相关的神谕数据 - loadShenyuJson 现在会使用 activeConversationId prop
      const savedJson = await loadShenyuJson(); 
      
      // 处理跳过加载的特殊标记
      if (savedJson === '[SKIP_LOADING]') {
        console.log('[ShenyuTabContent] 检测到跳过加载标记，保持当前UI状态');
        return; // 保持当前UI状态，不做任何更改
      }
      
      if (savedJson) {
        console.log('[ShenyuTabContent] 成功从数据库加载神谕数据');
        setJsonContent(savedJson);
      } else {
        console.log('[ShenyuTabContent] 未找到保存的神谕数据，设置空UI');
        clearShenyuUI();
      }
    };
    
    // 立即加载数据
    fetchSavedJson();
    
    // 添加处理对话切换回当前对话的逻辑
    const handleConversationSwitch = (event: Event) => {
      const customEvent = event as CustomEvent;
      // 检测切换回当前对话
      if (customEvent.detail?.newConversationId === activeConversationId) {
        console.log('[ShenyuTabContent] 检测到切换回当前对话，强制重新加载神谕状态');
        
        // 稍微延迟以确保所有数据库操作完成
        setTimeout(async () => {
          if (!activeConversationId) return;
          
          try {
            setIsLoading(true);
            
            // 直接从数据库获取最新状态，绕过缓存
            const freshConversation = await getConversation(activeConversationId);
            if (freshConversation && freshConversation.messages) {
              // 查找标记为活动的消息
              const messages = freshConversation.messages as Message[];
              const activeMessage = messages.find(msg => (msg as Message).isActiveShenyuMessage === true);
              
              if (activeMessage && (activeMessage as Message).type === 'json' && activeMessage.content) {
                // 如果找到活动消息，使用其内容
                const content = activeMessage.content.replace(/^```json\s*\n|\n```\s*$/g, '');
                console.log(`[ShenyuTabContent] 对话切换后找到活动消息：${activeMessage.id}，更新UI`);
                setJsonContent(content);
              } else if (freshConversation.shenyuJson) {
                // 否则使用对话的shenyuJson
                console.log(`[ShenyuTabContent] 对话切换后未找到活动消息，使用shenyuJson更新UI`);
                setJsonContent(freshConversation.shenyuJson);
              }
            }
          } catch (error) {
            console.error('[ShenyuTabContent] 切换对话后重新加载神谕状态失败:', error);
          } finally {
            setIsLoading(false);
          }
        }, 300); // 延迟300毫秒以确保所有数据库操作完成
      }
    };
    
    // 监听创建新对话事件 - 这部分可以保留，作为一种补充机制
    // 但主要的状态同步应由 activeConversationId prop 驱动
    const handleConversationChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      // 确保事件是关于新的、不同的对话ID，或者ID变为空
      if (customEvent.detail?.newConversationId !== activeConversationId || !customEvent.detail?.newConversationId) {
        console.log('[ShenyuTabContent] 检测到对话变更事件 (created/switched)，清空UI for new/empty context', customEvent.detail);
        clearShenyuUI();
      }
    };
    
    // 添加所有事件监听器
    window.addEventListener('conversation-switched', handleConversationSwitch);
    window.addEventListener('conversation-created', handleConversationChange);
    window.addEventListener('conversation-switched', handleConversationChange);
    
    // 合并的清理函数
    return () => {
      window.removeEventListener('conversation-switched', handleConversationSwitch);
      window.removeEventListener('conversation-created', handleConversationChange);
      window.removeEventListener('conversation-switched', handleConversationChange);
    };
  }, [activeConversationId, loadShenyuJson]); // <--- 依赖 activeConversationId prop 和 loadShenyuJson
  
  return (
    <div className={`shenyu-tab-content ${className || ''}`} style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'var(--main-bg)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-white)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <span>数据保存中...</span>
          </div>
        </div>
      )}
      <ShenyuCardView 
        jsonContent={jsonContent}
      />
    </div>
  );
};

export default ShenyuTabContent;
