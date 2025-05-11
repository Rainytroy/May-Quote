import React, { useState } from 'react';
import { Card, GlobalPromptBlocks } from './types';

interface MultiCardViewProps {
  cards: Card[];
  globalPromptBlocks?: GlobalPromptBlocks;
  isPreview?: boolean;
}

/**
 * 多卡片视图组件
 * 负责渲染多卡片结构，支持卡片依次罗列展示
 */
const MultiCardView: React.FC<MultiCardViewProps> = ({ 
  cards, 
  globalPromptBlocks,
  isPreview = false
}) => {
  // 保存每个提示词块的折叠状态
  const [collapsedPrompts, setCollapsedPrompts] = useState<Record<string, boolean>>({});
  
  // 切换提示词块的折叠状态
  const togglePromptCollapse = (cardId: string, promptId: string) => {
    const key = `${cardId}-${promptId}`;
    setCollapsedPrompts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // 检查提示词块是否折叠
  const isPromptCollapsed = (cardId: string, promptId: string) => {
    const key = `${cardId}-${promptId}`;
    // 默认是折叠状态
    return collapsedPrompts[key] !== false;
  };
  return (
    <div className="multi-card-view" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      width: '100%'
    }}>
      {/* 卡片列表 */}
      {cards.map((card, index) => (
        <div 
          key={card.id || index} 
          className="card-container"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* 卡片标题 */}
          <div className="card-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-md)',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: 'var(--space-sm)'
          }}>
            <h3 style={{ 
              margin: 0, 
              color: 'var(--text-white)',
              fontSize: 'var(--font-md)',
              fontWeight: 'bold'
            }}>
              {card.title || `卡片 #${index + 1}`}
            </h3>
            <div style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              fontSize: 'var(--font-xs)',
              fontWeight: 'bold',
              padding: '2px var(--space-xs)',
              borderRadius: 'var(--radius-sm)'
            }}>
              {card.id}
            </div>
          </div>

          {/* 卡片内容 */}
          <div className="card-content" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            {/* 管理员输入区域 - 始终显示 */}
            <div className="card-admin-inputs">
              <h4 style={{ 
                margin: '0 0 var(--space-sm) 0', 
                color: 'var(--text-white)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'bold'
              }}>
                输入字段
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)'
              }}>
                {card.adminInputs && Object.entries(card.adminInputs).map(([key, value]) => {
                  // 提取描述性标签（<def>前的部分）
                  const valueStr = String(value || '');
                  const labelText = valueStr.split(/<def>/)[0].trim();
                  const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
                  const defaultValue = defaultMatch ? defaultMatch[1] : '';
                  
                  return (
                    <div 
                      key={key} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)'
                      }}
                    >
                      <div style={{
                        color: 'var(--text-light-gray)',
                        minWidth: '120px',
                        whiteSpace: 'nowrap'
                      }}>
                        {labelText || key}:
                      </div>
                      <input
                        type="text"
                        defaultValue={defaultValue}
                        placeholder={`请输入${labelText || key}的值`}
                        style={{
                          backgroundColor: 'var(--main-bg)',
                          color: 'var(--text-white)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          borderRadius: 'var(--radius-sm)',
                          width: '100%',
                          border: '1px solid var(--border-color)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* 提示词块列表 */}
      <div className="prompt-blocks-section" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <h2 style={{ 
          color: 'var(--text-white)', 
          fontSize: 'var(--font-md)',
          margin: '0 0 var(--space-sm) 0'
        }}>
          提示词块
        </h2>
        
        {cards.map(card => 
          card.promptBlocks && Object.entries(card.promptBlocks).map(([promptId, promptText]) => (
            <div 
              key={`${card.id}-${promptId}`} 
              className="prompt-block-item"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}
            >
              {/* 提示词块标题栏 - 可点击切换折叠状态 */}
              <div 
                onClick={() => togglePromptCollapse(card.id, promptId)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--secondary-bg)',
                  cursor: 'pointer',
                  borderBottom: isPromptCollapsed(card.id, promptId) ? 'none' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}>
                  <span style={{ 
                    color: 'var(--brand-color)',
                    fontWeight: 'bold'
                  }}>
                    {promptId}
                  </span>
                  <span style={{ 
                    color: 'var(--text-light-gray)',
                    fontSize: 'var(--font-xs)'
                  }}>
                    卡片: {card.id}
                  </span>
                </div>
                <div style={{
                  color: 'var(--text-light-gray)',
                  fontSize: 'var(--font-xs)'
                }}>
                  {isPromptCollapsed(card.id, promptId) ? '▼ 展开' : '▲ 折叠'}
                </div>
              </div>
              
              {/* 提示词块内容 - 仅在展开状态显示 */}
              {!isPromptCollapsed(card.id, promptId) && (
                <div style={{
                  padding: 'var(--space-md)',
                  color: 'var(--text-white)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {promptText}
                </div>
              )}
            </div>
          ))
        )}
        
        {/* 展示全局提示词块 */}
        {globalPromptBlocks && Object.entries(globalPromptBlocks).map(([promptId, promptText]) => (
          <div 
            key={`global-${promptId}`} 
            className="prompt-block-item"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid var(--brand-color)',
              overflow: 'hidden'
            }}
          >
            {/* 全局提示词块标题栏 - 可点击切换折叠状态 */}
            <div 
              onClick={() => togglePromptCollapse('global', promptId)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--secondary-bg)',
                cursor: 'pointer',
                borderBottom: isPromptCollapsed('global', promptId) ? 'none' : '1px solid var(--border-color)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <span style={{ 
                  color: 'var(--brand-color)',
                  fontWeight: 'bold'
                }}>
                  {promptId}
                </span>
                <span style={{ 
                  color: 'var(--text-light-gray)',
                  fontSize: 'var(--font-xs)'
                }}>
                  全局提示词
                </span>
              </div>
              <div style={{
                color: 'var(--text-light-gray)',
                fontSize: 'var(--font-xs)'
              }}>
                {isPromptCollapsed('global', promptId) ? '▼ 展开' : '▲ 折叠'}
              </div>
            </div>
            
            {/* 全局提示词块内容 - 仅在展开状态显示 */}
            {!isPromptCollapsed('global', promptId) && (
              <div style={{
                padding: 'var(--space-md)',
                color: 'var(--text-white)',
                whiteSpace: 'pre-wrap'
              }}>
                {promptText}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 移除重复的卡片渲染 - 已在上方显示 */}

      {/* 空状态提示 */}
      {cards.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-xl)',
          color: 'var(--text-light-gray)',
          backgroundColor: 'var(--main-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)'
        }}>
          <div style={{ 
            fontSize: 'var(--font-lg)', 
            marginBottom: 'var(--space-md)',
            opacity: 0.5
          }}>
            ✨
          </div>
          <div>
            通过提示词生成多卡片结构，卡片将会在这里依次显示
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCardView;
