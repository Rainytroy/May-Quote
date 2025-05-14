/**
 * May-Shenyu整合测试脚本
 * 
 * 用于验证数据结构扩展和数据库操作是否正常工作
 */

import { 
  Conversation, 
  Message, 
  ShenyuState 
} from '../sharedTypes';
import { 
  saveConversation, 
  getConversation, 
  generateId 
} from './storage-db';
import { 
  saveCurrentState, 
  createShenyuState, 
  detectGenerationStatus, 
  findLatestJsonOutput 
} from './mode-state-manager';

/**
 * 创建测试消息
 */
function createTestMessages(): Message[] {
  return [
    {
      id: generateId(),
      role: 'user',
      content: '设计一个营销机器人',
      timestamp: Date.now() - 5000
    },
    {
      id: generateId(),
      role: 'assistant',
      content: '好的，我将设计一个营销机器人...',
      timestamp: Date.now() - 4000,
      type: 'progress',
      progress: {
        current: 3,
        total: 5,
        completed: false,
        cardBlocks: 2,
        globalBlocks: 3
      }
    },
    {
      id: generateId(),
      role: 'assistant',
      content: '我已经为您设计了一个营销机器人。',
      timestamp: Date.now() - 3000,
      type: 'json',
      jsonOutput: JSON.stringify({
        agentName: "MarketingBot",
        description: "专业的营销策略顾问",
        capabilities: ["内容创作", "用户分析", "社交媒体管理"]
      }),
      sender: 'May the 神谕 be with you'
    }
  ];
}

/**
 * 创建测试对话
 */
function createTestConversation(): Conversation {
  const id = generateId();
  const messages = createTestMessages();
  
  const shenyuState: ShenyuState = {
    cards: [{ 
      id: 'card1', 
      title: '营销机器人', 
      adminInputs: { 
        description: '专业的营销策略顾问',
        targetAudience: '企业用户'
      },
      promptBlocks: {
        intro: '这是一个专业的营销机器人，能够帮助企业优化营销策略。',
        capabilities: '内容创作、用户分析、社交媒体管理'
      }
    }],
    globalPromptBlocks: { greeting: "您好，我是营销机器人！" },
    hasGenerated: true,
    activeTemplate: 'marketing-template',
    latestJsonOutput: messages[2].jsonOutput
  };
  
  return {
    id,
    title: '营销机器人设计',
    messages,
    clipboardItems: [],
    createdAt: Date.now() - 5000,
    updatedAt: Date.now(),
    currentMode: 'shenyu',
    shenyuState
  };
}

/**
 * 运行测试
 */
export async function runIntegrationTest(): Promise<void> {
  console.log('开始May-Shenyu整合测试...');
  
  try {
    // 步骤1: 创建测试对话
    const testConversation = createTestConversation();
    console.log('已创建测试对话:', testConversation.id);
    
    // 步骤2: 保存对话到数据库
    await saveConversation(testConversation);
    console.log('对话已保存到数据库');
    
    // 步骤3: 从数据库中读取对话
    const retrievedConversation = await getConversation(testConversation.id);
    console.log('已从数据库读取对话:', retrievedConversation?.id);
    
    // 步骤4: 验证扩展字段
    if (retrievedConversation) {
      // 验证currentMode字段
      console.log('验证currentMode:', 
        retrievedConversation.currentMode === testConversation.currentMode ? '成功' : '失败');
      
      // 验证shenyuState字段
      const hasShenyuState = !!retrievedConversation.shenyuState;
      console.log('验证shenyuState存在:', hasShenyuState ? '成功' : '失败');
      
      if (hasShenyuState) {
        console.log('验证hasGenerated字段:', 
          retrievedConversation.shenyuState!.hasGenerated === testConversation.shenyuState!.hasGenerated ? '成功' : '失败');
      }
      
      // 验证消息类型字段
      const message = retrievedConversation.messages[2];
      const hasType = message && 'type' in message;
      console.log('验证消息type字段:', hasType ? '成功' : '失败');
      
      const hasJsonOutput = message && 'jsonOutput' in message;
      console.log('验证消息jsonOutput字段:', hasJsonOutput ? '成功' : '失败');
      
      // 步骤5: 测试工具函数
      const generationStatus = detectGenerationStatus(retrievedConversation);
      console.log('检测生成状态:', generationStatus ? '已生成' : '未生成');
      
      const jsonOutput = findLatestJsonOutput(retrievedConversation);
      console.log('查找最新JSON输出:', jsonOutput ? '成功' : '失败');
      
      // 步骤6: 测试状态保存
      const result = await saveCurrentState(
        retrievedConversation.id,
        retrievedConversation,
        'may'  // 切换到may模式
      );
      console.log('保存状态结果:', result ? '成功' : '失败');
      
      // 步骤7: 验证状态更新
      const updatedConversation = await getConversation(retrievedConversation.id);
      if (updatedConversation) {
        console.log('验证模式切换:', 
          updatedConversation.currentMode === 'may' ? '成功' : '失败');
      }
    } else {
      console.error('测试失败: 无法从数据库读取对话');
    }
    
    console.log('May-Shenyu整合测试完成');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}
