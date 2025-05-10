import React from 'react';
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
            {/* 管理员输入区域 */}
            {!isPreview && (
              <div className="card-admin-inputs">
                <h4 style={{ 
                  margin: '0 0 var(--space-sm) 0', 
                  color: 'var(--text-white)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'bold'
                }}>
                  管理员配置
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)'
                }}>
                  {Object.entries(card.adminInputs).map(([key, value]) => (
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
                        {key}:
                      </div>
                      <div style={{
                        backgroundColor: 'var(--main-bg)',
                        color: 'var(--text-white)',
                        padding: 'var(--space-xs) var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        width: '100%',
                        border: '1px solid var(--border-color)'
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 提示词块 */}
            <div className="card-prompt-blocks">
              <h4 style={{ 
                margin: '0 0 var(--space-sm) 0', 
                color: 'var(--text-white)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'bold'
              }}>
                提示词块
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)'
              }}>
                {Object.entries(card.promptBlocks).map(([key, value]) => (
                  <div 
                    key={key} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-xs)'
                    }}
                  >
                    <div style={{
                      color: 'var(--brand-color)',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 'bold'
                    }}>
                      {key}
                    </div>
                    <div style={{
                      backgroundColor: 'var(--main-bg)',
                      color: 'var(--text-white)',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'pre-wrap',
                      minHeight: '80px'
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 全局提示词块 */}
      {globalPromptBlocks && Object.keys(globalPromptBlocks).length > 0 && (
        <div 
          className="global-prompt-blocks"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--brand-color)'
          }}
        >
          <h3 style={{ 
            margin: '0 0 var(--space-md) 0', 
            color: 'var(--text-white)',
            fontSize: 'var(--font-md)',
            fontWeight: 'bold'
          }}>
            全局提示词块
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            {Object.entries(globalPromptBlocks).map(([key, value]) => (
              <div 
                key={key} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)'
                }}
              >
                <div style={{
                  color: 'var(--brand-color)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{key}</span>
                  <span style={{color: 'var(--text-light-gray)'}}>全局</span>
                </div>
                <div style={{
                  backgroundColor: 'var(--main-bg)',
                  color: 'var(--text-white)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-wrap',
                  minHeight: '80px'
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
