import { useCallback, RefObject } from 'react';
import { ShenyuChatInterfaceHandle } from '../../Chat/ShenyuChatInterface';
import { usePromptRunner, Message } from '../hooks/usePromptRunner';
import { PromptBlock, Card, GlobalPromptBlocks } from '../../types';

interface UseAgentRunnerProps {
  chatInterfaceRef: RefObject<ShenyuChatInterfaceHandle>;
  agentName: string;
  cards: Card[];
  promptBlocks: PromptBlock[];
  controlValues: Record<string, any>;
  chatMessages: Message[];
  addInteraction?: (type: 'prompt' | 'response', content: string, note?: string) => void;
}

/**
 * useAgentRunner - Agent执行钩子
 * 
 * 从index.tsx分离的Agent运行逻辑，负责调用提示词运行器和管理执行流程
 */
export const useAgentRunner = ({
  chatInterfaceRef,
  agentName,
  cards,
  promptBlocks,
  controlValues,
  chatMessages,
  addInteraction
}: UseAgentRunnerProps) => {
  
  // 使用提示词运行器
  const promptRunner = usePromptRunner({
    chatInterfaceRef,
    agentName,
    promptBlocks,
    controlValues,
    userMessages: chatMessages
  });
  
  // 运行Agent
  const runAgent = useCallback(async () => {
    console.log('\n====================================');
    console.log(`[AgentRunner] 开始运行Agent: ${agentName}`);
    console.log('====================================\n');
    
    // 检查是否有卡片和提示词块
    if (cards.length === 0 || promptBlocks.length === 0) {
      console.warn('[AgentRunner] 无法运行Agent: 没有卡片或提示词块');
      return false;
    }
    
    console.log(`[AgentRunner] 运行信息:`, {
      agentName,
      cardsCount: cards.length,
      promptBlocksCount: promptBlocks.length,
      hasControlValues: Object.keys(controlValues).length > 0
    });
    
    try {
      // 记录交互日志
      if (addInteraction) {
        addInteraction('prompt', `运行Agent: ${agentName}`, '用户操作');
      }
      
      // 委托给提示词运行器执行
      const result = await promptRunner.runAgent();
      
      if (result) {
        console.log('[AgentRunner] Agent运行成功');
        
        // 记录交互日志
        if (addInteraction) {
          addInteraction('response', `Agent ${agentName} 运行完成`, '系统消息');
        }
      } else {
        console.warn('[AgentRunner] Agent运行未能完成');
      }
      
      return result;
    } catch (error) {
      console.error('[AgentRunner] 运行Agent时发生错误:', error);
      
      // 记录错误日志
      if (addInteraction) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addInteraction('response', `运行错误: ${errorMessage}`, '错误');
      }
      
      return false;
    }
  }, [agentName, cards, promptBlocks, controlValues, chatMessages, promptRunner, addInteraction]);
  
  return { runAgent };
};
