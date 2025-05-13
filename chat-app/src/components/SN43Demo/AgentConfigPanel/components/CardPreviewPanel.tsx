import React, { useState } from 'react';
import { Card, GlobalPromptBlocks } from '../../types';
import MultiCardView from '../../MultiCardView';

interface CardPreviewPanelProps {
  cards: Card[];
  globalPromptBlocks: GlobalPromptBlocks;
  isPreview?: boolean;
  agentName: string;
  onAgentNameChange: (name: string) => void;
  onRunAgent: () => void;
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
  onRunAgent
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(agentName);
  
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
        
        {/* 运行按钮 */}
        <button
          onClick={onRunAgent}
          disabled={cards.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            backgroundColor: cards.length > 0 ? 'var(--brand-color)' : 'var(--text-light-gray)',
            color: 'var(--text-dark)',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-xs) var(--space-md)',
            cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s',
          }}
        >
          {/* 播放图标 */}
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
          运行
        </button>
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
    </div>
  );
};

export default CardPreviewPanel;
