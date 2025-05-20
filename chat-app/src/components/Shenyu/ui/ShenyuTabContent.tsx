import React, { useState, useEffect, useRef } from 'react';
import { useMode } from '../../../contexts/ModeContext';
import ShenyuCardView from './ShenyuCardView';
import { getActiveConversationId, getConversation, saveConversation } from '../../../utils/db';
import { ConversationMeta } from '../../../types';

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
  // 保存状态跟踪
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
  
  // 从数据库加载JSON - 增强版，尊重保存状态
  const loadShenyuJson = async () => {
    // 如果当前有保存操作，或者明确标记跳过加载，则跳过
    if (isSaving || skipNextLoadRef.current) {
      console.log('[ShenyuTabContent] 跳过加载，因为', 
                  isSaving ? '有保存操作正在进行' : '设置了跳过标记');
      skipNextLoadRef.current = false; // 重置跳过标记
      return '';
    }
    
    if (!activeConversationId) return ''; // <--- 使用 prop
    try {
      // 获取当前对话
      const conversation = await getConversation(activeConversationId); // <--- 使用 prop
      if (!conversation) {
        console.error('[ShenyuTabContent] 加载失败: 未找到对话', activeConversationId);
        return '';
      }
      
      // 直接返回原始JSON字符串，不做任何处理
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
    // 处理查看JSON事件的回调 - 优化版，协调保存和UI更新
    const handleViewJson = async (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.jsonContent) {
        const newJson = customEvent.detail.jsonContent;
        
        // 如果已经在保存中，忽略新请求
        if (isSaving) {
          console.log('[ShenyuTabContent] 忽略查看请求，因为有保存操作正在进行');
          return;
        }
        
        // 设置跳过下一次加载的标记 - 防止保存过程中的自动加载
        skipNextLoadRef.current = true;
        
        // 1. 先更新UI（提高响应性）
        setJsonContent(newJson);
        
        // 尝试激活神谕标签页
        try {
          const { setActiveTabId } = window as any;
          if (typeof setActiveTabId === 'function') {
            setActiveTabId('shenyu');
          }
        } catch (error) {
          console.error('[ShenyuTabContent] 无法激活神谕标签页:', error);
        }
        
        // 2. 然后等待保存操作完成（不再使用void忽略Promise）
        const saveSuccess = await saveShenyuJson(newJson);
        
        // 3. 保存失败时回滚UI或重新加载
        if (!saveSuccess) {
          console.log('[ShenyuTabContent] 保存失败，重新加载数据...');
          const savedJson = await loadShenyuJson();
          if (savedJson) {
            setJsonContent(savedJson);
          }
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
    
    // 添加全局监听器
    window.addEventListener('conversation-created', handleConversationChange);
    window.addEventListener('conversation-switched', handleConversationChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('conversation-created', handleConversationChange);
      window.removeEventListener('conversation-switched', handleConversationChange);
    };
  }, [activeConversationId, loadShenyuJson]); // <--- 依赖 activeConversationId prop 和 loadShenyuJson
  
  return (
    <div className={`shenyu-tab-content ${className || ''}`} style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <ShenyuCardView 
        jsonContent={jsonContent}
      />
    </div>
  );
};

export default ShenyuTabContent;
