import React, { useState } from 'react';
import { Card, GlobalPromptBlocks } from '../../types';
import MultiCardView from '../../MultiCardView';
import PromptPreviewModal from './PromptPreviewModal';
import { usePromptExecutor } from '../hooks/usePromptExecutor';
import { ShenyuChatInterfaceHandle } from '../../Chat/ShenyuChatInterface';
import { processAllPrompts, ProcessedPromptBlock } from '../../utils/processPrompts'; // Import processAllPrompts
import '../../styles/animations.css';

interface CardPreviewPanelProps {
  cards: Card[];
  globalPromptBlocks: GlobalPromptBlocks;
  isPreview?: boolean;
  agentName: string;
  onAgentNameChange: (name: string) => void;
  onRunAgent?: () => void; // 可选，兼容旧接口
  controlValues: Record<string, any>;
  chatInterfaceRef?: React.RefObject<ShenyuChatInterfaceHandle | null>;
  userInput?: string;
}

/**
 * 卡片预览面板组件
 * 
 * 负责展示多卡片预览，从主组件中提取
 */
const CardPreviewPanel: React.FC<CardPreviewPanelProps> = ({ 
  cards, 
  globalPromptBlocks,
  isPreview = true,
  agentName,
  onAgentNameChange,
  onRunAgent,
  controlValues,
  chatInterfaceRef,
  userInput = ''
}) => {
  // 使用提示词执行器，实现新的运行按钮功能
  const { executePrompts, isRunning } = usePromptExecutor({
    chatInterfaceRef,
    agentName
    // cards, globalPromptBlocks, controlValues, userInput are no longer passed here
  });

  // 运行按钮点击处理
  const handleRunClick = async () => {
    if (cards.length === 0 || !chatInterfaceRef?.current) {
      console.warn('[CardPreviewPanel] 无法运行: 无卡片或聊天界面引用未初始化');
      return;
    }
    
    console.log('[CardPreviewPanel] "运行"按钮点击，开始处理...');

    // 1. 从DOM获取最新的控件值 (与handleViewPrompt类似)
    const inputElements = document.querySelectorAll('input, textarea, select');
    const currentControlValues: Record<string, any> = {};
    inputElements.forEach(el => {
      const id = el.id || el.getAttribute('data-id');
      if (id) {
        let value;
        if (el.tagName === 'SELECT') value = (el as HTMLSelectElement).value;
        else if ((el as HTMLInputElement).type === 'checkbox') value = (el as HTMLInputElement).checked;
        else value = (el as HTMLInputElement | HTMLTextAreaElement).value;
        currentControlValues[id] = value;
        if (id.match(/^B[0-9]+$/)) {
          currentControlValues[`input${id}`] = value;
        }
      }
    });
    console.log('[CardPreviewPanel] 运行时获取的实时控件值:', currentControlValues);

    // 2. 调用 processAllPrompts 获取完全替换后的提示词
    console.log('[CardPreviewPanel] 调用 processAllPrompts 进行替换...');
    const processedResults = processAllPrompts(
      cards,
      globalPromptBlocks,
      currentControlValues, // 使用实时获取的控件值
      agentName,
      userInput
    );
    
    console.log('[CardPreviewPanel] processAllPrompts 完成，结果:', processedResults);

    // 3. 将替换结果传递给 executePrompts
    if (processedResults.cardBlocks.length > 0 || processedResults.globalBlocks.length > 0) {
      console.log('[CardPreviewPanel] 调用 executePrompts 执行处理后的提示词...');
      // We'll adjust executePrompts to accept this structure
      await executePrompts(processedResults); 
    } else {
      console.warn('[CardPreviewPanel] processAllPrompts 未返回任何可执行的提示词块');
    }
  };
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(agentName);
  const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(false);
  const [domControlValues, setDomControlValues] = useState<Record<string, any>>({});
  
  // 处理名称编辑完成
  const handleNameEditComplete = () => {
    onAgentNameChange(nameInputValue);
    setIsEditingName(false);
  };
  
  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameEditComplete();
    } else if (e.key === 'Escape') {
      setNameInputValue(agentName); // 重置为原始值
      setIsEditingName(false);
    }
  };
  
  // 处理查看提示词按钮点击
  const handleViewPrompt = () => {
    // 从DOM查询所有输入元素
    const inputElements = document.querySelectorAll('input, textarea, select');
    const newControlValues: Record<string, any> = {};
    
    console.log(`[CardPreviewPanel] 从DOM中查询输入元素，找到 ${inputElements.length} 个元素`);
    
    // 查询提示词块列表
    const promptBlockElements = document.querySelectorAll('.prompt-block-content');
    console.log(`[CardPreviewPanel] 从DOM中查询提示词块，找到 ${promptBlockElements.length} 个元素`);
    
    // 遍历所有输入元素，提取ID和值
    inputElements.forEach(el => {
      // 优先查找id属性，其次查找data-id属性
      const id = el.id || el.getAttribute('data-id');
      
      if (id) {
        // 根据元素类型获取值
        let value;
        if (el.tagName === 'SELECT') {
          value = (el as HTMLSelectElement).value;
        } else if ((el as HTMLInputElement).type === 'checkbox') {
          value = (el as HTMLInputElement).checked;
        } else {
          value = (el as HTMLInputElement | HTMLTextAreaElement).value;
        }
        
        // 不限制ID格式，只要有ID就收集值
        newControlValues[id] = value;
        console.log(`[CardPreviewPanel] 提取到控件: ${id} = ${value}`);
        
        // 同时对inputB格式进行特殊处理
        if (id.match(/^inputB[0-9]+$/)) {
          console.log(`[CardPreviewPanel] 符合多卡片系统提示词构建指南格式的控件: ${id}`);
        } else if (id.match(/^B[0-9]+$/)) {
          // 自动添加inputB前缀
          const prefixedId = `input${id}`;
          newControlValues[prefixedId] = value;
          console.log(`[CardPreviewPanel] 转换B控件为inputB格式: ${id} -> ${prefixedId} = ${value}`);
        }
      }
    });
    
    // 输出详细诊断信息
    console.log('=== 输入控件诊断信息 ===');
    console.log(`找到输入元素: ${inputElements.length}个`);
    console.log(`找到提示词块: ${promptBlockElements.length}个`);
    console.log(`收集的控件值数量: ${Object.keys(newControlValues).length}个`);
    console.log('收集的控件ID:', Object.keys(newControlValues));
    console.log('收集的控件值:', newControlValues);
    console.log('提示词块内容示例:');
    
    // 输出提示词块内容示例，帮助调试
    promptBlockElements.forEach((el, index) => {
      if (index < 3) { // 限制只输出前3个以避免日志过长
        const id = el.id || el.getAttribute('data-prompt-id');
        const cardId = el.getAttribute('data-card-id');
        const text = el.textContent || '';
        console.log(`提示词块 ${index + 1}: ID=${id}, 卡片=${cardId}, 内容示例: ${text.substring(0, 50)}...`);
        
        // 查找占位符并输出
        const placeholders = text.match(/\{#[^}]+\}/g) || [];
        if (placeholders.length > 0) {
          console.log(`  包含${placeholders.length}个占位符:`, placeholders);
        }
      }
    });
    
    // 保存收集到的值并打开弹窗
    setDomControlValues(newControlValues);
    setIsPromptPreviewOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 吸顶工具栏 */}
      <div className="toolbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-sm) var(--space-md)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Agent名称 - 可编辑 */}
        <div className="agent-name" style={{ display: 'flex', alignItems: 'center' }}>
          {isEditingName ? (
            <input
              value={nameInputValue}
              onChange={(e) => setNameInputValue(e.target.value)}
              onBlur={handleNameEditComplete}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="输入Agent名称"
              aria-label="Agent名称"
              style={{
                background: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: '1px solid var(--brand-color)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                fontSize: 'var(--font-md)',
                maxWidth: '280px'
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                color: 'var(--text-white)'
              }}
            >
              <span>{agentName}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ marginLeft: 'var(--space-xs)', opacity: 0.7 }}
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {/* 查看提示词按钮 */}
          <button
            onClick={handleViewPrompt}
            disabled={cards.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              backgroundColor: cards.length > 0 ? 'var(--secondary-bg)' : 'var(--text-light-gray)',
              color: 'var(--text-white)',
              border: cards.length > 0 ? '1px solid var(--border-color)' : 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-md)',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
            }}
          >
            {/* 眼睛图标 */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            查看提示词
          </button>
          
          {/* 运行按钮 */}
          <button
            onClick={handleRunClick}
            disabled={cards.length === 0 || isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              backgroundColor: cards.length > 0 && !isRunning ? 'var(--brand-color)' : 'var(--text-light-gray)',
              color: 'var(--text-dark)',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-md)',
              cursor: cards.length > 0 && !isRunning ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
            }}
            title="May the 神谕 be with you"
          >
            {/* 根据运行状态显示不同图标 */}
            {isRunning ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="spin-animation"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            {isRunning ? '运行中...' : '运行'}
          </button>
        </div>
      </div>
      
      {/* 卡片内容区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {cards.length > 0 ? (
          <div className="cards-preview" style={{
            backgroundColor: 'var(--secondary-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            height: 'calc(100% - var(--space-md) * 2)',
            overflow: 'auto'
          }}>
            <MultiCardView 
              cards={cards}
              globalPromptBlocks={globalPromptBlocks}
              isPreview={isPreview}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-light-gray)',
            backgroundColor: 'var(--secondary-bg)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p>请先生成Agent卡片</p>
          </div>
        )}
      </div>
      
      {/* 提示词预览弹窗 */}
      <PromptPreviewModal 
        isOpen={isPromptPreviewOpen}
        onClose={() => setIsPromptPreviewOpen(false)}
        cards={cards}
        globalPromptBlocks={globalPromptBlocks}
        controlValues={domControlValues}
        agentName={agentName}
      />
    </div>
  );
};

export default CardPreviewPanel;
