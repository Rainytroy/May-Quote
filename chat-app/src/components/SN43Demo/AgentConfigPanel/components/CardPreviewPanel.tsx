import React from 'react';
import { Card, GlobalPromptBlocks } from '../../types';
import MultiCardView from '../../MultiCardView';

interface CardPreviewPanelProps {
  cards: Card[];
  globalPromptBlocks: GlobalPromptBlocks;
  isPreview?: boolean;
}

/**
 * 卡片预览面板组件
 * 
 * 负责展示多卡片预览，从主组件中提取
 */
const CardPreviewPanel: React.FC<CardPreviewPanelProps> = ({ 
  cards, 
  globalPromptBlocks,
  isPreview = true
}) => {
  return (
    <>
      {cards.length > 0 ? (
        <div className="cards-preview" style={{
          backgroundColor: 'var(--secondary-bg)',
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          height: '100%',
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
    </>
  );
};

export default CardPreviewPanel;
