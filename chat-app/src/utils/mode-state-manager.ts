/**
 * May-Shenyu模式状态管理器
 * 
 * 处理May和神谕模式的状态保存与恢复
 */

import { 
  Conversation, 
  ShenyuState, 
  Message 
} from '../sharedTypes';
import { saveConversation, getConversation } from './storage-db';
import { Card, GlobalPromptBlocks } from '../components/SN43Demo/types';

/**
 * 保存当前状态到对话
 * 
 * @param conversationId 当前对话ID
 * @param conversation 当前对话
 * @param currentMode 当前模式 ('may' | 'shenyu')
 * @param shenyuState 神谕状态对象(可选，仅神谕模式需要)
 * @returns 保存操作是否成功
 */
export async function saveCurrentState(
  conversationId: string, 
  conversation: Conversation,
  currentMode: 'may' | 'shenyu',
  shenyuState?: ShenyuState
): Promise<boolean> {
  try {
    if (!conversationId || !conversation) {
      console.error('保存状态失败: 无效的对话ID或对话对象');
      return false;
    }
    
    // 创建更新对象 - 始终包含当前模式
    const stateUpdate: Partial<Conversation> = {
      currentMode,
      // 其他默认字段保持不变
      messages: conversation.messages,
      clipboardItems: conversation.clipboardItems,
      updatedAt: Date.now()
    };
    
    // 如果是神谕模式且提供了shenyuState，则添加到更新对象
    if (currentMode === 'shenyu' && shenyuState) {
      stateUpdate.shenyuState = shenyuState;
    }
    
    // 创建更新后的对话对象
    const updatedConversation: Conversation = {
      ...conversation,
      ...stateUpdate
    };
    
    // 保存到数据库
    await saveConversation(updatedConversation);
    
    console.log(`[ModeStateManager] 状态已保存，模式: ${currentMode}`, 
      shenyuState ? ', 包含神谕状态' : '');
    
    return true;
  } catch (error) {
    console.error('保存当前状态失败:', error);
    return false;
  }
}

/**
 * 创建新的神谕状态对象
 * 
 * @param cards 卡片数据 
 * @param globalPromptBlocks 全局提示词块
 * @param hasGenerated 是否已生成过
 * @param activeTemplate 当前使用的模板ID
 * @param latestJsonOutput 最新JSON输出(可选)
 * @returns 神谕状态对象
 */
export function createShenyuState(
  cards: Card[] = [],
  globalPromptBlocks: GlobalPromptBlocks = {},
  hasGenerated: boolean = false,
  activeTemplate: string = 'default',
  latestJsonOutput?: string
): ShenyuState {
  return {
    cards,
    globalPromptBlocks,
    hasGenerated,
    activeTemplate,
    latestJsonOutput
  };
}

/**
 * 从对话中恢复状态
 * 
 * @param conversation 对话对象
 * @returns 包含恢复状态的对象
 */
export function restoreStateFromConversation(conversation: Conversation): {
  currentMode: 'may' | 'shenyu';
  shenyuState?: ShenyuState;
} {
  // 默认为May模式
  const currentMode = conversation.currentMode || 'may';
  
  // 如果是神谕模式且有神谕状态，则恢复它
  if (currentMode === 'shenyu' && conversation.shenyuState) {
    return {
      currentMode,
      shenyuState: conversation.shenyuState
    };
  }
  
  // 否则只返回模式
  return {
    currentMode
  };
}

/**
 * 类型保护：检查消息是否为神谕消息
 * 
 * @param msg 要检查的消息对象
 * @returns 是否是神谕类型的消息
 */
function isShenyuMessage(msg: Message): boolean {
  return (
    msg !== undefined && 
    'type' in msg && 
    typeof (msg as any).type === 'string' && 
    ['json', 'prompt', 'progress'].includes((msg as any).type)
  );
}

/**
 * 类型保护：检查消息是否包含JSON输出
 * 
 * @param msg 要检查的消息对象
 * @returns 是否包含JSON输出
 */
function hasJsonOutput(msg: Message): boolean {
  return (
    isShenyuMessage(msg) && 
    'jsonOutput' in msg && 
    typeof (msg as any).jsonOutput === 'string' && 
    (msg as any).jsonOutput.trim() !== ''
  );
}

/**
 * 从对话历史中检测生成状态
 * 
 * @param conversation 对话对象
 * @returns 是否已生成过Agent
 */
export function detectGenerationStatus(conversation: Conversation): boolean {
  // 如果已有shenyuState且已标记为生成过，直接返回
  if (conversation.shenyuState?.hasGenerated) {
    return true;
  }
  
  // 否则检查消息历史
  return conversation.messages.some(msg => {
    return isShenyuMessage(msg) && 
           (msg as any).type === 'json' && 
           hasJsonOutput(msg);
  });
}

/**
 * 从对话历史中查找最新的JSON输出
 * 
 * @param conversation 对话对象
 * @returns 最新的JSON输出，如果没有则返回null
 */
export function findLatestJsonOutput(conversation: Conversation): string | null {
  // 如果shenyuState中有latestJsonOutput，直接返回
  if (conversation.shenyuState?.latestJsonOutput) {
    return conversation.shenyuState.latestJsonOutput;
  }
  
  // 倒序遍历消息历史，找出最后一个包含jsonOutput的消息
  for (let i = conversation.messages.length - 1; i >= 0; i--) {
    const msg = conversation.messages[i];
    if (isShenyuMessage(msg) && 
        (msg as any).type === 'json' && 
        hasJsonOutput(msg)) {
      return (msg as any).jsonOutput;
    }
  }
  
  return null;
}
