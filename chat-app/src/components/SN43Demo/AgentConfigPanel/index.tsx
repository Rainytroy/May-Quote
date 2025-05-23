import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message } from './hooks/usePromptRunner';
import { useAgentRunner } from './hooks/useAgentRunner';
import { ControlDefinition } from '../Controls/DynamicControl';
import ControlsContainer from '../Controls/ControlsContainer';
import { AdminInputs, PromptBlock, Card, GlobalPromptBlocks } from '../types';
import { usePromptTemplates } from '../contexts/PromptTemplateContext'; // 导入Context Hook
import { mayApi, MayAPI } from '../api/mayApi';
import MultiCardView from '../MultiCardView';

// 导入拆分出的子组件
import CardPreviewPanel from './components/CardPreviewPanel';
import InteractionHistoryPanel from './components/InteractionHistoryPanel';
import ApiStatusIndicator from './components/ApiStatusIndicator';

// 导入新的聊天组件
import ShenyuChatInterface, { ShenyuChatInterfaceHandle } from '../Chat/ShenyuChatInterface';

// 右侧区域Tab类型
type RightPanelTab = 'cards' | 'debug';

// 交互记录类型
interface InteractionEntry {
  id: number;
  timestamp: number;
  type: 'prompt' | 'response';
  content: string;
  note?: string;
}

// 历史卡片类型
interface HistoryCard {
  input: string;
  jsonOutput: string;
  apiRawResponse: string;
  timestamp: number;
  id: number;
}

interface AgentConfigPanelProps {
  onControlsGenerated?: (controls: ControlDefinition[]) => void;
}

/**
 * 新版Agent配置面板
 * 
 * 基于神谕原始提示词逻辑，实现三栏布局的Agent生成界面
 */
const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  onControlsGenerated
}) => {
  console.log('[AgentConfigPanel] 组件已挂载');
  
  // 聊天界面引用
  const chatInterfaceRef = useRef<ShenyuChatInterfaceHandle>(null);
  
  // 在挂载时检查ref
  useEffect(() => {
    console.log('[AgentConfigPanel] 检查chatInterfaceRef:', {
      isChatInterfaceRefDefined: !!chatInterfaceRef,
      isChatInterfaceCurrent: !!chatInterfaceRef.current,
      hasChatInterfaceHandleSubmit: !!(chatInterfaceRef.current?.handleSubmit),
      hasChatInterfaceUpdateAiMessage: !!(chatInterfaceRef.current?.updateAiMessage)
    });
  }, []);
  
  // 调整建议 - 保留原有状态
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');
  // JSON输出
  const [jsonOutput, setJsonOutput] = useState<string>('');
  // API原始响应
  const [apiRawResponse, setApiRawResponse] = useState<string>('');
  // 输入-输出历史卡片
  const [historyCards, setHistoryCards] = useState<HistoryCard[]>([]);
  // 当前活动的卡片JSON标签页状态
  const [activeJsonTabs, setActiveJsonTabs] = useState<Record<number, 'json' | 'raw'>>({});
  // 可编辑的JSON数据
  const [editableJsons, setEditableJsons] = useState<Record<number, string>>({});
  // 生成状态
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // 跟踪当前是初始状态还是已生成状态
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  // 解析后的控件定义
  const [controlDefinitions, setControlDefinitions] = useState<ControlDefinition[]>([]);
  // 解析后的管理员输入
  const [adminInputs, setAdminInputs] = useState<AdminInputs>({});
  // 解析后的提示词块
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([]);
  // 完整的卡片结构
  const [cards, setCards] = useState<Card[]>([]);
  // 全局提示词块
  const [globalPromptBlocks, setGlobalPromptBlocks] = useState<GlobalPromptBlocks>({});
  // 交互历史
  const [interactions, setInteractions] = useState<InteractionEntry[]>([]);
  // 当前处理的提示词
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  // 控件值
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  // 滚动到底部的ref
  const historyContainerRef = useRef<HTMLDivElement>(null);
  
  // 右侧面板Tab状态
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('cards');
  
  // Agent名称状态 - 默认为用户第一条消息的前20个字符
  const [agentName, setAgentName] = useState<string>('未命名Agent');
  
  // 聊天消息状态 - 存储所有用户和AI的消息
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  // 添加历史卡片后滚动到底部
  useEffect(() => {
    if (historyContainerRef.current && historyCards.length > 0) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [historyCards]);

  // 添加交互记录
  const addInteraction = (type: 'prompt' | 'response', content: string, note?: string) => {
    const newEntry: InteractionEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      type,
      content,
      note
    };
    
    console.log(`[AgentConfigPanel] 添加交互历史记录:`, {
      类型: type,
      备注: note || '无',
      内容长度: content.length,
      当前记录数: interactions.length
    });
    
    setInteractions(prev => {
      const newList = [...prev, newEntry];
      console.log(`[AgentConfigPanel] 交互历史已更新，当前记录数: ${newList.length}`);
      return newList;
    });
  };

  // 从Context获取当前激活的模板
  const { activeTemplates } = usePromptTemplates();

  // 保存第一阶段提示词和最新结果，用于后续修改
  const [firstStagePrompt, setFirstStagePrompt] = useState<string>('');
  const [latestJsonOutput, setLatestJsonOutput] = useState<string>('');
  
  // 自动切换到卡片预览Tab
  const switchToCardsTab = useCallback(() => {
    if (activeRightTab !== 'cards') {
      console.log('[AgentConfigPanel] 自动切换到神谕Tab查看生成结果');
      setActiveRightTab('cards');
    }
  }, [activeRightTab]);
  
  // 更新Agent名称
  const handleAgentNameChange = useCallback((newName: string) => {
    setAgentName(newName);
    console.log('[AgentConfigPanel] Agent名称已更新:', newName);
  }, []);
  
  // 替换提示词中的占位符
  const replacePromptPlaceholders = useCallback((text: string, userInput: string) => {
    let result = text;
    
    // 替换基本输入
    result = result.replace(/\{#input\}/g, userInput);
    
    // 替换控件输入值
    Object.entries(controlValues).forEach(([key, value]) => {
      // 替换格式例如 {#inputB1} 中的B1对应控件ID
      const placeholder = `{#input${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
    
    console.log('[AgentConfigPanel] 替换占位符:', {
      原文长度: text.length,
      替换后长度: result.length,
      替换数量: (text.match(/\{#input.*?\}/g) || []).length
    });
    
    return result;
  }, [controlValues]);
  
  // 使用自定义Hook运行Agent
  const { runAgent } = useAgentRunner({
    chatInterfaceRef,
    agentName,
    cards,
    promptBlocks,
    controlValues,
    chatMessages,
    addInteraction
  });
  
  // 生成Agent卡片 - 集成新的聊天界面
  const generateAgent = useCallback(async (content: string) => {
    if (!content.trim()) {
      alert('请输入用户需求描述');
      return;
    }

    console.log('[AgentConfigPanel] generateAgent被调用，当前状态：', {
      hasGenerated,
      isGenerating,
      content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
    });
    
    // 初次生成时，设置Agent名称为用户输入的前20个字符
    if (!hasGenerated) {
      const truncatedName = content.length > 20 
        ? content.substring(0, 20) + '...' 
        : content;
      setAgentName(truncatedName);
      console.log('[AgentConfigPanel] 设置初始Agent名称:', truncatedName);
    }

    // 确保切换到卡片预览Tab
    switchToCardsTab();
    
    setIsGenerating(true);
    
    try {
      let prompt: string;
      let interactionNote: string;
      let userInputsData: any;
      
      // 根据状态决定使用哪个阶段的提示词
      if (!hasGenerated) {
        // 初次生成 - 使用第一阶段提示词
        console.log('[AgentConfigPanel] 执行第一阶段提示词生成...');
        prompt = activeTemplates.firstStage.replace('{#input}', content);
        interactionNote = '第一阶段生成提示词';
        userInputsData = {
          input: content  // 使用实际的用户输入
        };
        
        // 保存第一阶段提示词，用于后续修改
        setFirstStagePrompt(prompt);
        console.log('[AgentConfigPanel] 已保存第一阶段提示词，长度:', prompt.length);
      } else {
        // 修改已有内容 - 使用第二阶段提示词
        console.log('[AgentConfigPanel] 执行第二阶段提示词生成...');
        console.log('[AgentConfigPanel] 第二阶段状态:', {
          hasFirstStagePrompt: !!firstStagePrompt,
          firstStagePromptLength: firstStagePrompt?.length || 0,
          hasLatestJsonOutput: !!latestJsonOutput,
          latestJsonOutputLength: latestJsonOutput?.length || 0,
          hasJsonOutput: !!jsonOutput,
          jsonOutputLength: jsonOutput?.length || 0,
          activeTemplatesID: activeTemplates.id,
          hasSecondStageTemplate: !!activeTemplates.secondStage
        });
        
        // 1. 获取第一阶段的上下文
        // 2. 构建第二阶段提示词，替换占位符
        prompt = activeTemplates.secondStage
          .replace('{#input}', content)
          .replace('{#firstStagePrompt}', firstStagePrompt || '')
          .replace('{#latestResult}', latestJsonOutput || jsonOutput || '');
        
        console.log('[AgentConfigPanel] 第二阶段提示词构建完成，长度:', prompt.length);
        
        interactionNote = '第二阶段修改提示词';
        userInputsData = {
          input: content,
          firstStagePrompt: firstStagePrompt || '',
          latestResult: latestJsonOutput || jsonOutput || ''
        };
      }
      
      setCurrentPrompt(prompt);
      
      // 记录提示词
      console.log('[AgentConfigPanel] 调用addInteraction记录提示词');
      addInteraction('prompt', prompt, interactionNote);
      
      // 获取一个唯一的消息ID来更新对话
      console.log('[AgentConfigPanel] 开始调用handleSubmit获取消息ID...');
      const aiMessageId = await chatInterfaceRef.current?.handleSubmit(content);
      console.log('[AgentConfigPanel] 获得的消息ID:', aiMessageId);
      
      if (!aiMessageId) {
        console.error('[AgentConfigPanel] 错误: 未能获取有效的消息ID!');
        throw new Error('消息ID未生成');
      }
      
      // 调用May的AI服务
      console.log('[AgentConfigPanel] 开始调用API服务...');
      const response = await mayApi.executeShenyuRequest({
        userInputs: userInputsData,
        adminInputs: adminInputs,
        promptBlocks: [{ text: prompt }],
        controls: controlValues // 包含控件值
      });
      console.log('[AgentConfigPanel] API服务调用完成, 获得响应');
      
      // 记录响应
      console.log('[AgentConfigPanel] 调用addInteraction记录API响应');
      addInteraction('response', response.result, 'AI响应');
      
      // 设置原始响应
      setApiRawResponse(response.result);
      
      // 提取JSON部分并格式化
      console.log('[AgentConfigPanel] 开始从响应中提取JSON...');
      const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g;
      const matches = response.result.match(jsonRegex);
      
      let jsonStr = '';
      if (matches && matches.length > 0) {
        console.log('[AgentConfigPanel] 成功匹配到JSON内容');
        jsonStr = JSON.stringify(JSON.parse(matches[0]), null, 2);
        setJsonOutput(jsonStr);
        
        // 更新最新JSON结果，用于后续修改
        setLatestJsonOutput(jsonStr);
        
        // 在获取JSON响应后、解析前清空现有UI，避免UI残留
        console.log('[AgentConfigPanel] 解析JSON前清空现有UI组件');
        setCards([]);
        setControlDefinitions([]);
        
        // 解析JSON
        parseJsonConfig(jsonStr);
        
        // 更新对话流中的消息
        console.log('[AgentConfigPanel] 调用updateAiMessage更新消息内容:', {
          messageId: aiMessageId,
          jsonLength: jsonStr.length,
          responseLength: response.result.length
        });
        
        try {
          if (chatInterfaceRef.current) {
            chatInterfaceRef.current.updateAiMessage(aiMessageId, jsonStr, response.result);
            console.log('[AgentConfigPanel] updateAiMessage调用成功');
          } else {
            console.error('[AgentConfigPanel] 错误: chatInterfaceRef.current为null!');
          }
        } catch (updateError) {
          console.error('[AgentConfigPanel] 更新AI消息时出错:', updateError);
        }
      } else {
        console.warn('[AgentConfigPanel] 未找到有效的JSON数据!');
        jsonStr = '未找到有效的JSON数据';
        setJsonOutput(jsonStr);
        
        // 更新对话流中的消息
        console.log('[AgentConfigPanel] 调用updateAiMessage更新错误消息');
        if (chatInterfaceRef.current) {
          chatInterfaceRef.current.updateAiMessage(aiMessageId, jsonStr, response.result);
        }
      }
      
      // 创建新的历史卡片ID
      const newCardId = Date.now();
      
      // 添加到历史卡片
      const newCard = {
        input: content,
        jsonOutput: jsonStr,
        apiRawResponse: response.result,
        timestamp: newCardId,
        id: newCardId
      };
      
      setHistoryCards(prev => [...prev, newCard]);
      
      // 设置初始激活的标签页为JSON
      setActiveJsonTabs(prev => ({
        ...prev,
        [newCardId]: 'json'
      }));
      
      // 设置可编辑JSON
      setEditableJsons(prev => ({
        ...prev,
        [newCardId]: jsonStr
      }));
      
      // 设置已生成状态
      setHasGenerated(true);
    } catch (error) {
      console.error('生成Agent失败:', error);
      // 增强错误信息
      let errorMessage = '生成失败: ';
      if (error instanceof Error) {
        // 处理网络或API特定错误
        if (error.message.includes('404')) {
          errorMessage += '找不到API服务，请检查服务是否启动或配置是否正确';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += '未知错误';
      }
      setApiRawResponse(errorMessage);
      addInteraction('response', errorMessage, '错误');
    } finally {
      setIsGenerating(false);
    }
  }, [activeTemplates, adminInputs, controlValues, firstStagePrompt, hasGenerated, jsonOutput, latestJsonOutput]);

  // 生成控件 - 先清空UI再渲染
  const generateControls = (jsonText: string, cardId?: number) => {
    if (!jsonText.trim()) {
      alert('请先生成JSON');
      return;
    }

    try {
      // 先清空现有控件和卡片
      setControlDefinitions([]);
      setCards([]);
      
      // 使用setTimeout确保UI已清空后再渲染新控件
      setTimeout(() => {
        // 更新latestJsonOutput，用于下一次修改
        setLatestJsonOutput(jsonText);
        
        // 解析JSON配置
        parseJsonConfig(jsonText);
        
        // 自动切换到卡片预览Tab
        switchToCardsTab();
        
        // 设置已生成状态
        setHasGenerated(true);
        
        // 如果是从历史卡片生成，更新可编辑JSON
        if (cardId) {
          setEditableJsons(prev => ({
            ...prev,
            [cardId]: jsonText
          }));
        }
      }, 50);
    } catch (error) {
      console.error('生成控件失败:', error);
      alert(`生成控件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 解析JSON配置
  const parseJsonConfig = (jsonStr: string) => {
    try {
      const config = JSON.parse(jsonStr);
      
      // 存储当前使用的adminInputs，用于后续生成控件
      let currentAdminInputs: AdminInputs = {};
      
      // 检查配置文件是否有效
      if (!config || typeof config !== 'object') {
        throw new Error('无效的JSON格式');
      }
      
      // 处理多卡片结构
      if (config.cards && Array.isArray(config.cards) && config.cards.length > 0) {
        console.log('检测到多卡片结构');
        
        // 保存完整的卡片结构
        setCards(config.cards);
        
        // 如果有全局提示词块，保存它们
        if (config.globalPromptBlocks && typeof config.globalPromptBlocks === 'object') {
          setGlobalPromptBlocks(config.globalPromptBlocks);
        } else {
          setGlobalPromptBlocks({}); // 重置为空对象
        }
        
        // 使用第一个卡片的adminInputs和promptBlocks用于控件生成
        const firstCard = config.cards[0];
        
        // 验证第一个卡片的结构
        if (!firstCard || typeof firstCard !== 'object') {
          throw new Error('cards数组中的第一个卡片无效');
        }
        
        if (!firstCard.adminInputs || typeof firstCard.adminInputs !== 'object' || 
            !firstCard.promptBlocks || typeof firstCard.promptBlocks !== 'object') {
          throw new Error('卡片结构不正确，必须包含adminInputs和promptBlocks');
        }
        
        // 设置管理员输入 - 使用第一个卡片的数据
        currentAdminInputs = { ...firstCard.adminInputs };
        setAdminInputs(currentAdminInputs);
        
        // 设置提示词块 - 使用第一个卡片的数据
        const blocks: PromptBlock[] = [];
        Object.values(firstCard.promptBlocks).forEach((text: any) => {
          blocks.push({ text: typeof text === 'string' ? text : text.text || '' });
        });
        
        setPromptBlocks(blocks);
      }
      // 处理单卡片结构（旧格式）
      else if (config.adminInputs && typeof config.adminInputs === 'object' && 
               config.promptBlocks && typeof config.promptBlocks === 'object') {
        console.log('检测到单卡片结构');
        
        // 设置管理员输入
        currentAdminInputs = { ...config.adminInputs };
        setAdminInputs(currentAdminInputs);
        
        // 设置提示词块
        const blocks: PromptBlock[] = [];
        Object.values(config.promptBlocks).forEach((text: any) => {
          blocks.push({ text: typeof text === 'string' ? text : text.text || '' });
        });
        setPromptBlocks(blocks);
        
        // 转换为卡片结构并保存 - 兼容旧格式
        const singleCard: Card = {
          id: 'card1',
          title: '配置卡片',
          adminInputs: config.adminInputs,
          promptBlocks: config.promptBlocks
        };
        
        setCards([singleCard]);
        setGlobalPromptBlocks({});
      }
      // 结构不正确
      else {
        throw new Error('JSON结构不正确，必须包含adminInputs和promptBlocks，或是包含cards数组');
      }
      
      // 确保adminInputs存在且有内容
      if (!currentAdminInputs || Object.keys(currentAdminInputs).length === 0) {
        throw new Error('未找到有效的管理员输入字段(adminInputs)');
      }
      
      // 从正确的adminInputs来源生成控件定义
      const controls: ControlDefinition[] = [];
      
      Object.entries(currentAdminInputs).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          console.warn(`警告: adminInputs中的${key}值为undefined或null`);
          return; // 跳过无效值
        }
        
        const valueStr = String(value);
        const labelMatch = valueStr.match(/^(.*?)<def>/);
        const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
        
        const label = labelMatch ? labelMatch[1].trim() : key;
        const defaultValue = defaultMatch ? defaultMatch[1] : '';
        
        // 统一使用文本框类型
        const type: "text" | "textarea" | "number" | "select" | "checkbox" | "radio" = "text";
        
        const control: ControlDefinition = {
          type,
          id: key,
          label,
          defaultValue: defaultValue, // 设置默认值属性
          required: true,
          placeholder: `请输入${label}`
        };
        
        controls.push(control);
      });
      
      setControlDefinitions(controls);
      
      // 通知父组件
      if (onControlsGenerated) {
        onControlsGenerated(controls);
      }
    } catch (error) {
      console.error('解析JSON失败:', error);
      throw error;
    }
  };

  // 处理JSON输入变化 - 历史卡片中的可编辑JSON
  const handleJsonInputChange = (value: string, cardId: number) => {
    setEditableJsons(prev => ({
      ...prev,
      [cardId]: value
    }));
  };

  // 重置到初始状态
  const resetToInitialState = () => {
    setHasGenerated(false);
    setJsonOutput('');
    setApiRawResponse('');
    setControlDefinitions([]);
    setAdminInputs({});
    setPromptBlocks([]);
    setCards([]);
    setGlobalPromptBlocks({});
    setHistoryCards([]);
    setActiveJsonTabs({});
    setEditableJsons({});
    // 重置提示词相关状态
    setFirstStagePrompt('');
    setLatestJsonOutput('');
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // 切换历史卡片的JSON/API标签页
  const toggleCardJsonTab = (cardId: number) => {
    setActiveJsonTabs(prev => ({
      ...prev,
      [cardId]: prev[cardId] === 'json' ? 'raw' : 'json'
    }));
  };

  // 设置全局生成函数 - 移动到generateAgent定义之后
  useEffect(() => {
    console.log('[AgentConfigPanel] 设置全局生成函数');
    
    // 在全局对象上设置generateAgent函数引用
    (window as any).shenyuGenerateAgent = (content: string) => {
      console.log('[全局函数] 直接调用generateAgent:', content);
      return generateAgent(content);
    };
    
    // 组件卸载时清理全局函数
    return () => {
      delete (window as any).shenyuGenerateAgent;
      console.log('[AgentConfigPanel] 全局生成函数已移除');
    };
  }, [generateAgent]); // 依赖于generateAgent确保它已定义

  return (
    <div className="agent-config-panel" style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 左侧面板 - 神谕聊天界面 */}
      <div className="left-panel" style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* 聊天界面组件 */}
        <ShenyuChatInterface 
          ref={(handle) => {
            chatInterfaceRef.current = handle;
            console.log('[AgentConfigPanel] ShenyuChatInterface ref已设置:',
              handle ? '成功' : '失败');
            if (handle) {
              console.log('[AgentConfigPanel] ShenyuChatInterface方法可用性:',
                {
                  handleSubmit: !!handle.handleSubmit,
                  updateAiMessage: !!handle.updateAiMessage
                });
            }
          }}
          onGenerateControls={generateControls}
          onResetState={resetToInitialState}
        />
      </div>
      
      {/* 右侧面板 */}
      <div className="right-panel" style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Tab栏 */}
        <div className="right-panel-tabs" style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--main-bg)'
        }}>
          <div
            onClick={() => setActiveRightTab('cards')}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer',
              fontWeight: activeRightTab === 'cards' ? 'bold' : 'normal',
              color: activeRightTab === 'cards' ? 'var(--text-white)' : 'var(--text-light-gray)',
              borderBottom: activeRightTab === 'cards' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeRightTab === 'cards' ? 'var(--card-bg)' : 'transparent'
            }}
          >
            神谕
          </div>
          <div
            onClick={() => setActiveRightTab('debug')}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer',
              fontWeight: activeRightTab === 'debug' ? 'bold' : 'normal',
              color: activeRightTab === 'debug' ? 'var(--text-white)' : 'var(--text-light-gray)',
              borderBottom: activeRightTab === 'debug' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeRightTab === 'debug' ? 'var(--card-bg)' : 'transparent'
            }}
          >
            神谕-调试
          </div>
        </div>
        
        {/* Tab内容区域 */}
        <div className="right-panel-content" style={{
          flex: 1,
          height: 'calc(100% - 40px)',
          overflow: 'hidden'
        }}>
          {activeRightTab === 'cards' ? (
          <CardPreviewPanel 
            cards={cards}
            globalPromptBlocks={globalPromptBlocks}
            isPreview={true}
            agentName={agentName}
            onAgentNameChange={handleAgentNameChange}
            onRunAgent={runAgent}
            controlValues={controlValues}
            chatInterfaceRef={chatInterfaceRef}
            userInput={chatMessages.length > 0 && chatMessages[0].role === 'user' ? chatMessages[0].content : ''}
          />
          ) : (
            <InteractionHistoryPanel 
              interactions={interactions}
              currentPrompt={currentPrompt}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPanel;
