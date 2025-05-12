import React, { useState, useEffect, useRef } from 'react';
import { ControlDefinition } from '../Controls/DynamicControl';
import ControlsContainer from '../Controls/ControlsContainer';
import { AdminInputs, PromptBlock, Card, GlobalPromptBlocks } from '../types';
import { usePromptTemplates } from '../contexts/PromptTemplateContext'; // 导入Context Hook
import { mayApi, MayAPI } from '../api/mayApi';
import MultiCardView from '../MultiCardView';

// 导入拆分出的子组件
import CardPreviewPanel from './components/CardPreviewPanel';
import InteractionHistoryPanel from './components/InteractionHistoryPanel';

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
  // 用户输入
  const [userInput, setUserInput] = useState<string>('');
  // 调整建议
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
  
  // API配置状态
  const [apiConfig, setApiConfig] = useState<{
    baseUrl: string;
    apiKey?: string;
    initialized: boolean;
    modelId?: string;
    modelName?: string;
  }>({ baseUrl: '', initialized: false });
  
  // 获取当前的API配置
  useEffect(() => {
    const updateApiConfig = () => {
      const config = mayApi.getApiConfig();
      setApiConfig(config);
    };
    
    // 初始加载时获取配置
    updateApiConfig();
    
    // 定期刷新配置
    const intervalId = setInterval(updateApiConfig, 5000);
    
    // 清理函数
    return () => clearInterval(intervalId);
  }, []);
  
  // 添加历史卡片后滚动到底部
  useEffect(() => {
    if (historyContainerRef.current && historyCards.length > 0) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [historyCards]);
  
  // 手动刷新API配置
  const refreshApiConfig = () => {
    setApiConfig(mayApi.getApiConfig());
  };

  // 添加交互记录
  const addInteraction = (type: 'prompt' | 'response', content: string, note?: string) => {
    const newEntry: InteractionEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      type,
      content,
      note
    };
    
    setInteractions(prev => [...prev, newEntry]);
  };

  // 从Context获取当前激活的模板
  const { activeTemplates } = usePromptTemplates();

  // 保存第一阶段提示词和结果，用于后续修改
  const [firstStagePrompt, setFirstStagePrompt] = useState<string>('');
  const [firstStageResult, setFirstStageResult] = useState<string>('');
  
  // 生成Agent卡片 - 根据当前状态使用不同的提示词逻辑
  const generateAgent = async () => {
    if (!userInput.trim()) {
      alert('请输入用户需求描述');
      return;
    }

    setIsGenerating(true);
    
    try {
      let prompt: string;
      let interactionNote: string;
      let userInputsData: any;
      
      // 根据状态决定使用哪个阶段的提示词
      if (!hasGenerated) {
        // 初次生成 - 使用第一阶段提示词
        prompt = activeTemplates.firstStage.replace('{#input}', userInput);
        interactionNote = '第一阶段生成提示词';
        userInputsData = {
          input: userInput  // 使用实际的用户输入
        };
        
        // 保存第一阶段提示词，用于后续修改
        setFirstStagePrompt(prompt);
      } else {
        // 修改已有内容 - 使用第二阶段提示词
        // 1. 获取第一阶段的上下文
        // 2. 构建第二阶段提示词，替换占位符
        prompt = activeTemplates.secondStage
          .replace('{#input}', userInput)
          .replace('{#firstStagePrompt}', firstStagePrompt)
          .replace('{#promptResults1}', jsonOutput);
        
        interactionNote = '第二阶段修改提示词';
        userInputsData = {
          input: userInput,
          firstStagePrompt: firstStagePrompt,
          firstStageResult: jsonOutput
        };
      }
      
      setCurrentPrompt(prompt);
      
      // 记录提示词
      addInteraction('prompt', prompt, interactionNote);
      
      // 调用May的AI服务
      const response = await mayApi.executeShenyuRequest({
        userInputs: userInputsData,
        adminInputs: adminInputs,
        promptBlocks: [{ text: prompt }],
        controls: controlValues // 包含控件值
      });
      
      // 记录响应
      addInteraction('response', response.result, 'AI响应');
      
      // 设置原始响应
      setApiRawResponse(response.result);
      
      // 提取JSON部分并格式化
      const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g;
      const matches = response.result.match(jsonRegex);
      
      let jsonStr = '';
      if (matches && matches.length > 0) {
        jsonStr = JSON.stringify(JSON.parse(matches[0]), null, 2);
        setJsonOutput(jsonStr);
        
        // 解析JSON
        parseJsonConfig(jsonStr);
      } else {
        jsonStr = '未找到有效的JSON数据';
        setJsonOutput(jsonStr);
      }
      
      // 创建新的历史卡片ID
      const newCardId = Date.now();
      
      // 添加到历史卡片
      const newCard = {
        input: userInput,
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
      
      // 清空输入框，准备下一次输入
      setUserInput('');
      
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
  };

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
        parseJsonConfig(jsonText);
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
    setUserInput('');
    // 重置第一阶段提示词相关状态
    setFirstStagePrompt('');
    setFirstStageResult('');
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

  return (
    <div className="agent-config-panel" style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 左侧面板 - 输入区和历史卡片 */}
      <div className="left-panel" style={{
        width: '33.3%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* 顶部API配置区域 */}
        <div style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h2 style={{ color: 'var(--text-white)' }}>Agent生成器</h2>
          
          {/* API配置信息显示 */}
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: 'var(--space-md)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--space-sm)'
            }}>
              <h3 style={{ color: 'var(--text-white)', margin: 0, fontSize: 'var(--font-sm)' }}>MayAPI配置状态</h3>
              <button
                onClick={refreshApiConfig}
                style={{
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-xs)'
                }}
              >
                刷新配置
              </button>
            </div>
            
            <div style={{ 
              color: 'var(--text-light-gray)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-xs)'
            }}>
              <div>BaseURL: <span style={{ color: 'var(--text-white)' }}>{apiConfig.baseUrl}</span></div>
              <div>API密钥: <span style={{ color: apiConfig.apiKey ? 'var(--brand-color)' : 'var(--error-color)' }}>
                {apiConfig.apiKey ? apiConfig.apiKey : '未设置'}
              </span></div>
              <div>模型: <span style={{ color: 'var(--text-white)' }}>
                {apiConfig.modelName} <span style={{ color: 'var(--text-light-gray)' }}>({apiConfig.modelId})</span>
              </span></div>
              <div>初始化状态: <span style={{ 
                color: apiConfig.initialized ? 'var(--brand-color)' : 'var(--error-color)'
              }}>
                {apiConfig.initialized ? '已初始化' : '未初始化'}
              </span></div>
            </div>
          </div>
        </div>
        
        {/* 中部历史卡片滚动区域 */}
        <div 
          ref={historyContainerRef}
          className="history-cards" 
          style={{
            flex: 1,
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            overflow: 'auto'
          }}
        >
          {historyCards.length > 0 ? (
            historyCards.map((card) => (
              <div 
                key={card.id} 
                className="history-card"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="card-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--text-white)',
                  fontWeight: 'bold'
                }}>
                  <span>用户输入</span>
                  <span style={{ color: 'var(--text-light-gray)', fontSize: 'var(--font-xs)' }}>
                    {formatTime(card.timestamp)}
                  </span>
                </div>
                
                <div className="input-content" style={{
                  marginBottom: 'var(--space-md)',
                  backgroundColor: 'var(--main-bg)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-white)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {card.input}
                </div>
                
                {/* JSON/API输出区域 */}
                <div className="output-section">
                  {/* 选项卡切换 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <div style={{
                      backgroundColor: 'var(--secondary-bg)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px',
                      display: 'flex'
                    }}>
                      <button
                        onClick={() => setActiveJsonTabs(prev => ({...prev, [card.id]: 'json'}))}
                        style={{
                          backgroundColor: activeJsonTabs[card.id] === 'json' ? 'var(--main-bg)' : 'transparent',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => setActiveJsonTabs(prev => ({...prev, [card.id]: 'raw'}))}
                        style={{
                          backgroundColor: activeJsonTabs[card.id] === 'raw' ? 'var(--main-bg)' : 'transparent',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        API原始响应
                      </button>
                    </div>
                    
                    <button
                      onClick={() => generateControls(editableJsons[card.id] || card.jsonOutput, card.id)}
                      style={{
                        backgroundColor: 'var(--brand-color)',
                        color: 'var(--text-dark)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-xs)'
                      }}
                    >
                      生成控件
                    </button>
                  </div>
                  
                  {/* JSON/API内容展示 */}
                  {activeJsonTabs[card.id] === 'json' ? (
                    <div>
                      <label htmlFor={`json-editor-${card.id}`} className="sr-only" style={{ display: 'none' }}>
                        JSON编辑器
                      </label>
                      <textarea
                        id={`json-editor-${card.id}`}
                        value={editableJsons[card.id] || card.jsonOutput}
                        onChange={(e) => handleJsonInputChange(e.target.value, card.id)}
                        aria-label={`编辑JSON配置卡片${card.id}`}
                        placeholder="JSON配置数据"
                        style={{
                          width: '100%',
                          height: '200px',
                          padding: 'var(--space-sm)',
                          backgroundColor: 'var(--main-bg)',
                          color: 'var(--text-white)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'monospace',
                          fontSize: 'var(--font-xs)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  ) : (
                    <pre style={{
                      width: '100%',
                      height: '200px',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--main-bg)',
                      color: 'var(--text-light-gray)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-xs)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflow: 'auto'
                    }}>
                      {card.apiRawResponse}
                    </pre>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-lg)',
              color: 'var(--text-light-gray)',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: 'var(--radius-md)'
            }}>
              <p>尚未生成任何Agent卡片，请在下方输入需求并点击"生成Agent卡片"按钮</p>
            </div>
          )}
        </div>
        
        {/* 底部输入区 - 固定吸底 */}
        <div className="input-area" style={{
          backgroundColor: 'var(--card-bg)',
          borderTop: '1px solid var(--border-color)',
          padding: 'var(--space-md)'
        }}>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="输入需求描述，例如：创建一个收集用户喜欢的动物的表单"
            style={{
              width: '100%',
              height: '80px',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              resize: 'none',
              marginBottom: 'var(--space-sm)'
            }}
          />
          
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)'
          }}>
            <button
              onClick={resetToInitialState}
              disabled={isGenerating || (!hasGenerated && historyCards.length === 0)}
              style={{
                flex: 1,
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                cursor: isGenerating || (!hasGenerated && historyCards.length === 0) ? 'not-allowed' : 'pointer',
                opacity: isGenerating || (!hasGenerated && historyCards.length === 0) ? 0.7 : 1
              }}
            >
              重置
            </button>
            
            <button
              onClick={generateAgent}
              disabled={isGenerating || !userInput.trim()}
              style={{
                flex: 1,
                backgroundColor: 'var(--brand-color)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                cursor: isGenerating || !userInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isGenerating || !userInput.trim() ? 0.7 : 1
              }}
            >
              {isGenerating ? '生成中...' : '生成Agent卡片'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 使用中间面板组件 */}
      <CardPreviewPanel 
        cards={cards}
        globalPromptBlocks={globalPromptBlocks}
        isPreview={true}
      />
      
      {/* 使用右侧面板组件 */}
      <InteractionHistoryPanel 
        interactions={interactions}
        currentPrompt={currentPrompt}
      />
    </div>
  );
};

export default AgentConfigPanel;
