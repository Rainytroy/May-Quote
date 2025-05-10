import React, { useState, useEffect } from 'react';
import { ControlDefinition } from '../Controls/DynamicControl';
import ControlsContainer from '../Controls/ControlsContainer';
import { AdminInputs, PromptBlock } from '../types';
import { usePromptTemplates } from '../contexts/PromptTemplateContext'; // 导入Context Hook
import { mayApi, MayAPI } from '../api/mayApi';

// 交互记录类型
interface InteractionEntry {
  id: number;
  timestamp: number;
  type: 'prompt' | 'response';
  content: string;
  note?: string;
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
  // 当前活动的标签页
  const [activeJsonTab, setActiveJsonTab] = useState<'json' | 'raw'>('json');
  // 生成状态
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // 解析后的控件定义
  const [controlDefinitions, setControlDefinitions] = useState<ControlDefinition[]>([]);
  // 解析后的管理员输入
  const [adminInputs, setAdminInputs] = useState<AdminInputs>({});
  // 解析后的提示词块
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([]);
  // 交互历史
  const [interactions, setInteractions] = useState<InteractionEntry[]>([]);
  // 当前处理的提示词
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  // 控件值
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  
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

  // 生成AI智能体
  const generateAgent = async () => {
    if (!userInput.trim()) {
      alert('请输入用户需求描述');
      return;
    }

    setIsGenerating(true);
    
    try {
      // 构建提示词 - 使用Context中的第一阶段模板
      const prompt = activeTemplates.firstStage.replace('{#input}', userInput);
      setCurrentPrompt(prompt);
      
      // 记录提示词
      addInteraction('prompt', prompt, '第一阶段生成提示词');
      
      // 构建userInputs，包含实际的用户输入
      const userInputsData = {
        input: userInput  // 使用实际的用户输入
      };
      
      // 调用May的AI服务
      const response = await mayApi.executeShenyuRequest({
        userInputs: userInputsData,
        adminInputs: adminInputs,
        promptBlocks: [{ text: prompt }],
        controls: controlValues // 包含控件值
      });
      
      // 记录响应
      addInteraction('response', response.result, '第一阶段响应');
      
      // 设置原始响应
      setApiRawResponse(response.result);
      
      // 提取JSON部分并格式化
      const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g;
      const matches = response.result.match(jsonRegex);
      
      if (matches && matches.length > 0) {
        const jsonStr = JSON.stringify(JSON.parse(matches[0]), null, 2);
        setJsonOutput(jsonStr);
        
        // 解析JSON
        parseJsonConfig(jsonStr);
      } else {
        setJsonOutput('未找到有效的JSON数据');
      }
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

  // 提交调整建议
  const submitAdjustment = async () => {
    if (!adjustmentInput.trim() || !jsonOutput.trim()) {
      alert('请先生成JSON并输入调整建议');
      return;
    }

    setIsGenerating(true);
    
    try {
      // 构建第二阶段提示词 - 使用Context中的第二阶段模板
      const prompt = activeTemplates.secondStage
        .replace('{#input}', adjustmentInput)
        .replace('{#promptResults1}', jsonOutput);
      
      setCurrentPrompt(prompt);
      
      // 记录提示词
      addInteraction('prompt', prompt, '第二阶段调整提示词');
      
      // 构建userInputs，包含实际的用户输入和调整建议
      const userInputsData = {
        input: userInput,
        adjustment: adjustmentInput
      };
      
      // 调用May的AI服务 - 使用与ShenyuDebugPanel一致的参数结构
      const response = await mayApi.executeShenyuRequest({
        userInputs: userInputsData,
        adminInputs: adminInputs,
        promptBlocks: [{ text: prompt }],
        controls: controlValues
      });
      
      // 记录响应
      addInteraction('response', response.result, '第二阶段响应');
      
      // 设置原始响应
      setApiRawResponse(response.result);
      
      // 提取JSON部分并格式化
      const jsonRegex = /{[\s\S]*"adminInputs"[\s\S]*"promptBlocks"[\s\S]*}/g;
      const matches = response.result.match(jsonRegex);
      
      if (matches && matches.length > 0) {
        const jsonStr = JSON.stringify(JSON.parse(matches[0]), null, 2);
        setJsonOutput(jsonStr);
        
        // 解析JSON
        parseJsonConfig(jsonStr);
      } else {
        setJsonOutput('未找到有效的JSON数据');
      }
    } catch (error) {
      console.error('提交调整建议失败:', error);
      // 增强错误信息
      let errorMessage = '调整失败: ';
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

  // 生成控件
  const generateControls = () => {
    if (!jsonOutput.trim()) {
      alert('请先生成JSON');
      return;
    }

    try {
      parseJsonConfig(jsonOutput);
    } catch (error) {
      console.error('生成控件失败:', error);
      alert(`生成控件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 解析JSON配置
  const parseJsonConfig = (jsonStr: string) => {
    try {
      const config = JSON.parse(jsonStr);
      
      // 处理多卡片结构
      if (config.cards && Array.isArray(config.cards) && config.cards.length > 0) {
        console.log('检测到多卡片结构');
        
        // 使用第一个卡片的adminInputs和promptBlocks作为预览
        const firstCard = config.cards[0];
        
        // 验证第一个卡片的结构
        if (!firstCard.adminInputs || !firstCard.promptBlocks) {
          throw new Error('卡片结构不正确，必须包含adminInputs和promptBlocks');
        }
        
        // 设置管理员输入 - 使用第一个卡片的数据
        setAdminInputs(firstCard.adminInputs);
        
        // 设置提示词块 - 使用第一个卡片的数据
        const blocks: PromptBlock[] = [];
        Object.values(firstCard.promptBlocks).forEach((text: any) => {
          blocks.push({ text: typeof text === 'string' ? text : text.text || '' });
        });
        setPromptBlocks(blocks);
        
        // 如果有全局提示词块，也添加到提示词块中
        if (config.globalPromptBlocks) {
          Object.values(config.globalPromptBlocks).forEach((text: any) => {
            blocks.push({ text: typeof text === 'string' ? text : text.text || '' });
          });
          setPromptBlocks(blocks);
        }
      }
      // 处理单卡片结构
      else if (config.adminInputs && config.promptBlocks) {
        console.log('检测到单卡片结构');
        
        // 设置管理员输入
        setAdminInputs(config.adminInputs);
        
        // 设置提示词块
        const blocks: PromptBlock[] = [];
        Object.values(config.promptBlocks).forEach((text: any) => {
          blocks.push({ text: typeof text === 'string' ? text : text.text || '' });
        });
        setPromptBlocks(blocks);
      }
      // 结构不正确
      else {
        throw new Error('JSON结构不正确，必须包含adminInputs和promptBlocks，或是包含cards数组');
      }
      
      // 从adminInputs生成控件定义
      const controls: ControlDefinition[] = [];
      
      Object.entries(config.adminInputs).forEach(([key, value]) => {
        const valueStr = String(value);
        const labelMatch = valueStr.match(/^(.*?)<def>/);
        const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
        
        const label = labelMatch ? labelMatch[1].trim() : key;
        const defaultValue = defaultMatch ? defaultMatch[1] : '';
        
        // 简单检测类型
        let type: "text" | "textarea" | "number" | "select" | "checkbox" | "radio" = "text";
        
        if (valueStr.toLowerCase().includes('选择') || valueStr.toLowerCase().includes('select')) {
          type = "select";
        } else if (valueStr.toLowerCase().includes('多行') || valueStr.toLowerCase().includes('textarea')) {
          type = "textarea";
        } else if (valueStr.toLowerCase().includes('数字') || valueStr.toLowerCase().includes('number')) {
          type = "number";
        } else if (valueStr.toLowerCase().includes('是否') || valueStr.toLowerCase().includes('checkbox')) {
          type = "checkbox";
        }
        
        const control: ControlDefinition = {
          type,
          id: key,
          label,
          defaultValue: defaultValue, // 设置默认值属性
          required: true,
          placeholder: `请输入${label}`
        };
        
        // 如果是选择类控件，添加选项
        if (type === "select" || type === "radio" as any) {
          control.options = [
            { value: defaultValue, label: defaultValue },
            { value: "选项2", label: "选项2" },
            { value: "选项3", label: "选项3" }
          ];
        }
        
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

  // 模拟API调用
  const mockApiCall = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      // 模拟延时
      setTimeout(() => {
        // 用户输入中包含"动物"时的响应
        if (userInput.includes('动物')) {
          resolve(`基于你的需求，我生成了以下JSON配置：

{
  "adminInputs": {
    "inputB1": "喜欢的动物1 <def>猫</def>",
    "inputB2": "喜欢的动物2 <def>狗</def>",
    "inputB3": "喜欢的动物3 <def>鸟</def>"
  },
  "promptBlocks": {
    "promptBlock1": "请为以下动物各推荐一个适合新手饲养的品种，并简要说明原因。\\n\\n{#inputB1}\\n{#inputB2}\\n{#inputB3}",
    "promptBlock2": "基于上述推荐，你会最推荐哪一个作为第一个宠物？请解释原因。\\n\\n{#promptBlock1}"
  }
}`);
        } 
        // 用户输入中包含"文章"时的响应
        else if (userInput.includes('文章')) {
          resolve(`根据您的需求，我生成了以下JSON配置：

{
  "adminInputs": {
    "inputB1": "文章主题 <def>人工智能的未来发展</def>",
    "inputB2": "文章风格 <def>专业且通俗易懂</def>",
    "inputB3": "字数要求 <def>1000字左右</def>",
    "inputB4": "重点关注方向 <def>技术与伦理平衡</def>"
  },
  "promptBlocks": {
    "promptBlock1": "请根据以下要求撰写一篇文章：\\n- 主题：{#inputB1}\\n- 风格：{#inputB2}\\n- 字数：{#inputB3}\\n- 重点关注：{#inputB4}\\n\\n文章应包含引言、主体论述和结论，内容要有深度且条理清晰。"
  }
}`);
        }
        // 用户输入中包含"问卷"时的响应 
        else if (userInput.includes('问卷')) {
          resolve(`根据您的需求，我生成了以下JSON配置：

{
  "adminInputs": {
    "inputB1": "问卷主题 <def>用户体验调研</def>",
    "inputB2": "问卷目的 <def>改进产品设计</def>",
    "inputB3": "目标受众 <def>产品现有用户</def>",
    "inputB4": "问题数量 <def>10个左右</def>",
    "inputB5": "问卷类型 <def>混合型(选择题+开放问题)</def>"
  },
  "promptBlocks": {
    "promptBlock1": "请根据以下信息设计一份问卷：\\n- 问卷主题：{#inputB1}\\n- 问卷目的：{#inputB2}\\n- 目标受众：{#inputB3}\\n- 问题数量：{#inputB4}\\n- 问卷类型：{#inputB5}\\n\\n设计一份专业、简洁且有效的问卷，包括必要的介绍和感谢语。"
  }
}`);
        }
        // 默认响应
        else {
          resolve(`根据您的输入"${userInput}"，我生成了以下JSON配置：

{
  "adminInputs": {
    "inputB1": "需求描述 <def>创建一个自动化工具</def>",
    "inputB2": "使用场景 <def>日常工作流程</def>",
    "inputB3": "期望功能 <def>数据处理和分析</def>",
    "inputB4": "技术限制 <def>无特殊限制</def>"
  },
  "promptBlocks": {
    "promptBlock1": "根据以下需求提供解决方案建议：\\n- 需求：{#inputB1}\\n- 场景：{#inputB2}\\n- 功能：{#inputB3}\\n- 限制：{#inputB4}\\n\\n请提供详细的建议，包括可能的实现方法、工具选择和步骤概述。"
  }
}`);
        }
      }, 2000);
    });
  };

  // 处理JSON输入变化
  const handleJsonInputChange = (value: string) => {
    setJsonOutput(value);
    
    // 清除之前解析的结果
    setControlDefinitions([]);
    setAdminInputs({});
    setPromptBlocks([]);
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="agent-config-panel" style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 左侧面板 - 输入区 */}
      <div className="left-panel" style={{
        width: '33.3%',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        borderRight: '1px solid var(--border-color)',
        overflow: 'auto'
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
        
        {/* 用户输入区 */}
        <div className="input-section">
          <label 
            htmlFor="user-input"
            style={{
              display: 'block',
              marginBottom: 'var(--space-sm)',
              color: 'var(--text-white)',
              fontWeight: 'bold'
            }}
          >
            用户输入
          </label>
          <textarea
            id="user-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="请输入需求描述，例如：创建一个收集用户喜欢的动物的表单"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--main-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical'
            }}
          />
          <button
            onClick={generateAgent}
            disabled={isGenerating || !userInput.trim()}
            style={{
              marginTop: 'var(--space-sm)',
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
        
        {/* JSON输出区域 */}
        {(jsonOutput || apiRawResponse) && (
          <div className="output-section" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-sm)'
            }}>
              <label style={{
                color: 'var(--text-white)',
                fontWeight: 'bold'
              }}>
                JSON输出
              </label>
              <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                display: 'flex'
              }}>
                <button
                  onClick={() => setActiveJsonTab('json')}
                  style={{
                    backgroundColor: activeJsonTab === 'json' ? 'var(--main-bg)' : 'transparent',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    cursor: 'pointer'
                  }}
                >
                  JSON响应
                </button>
                <button
                  onClick={() => setActiveJsonTab('raw')}
                  style={{
                    backgroundColor: activeJsonTab === 'raw' ? 'var(--main-bg)' : 'transparent',
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
            </div>
            
            {activeJsonTab === 'json' ? (
              <textarea
                value={jsonOutput}
                onChange={(e) => handleJsonInputChange(e.target.value)}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--main-bg)',
                  color: 'var(--text-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            ) : (
              <textarea
                value={apiRawResponse}
                onChange={(e) => setApiRawResponse(e.target.value)}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--main-bg)',
                  color: 'var(--text-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                readOnly
              />
            )}
            
            <button
              onClick={generateControls}
              disabled={!jsonOutput.trim()}
              style={{
                marginTop: 'var(--space-sm)',
                backgroundColor: 'var(--brand-color)',
                color: 'var(--text-dark)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                cursor: !jsonOutput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: !jsonOutput.trim() ? 0.7 : 1
              }}
            >
              生成控件
            </button>
          </div>
        )}
        
        {/* 调整建议输入 */}
        {jsonOutput && (
          <div className="adjustment-section" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)'
          }}>
            <label
              htmlFor="adjustment-input"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                color: 'var(--text-white)',
                fontWeight: 'bold'
              }}
            >
              用户输入-调整建议
            </label>
            <textarea
              id="adjustment-input"
              value={adjustmentInput}
              onChange={(e) => setAdjustmentInput(e.target.value)}
              placeholder="请输入调整建议，例如：增加更多输入字段，或者修改提示词"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--main-bg)',
                color: 'var(--text-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                resize: 'vertical'
              }}
            />
            <button
              onClick={submitAdjustment}
              disabled={isGenerating || !adjustmentInput.trim() || !jsonOutput.trim()}
              style={{
                marginTop: 'var(--space-sm)',
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                cursor: isGenerating || !adjustmentInput.trim() || !jsonOutput.trim() ? 'not-allowed' : 'pointer',
                opacity: isGenerating || !adjustmentInput.trim() || !jsonOutput.trim() ? 0.7 : 1
              }}
            >
              提交调整建议
            </button>
          </div>
        )}
      </div>
      
      {/* 中间面板 - 控件预览 */}
      <div className="middle-panel" style={{
        width: '33.3%',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        borderRight: '1px solid var(--border-color)'
      }}>
        <h2 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>控件预览</h2>
        
        {controlDefinitions.length > 0 ? (
          <div className="controls-preview" style={{
            backgroundColor: 'var(--secondary-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            flex: 1
          }}>
            <ControlsContainer
              userInputs={{}}
              adminInputs={adminInputs}
              promptBlocks={promptBlocks}
              presetControls={controlDefinitions}
              onControlValuesChange={(values) => {
                console.log('Control values:', values);
              }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'var(--text-light-gray)',
            backgroundColor: 'var(--secondary-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p>请先生成JSON并点击"生成控件"按钮</p>
          </div>
        )}
      </div>

      {/* 右侧面板 - 交互历史 */}
      <div className="right-panel" style={{
        width: '33.3%',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <h2 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>交互历史</h2>
        
        <div className="current-prompt-section" style={{
          marginBottom: 'var(--space-md)'
        }}>
          <h3 style={{ 
            color: 'var(--text-white)', 
            fontSize: 'var(--font-md)',
            marginBottom: 'var(--space-sm)'
          }}>
            当前提示词
          </h3>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-light-gray)',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            maxHeight: '150px',
            overflow: 'auto'
          }}>
            {currentPrompt || '尚未生成提示词'}
          </div>
        </div>

        <div className="interactions-section" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}>
          <h3 style={{ 
            color: 'var(--text-white)', 
            fontSize: 'var(--font-md)',
            marginBottom: 'var(--space-sm)'
          }}>
            历史记录
          </h3>
          
          {interactions.length > 0 ? (
            <div className="interactions-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              flex: 1,
              overflow: 'auto'
            }}>
              {interactions.map((entry) => (
                <div 
                  key={entry.id}
                  className={`interaction-entry ${entry.type === 'prompt' ? 'prompt' : 'response'}`}
                  style={{
                    backgroundColor: 'var(--secondary-bg)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${entry.type === 'prompt' ? 'var(--brand-color)' : 'var(--border-color)'}`
                  }}
                >
                  <div className="interaction-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-sm)',
                    color: entry.type === 'prompt' ? 'var(--brand-color)' : 'var(--text-white)',
                    fontWeight: 'bold'
                  }}>
                    <span>{entry.type === 'prompt' ? '提示词' : '响应'} {entry.note && `(${entry.note})`}</span>
                    <span style={{ color: 'var(--text-light-gray)', fontSize: 'var(--font-xs)' }}>
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <div className="interaction-content" style={{
                    color: 'var(--text-white)',
                    fontFamily: entry.type === 'prompt' ? 'monospace' : 'inherit',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflow: 'auto',
                    wordBreak: 'break-word'
                  }}>
                    {entry.content.length > 500 
                      ? `${entry.content.substring(0, 500)}... (${entry.content.length}字)` 
                      : entry.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--text-light-gray)',
              backgroundColor: 'var(--secondary-bg)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)'
            }}>
              <p>尚无交互记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPanel;
