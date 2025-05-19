import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, ConversationMeta, ClipboardItem } from '../types';
import {
  getConversationMetaList,
  getConversation,
  saveConversation,
  deleteConversation as deleteConversationFromDB,
  getActiveConversationId,
  saveActiveConversationId,
  generateId,
  generateTitle
} from '../utils/db'; // 从新的数据库服务导入

/**
 * 对话管理Hook
 * 处理对话列表、当前活动对话等状态
 */
export function useConversations() {
  // 对话元数据列表（用于侧边栏显示）
  const [conversationMetas, setConversationMetas] = useState<ConversationMeta[]>([]);
  
  // 当前活动对话
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 创建初始化锁，确保初始化只发生一次
  const isInitialized = useRef(false);
  // 是否已创建默认对话
  const hasCreatedDefaultConversation = useRef(false);

  // 初始化：加载对话列表和活动对话
  useEffect(() => {
    // 如果已经初始化过，则跳过
    if (isInitialized.current) {
      return;
    }
    
    // 标记为已初始化
    isInitialized.current = true;
    
    async function initConversations() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 加载对话列表
        const metas = await getConversationMetaList();
        setConversationMetas(metas);
        
        // 如果有对话列表，则加载上次活动的对话
        if (metas.length > 0) {
          // 获取上次活动的对话ID
          let activeId = await getActiveConversationId();
          
          // 如果没有保存的活动ID，或者该ID不在当前列表中，则使用列表中的第一个
          if (!activeId || !metas.some(meta => meta.id === activeId)) {
            activeId = metas[0].id;
          }
          
          // 选择活动对话
          if (activeId) {
            await selectConversation(activeId);
          }
        }
        // 不再自动创建默认对话
      } catch (err: any) {
        setError(`初始化对话失败: ${err.message || '未知错误'}`);
        console.error('初始化对话失败:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    initConversations();
  }, []);
  
  /**
   * 创建新对话
   * @param isManualCreate 是否是用户手动创建的对话（而非自动初始化）
   */
  const createNewConversation = useCallback(async (isManualCreate: boolean = false) => {
    try {
      console.log(`开始创建新对话... ${isManualCreate ? '(手动创建)' : '(自动创建)'}`);
      
      // 只有在自动创建（非手动创建）时才检查是否已有对话
      if (!isManualCreate) {
        const existingMetas = await getConversationMetaList();
        if (existingMetas.length > 0 && isInitialized.current) {
          console.log('已存在对话且为自动创建，跳过创建新对话');
          return existingMetas[0].id;
        }
      }
      
      // 生成新对话ID
      const timestamp = Date.now();
      const newId = generateId() + '-' + timestamp.toString(36);
      
      // 创建新对话对象
      const newConversation: Conversation = {
        id: newId,
        title: generateTitle(),
        messages: [],
        clipboardItems: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      console.log(`创建新对话: ${newId}`);
      
      // 保存到数据库
      await saveConversation(newConversation);
      
      // 更新状态
      setActiveConversationId(newId);
      setActiveConversation(newConversation);
      await saveActiveConversationId(newId);
      
      // 重新加载对话列表
      const metas = await getConversationMetaList();
      setConversationMetas(metas);
      
      // 标记已创建默认对话
      hasCreatedDefaultConversation.current = true;
      
      return newId;
    } catch (err: any) {
      setError(`创建新对话失败: ${err.message || '未知错误'}`);
      console.error('创建新对话失败:', err);
      return null;
    }
  }, []);
  
  /**
   * 选择对话
   */
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      // 先保存当前对话（如果有）
      if (activeConversation) {
        await saveConversation(activeConversation);
      }
      
      // 加载选中的对话
      const conversation = await getConversation(conversationId);
      
      if (conversation) {
        // 确保所有消息的loading属性为false
        const processedConversation = {
          ...conversation,
          messages: conversation.messages.map(msg => ({
            ...msg,
            loading: false // 确保加载的消息没有loading状态
          }))
        };
        
        setActiveConversationId(conversationId);
        setActiveConversation(processedConversation);
        await saveActiveConversationId(conversationId);
        return true;
      } else {
        throw new Error(`找不到ID为 ${conversationId} 的对话`);
      }
    } catch (err: any) {
      setError(`选择对话失败: ${err.message || '未知错误'}`);
      console.error('选择对话失败:', err);
      return false;
    }
  }, [activeConversation]);
  
  /**
   * 删除对话 - 使用新的Dexie数据库服务
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      console.log(`开始删除对话: ${conversationId}`);
      
      // 使用新的数据库服务删除对话
      const deleteSuccess = await deleteConversationFromDB(conversationId);
      
      if (!deleteSuccess) {
        console.error('删除对话失败：数据库操作未完成');
        setError('删除对话失败：数据库操作未完成');
        return false;
      }
      
      // 删除成功后立即更新UI状态
      setConversationMetas(prevMetas => {
        const filteredMetas = prevMetas.filter(meta => meta.id !== conversationId);
        console.log(`UI对话列表从 ${prevMetas.length} 减少到 ${filteredMetas.length}`);
        return filteredMetas;
      });
      
      // 如果删除的是当前活动对话，清除活动对话ID
      if (activeConversationId === conversationId) {
        console.log('清除活动对话');
        // 清除活动对话状态
        setActiveConversationId(null);
        setActiveConversation(null);
        await saveActiveConversationId('');
        
        // 获取剩余对话列表
        const remainingMetas = conversationMetas.filter(meta => meta.id !== conversationId);
        
        if (remainingMetas.length > 0) {
          // 有剩余对话但不自动切换，让用户选择
          console.log(`有${remainingMetas.length}个剩余对话，等待用户选择`);
        }
      }
      
      console.log('对话删除操作完成');
      return true;
    } catch (err: any) {
      setError(`删除对话失败: ${err.message || '未知错误'}`);
      console.error('删除对话过程发生异常:', err);
      return false;
    }
  }, [activeConversationId, conversationMetas, selectConversation, createNewConversation]);
  
  /**
   * 更新当前对话内容
   */
  const updateActiveConversation = useCallback(async (
    messages: any[],
    clipboardItems: ClipboardItem[] = []
  ) => {
    if (!activeConversation) return false;
    
    try {
      // 确保所有消息的loading属性为false再保存
      const processedMessages = messages.map(msg => ({
        ...msg,
        loading: false // 确保保存时不会有loading状态
      })).slice(-100); // 限制最多100条消息
      
      // 更新对话对象
      const updatedConversation: Conversation = {
        ...activeConversation,
        messages: processedMessages,
        clipboardItems,
        updatedAt: Date.now()
      };
      
      // 如果是第一条用户消息，根据内容更新标题
      if (
        activeConversation.messages.length === 0 && 
        messages.length > 0 && 
        messages[0].role === 'user'
      ) {
        updatedConversation.title = generateTitle(messages[0].content);
      }
      
      // 保存到数据库
      if (updatedConversation.messages && updatedConversation.messages.length > 0) {
        const lastAiMsg = updatedConversation.messages[updatedConversation.messages.length - 1];
        if (lastAiMsg && lastAiMsg.role === 'assistant') {
          console.log('[useConversations] Before saveConversation - Last AI message content. Length:', lastAiMsg.content?.length, 'Content sample:', lastAiMsg.content?.substring(0, 50) + "...", lastAiMsg.content?.substring((lastAiMsg.content?.length || 0) - 50));
        }
      }
      await saveConversation(updatedConversation);
      
      // 更新状态
      setActiveConversation(updatedConversation);
      
      // 更新对话列表中的元数据
      const metas = await getConversationMetaList();
      setConversationMetas(metas);
      
      return true;
    } catch (err: any) {
      setError(`更新对话失败: ${err.message || '未知错误'}`);
      console.error('更新对话失败:', err);
      return false;
    }
  }, [activeConversation]);
  
  /**
   * 更新对话标题
   */
  const updateConversationTitle = useCallback(async (title: string) => {
    if (!activeConversation) return false;
    
    try {
      // 更新对话对象
      const updatedConversation: Conversation = {
        ...activeConversation,
        title,
        updatedAt: Date.now()
      };
      
      // 保存到数据库
      await saveConversation(updatedConversation);
      
      // 更新状态
      setActiveConversation(updatedConversation);
      
      // 更新对话列表中的元数据
      const metas = await getConversationMetaList();
      setConversationMetas(metas);
      
      return true;
    } catch (err: any) {
      setError(`更新对话标题失败: ${err.message || '未知错误'}`);
      console.error('更新对话标题失败:', err);
      return false;
    }
  }, [activeConversation]);

  /**
   * 将消息添加到当前对话的剪贴板
   */
  const addToClipboard = useCallback(async (messageId: string) => {
    if (!activeConversation) return false;
    
    try {
      // 查找要添加的消息
      const message = activeConversation.messages.find(m => m.id === messageId);
      if (!message) {
        console.error(`找不到ID为${messageId}的消息`);
        return false;
      }
      
      // 创建新的剪贴板项
      const newClipboardItem: ClipboardItem = {
        id: generateId(),
        content: message.content,
        timestamp: Date.now(),
        order: activeConversation.clipboardItems.length, // 添加到末尾
        source: {
          conversationId: activeConversation.id,
          messageId
        }
      };
      
      // 更新剪贴板项
      const updatedClipboardItems = [
        ...activeConversation.clipboardItems,
        newClipboardItem
      ];
      
      // 更新对话
      const updatedConversation: Conversation = {
        ...activeConversation,
        clipboardItems: updatedClipboardItems,
        updatedAt: Date.now()
      };
      
      // 保存到数据库
      await saveConversation(updatedConversation);
      
      // 更新状态
      setActiveConversation(updatedConversation);
      
      return true;
    } catch (err: any) {
      setError(`添加到剪贴板失败: ${err.message || '未知错误'}`);
      console.error('添加到剪贴板失败:', err);
      return false;
    }
  }, [activeConversation]);
  
  /**
   * 添加选中文本到剪贴板
   * 专门处理用户从消息中选择的文本片段
   */
  const addSelectedTextToClipboard = useCallback(async (selectedText: string, messageId: string) => {
    console.log('[DEBUG-clipboard] useConversations.addSelectedTextToClipboard 开始', {
      selectedText: selectedText.substring(0, 20) + '...',
      messageId,
      hasActiveConversation: !!activeConversation,
      时间戳: new Date().toISOString()
    });
    
    if (!activeConversation) {
      console.error('[DEBUG-clipboard] 无活动对话，无法添加到剪贴板');
      return false;
    }
    
    try {
      // 创建新的剪贴板项
      const itemId = generateId();
      
      const newClipboardItem: ClipboardItem = {
        id: itemId,
        content: selectedText, // 使用选中的文本内容，而不是整个消息
        timestamp: Date.now(),
        order: activeConversation.clipboardItems.length, // 添加到末尾
        source: {
          conversationId: activeConversation.id,
          messageId
        }
      };
      
      console.log('[DEBUG-clipboard] 创建新的剪贴板项', {
        id: itemId,
        内容片段: selectedText.substring(0, 20) + '...',
        conversationId: activeConversation.id,
        messageId,
        当前剪贴板数量: activeConversation.clipboardItems.length
      });
      
      // 更新剪贴板项
      const updatedClipboardItems = [
        ...activeConversation.clipboardItems,
        newClipboardItem
      ];
      
      // 更新对话
      const updatedConversation: Conversation = {
        ...activeConversation,
        clipboardItems: updatedClipboardItems,
        updatedAt: Date.now()
      };
      
      // 保存到数据库
      console.log('[DEBUG-clipboard] 开始保存到数据库');
      await saveConversation(updatedConversation);
      console.log('[DEBUG-clipboard] 数据库保存完成');
      
      // 更新状态
      setActiveConversation(updatedConversation);
      console.log('[DEBUG-clipboard] 状态更新完成，新剪贴板项数量:', updatedClipboardItems.length);
      
      return true;
    } catch (err: any) {
      setError(`添加选中文本到剪贴板失败: ${err.message || '未知错误'}`);
      console.error('添加选中文本到剪贴板失败:', err);
      return false;
    }
  }, [activeConversation]);
  
  /**
   * 从剪贴板中移除项目
   */
  const removeFromClipboard = useCallback(async (clipboardItemId: string) => {
    if (!activeConversation) return false;
    
    try {
      // 过滤掉要删除的剪贴板项
      const updatedClipboardItems = activeConversation.clipboardItems.filter(
        item => item.id !== clipboardItemId
      );
      
      // 更新剪贴板项的顺序
      const reorderedItems = updatedClipboardItems.map((item, index) => ({
        ...item,
        order: index
      }));
      
      // 更新对话
      const updatedConversation: Conversation = {
        ...activeConversation,
        clipboardItems: reorderedItems,
        updatedAt: Date.now()
      };
      
      // 保存到数据库
      await saveConversation(updatedConversation);
      
      // 更新状态
      setActiveConversation(updatedConversation);
      
      return true;
    } catch (err: any) {
      setError(`从剪贴板移除失败: ${err.message || '未知错误'}`);
      console.error('从剪贴板移除失败:', err);
      return false;
    }
  }, [activeConversation]);
  
  /**
   * 更新剪贴板项的顺序
   */
  const reorderClipboardItems = useCallback(async (items: ClipboardItem[]) => {
    if (!activeConversation) return false;
    
    try {
      // 更新对话
      const updatedConversation: Conversation = {
        ...activeConversation,
        clipboardItems: items,
        updatedAt: Date.now()
      };
      
      // 保存到数据库
      await saveConversation(updatedConversation);
      
      // 更新状态
      setActiveConversation(updatedConversation);
      
      return true;
    } catch (err: any) {
      setError(`更新剪贴板顺序失败: ${err.message || '未知错误'}`);
      console.error('更新剪贴板顺序失败:', err);
      return false;
    }
  }, [activeConversation]);

  return {
    // 状态
    conversationMetas,
    activeConversationId,
    activeConversation,
    isLoading,
    error,
    
    // 方法
    createNewConversation,
    selectConversation,
    deleteConversation,
    updateActiveConversation,
    updateConversationTitle,
    
    // 剪贴板方法
    addToClipboard,
    addSelectedTextToClipboard, // 新增：添加选中文本到剪贴板
    removeFromClipboard,
    reorderClipboardItems
  };
}
