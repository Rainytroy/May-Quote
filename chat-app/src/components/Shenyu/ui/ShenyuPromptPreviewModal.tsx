import React, { useState, useEffect } from 'react';
import { Card, GlobalPromptBlocks } from '../../SN43Demo/types';
import { processAllPrompts } from '../utils/processPrompts';

interface ShenyuPromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  globalPromptBlocks: GlobalPromptBlocks;
  controlValues: Record<string, any>;
  agentName: string;
}

/**
 * 提示词预览弹窗组件
 * 
 * 显示所有提示词块并实时替换占位符
 */
const ShenyuPromptPreviewModal: React.FC<ShenyuPromptPreviewModalProps> = ({
  isOpen,
  onClose,
  cards,
  globalPromptBlocks,
  controlValues,
  agentName
}) => {
  const [activeTab, setActiveTab] = useState<'promptBlocks' | 'replaced'>('replaced');
  const [processedPrompts, setProcessedPrompts] = useState<Array<{
    cardId: string;
    cardTitle: string;
    blockId: string;
    original: string;
    processed: string;
    replacedCount: number;
    unreplacedCount: number;
    unreplacedList: string[];
  }>>([]);
  
  const [globalProcessedPrompts, setGlobalProcessedPrompts] = useState<Array<{
    blockId: string;
    original: string;
    processed: string;
    replacedCount: number;
    unreplacedCount: number;
    unreplacedList: string[];
  }>>([]);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 处理所有提示词
  const handleProcessAllPrompts = () => {
    console.log('[ShenyuPromptPreviewModal] 处理所有提示词块');
    setIsProcessing(true);
    
    try {
      // 使用公共处理函数
      const result = processAllPrompts(
        cards,
        globalPromptBlocks,
        controlValues,
        agentName,
        ''  // 预览时不需要用户输入
      );
      
      // 将处理结果更新到状态
      const newProcessedPrompts = result.cardBlocks.map(block => ({
        cardId: block.cardId,
        cardTitle: block.cardTitle,
        blockId: block.blockId,
        original: block.original,
        processed: block.processed,
        replacedCount: block.replacedCount,
        unreplacedCount: block.unreplacedCount,
        unreplacedList: block.unreplacedList
      }));
      
      const newGlobalProcessedPrompts = result.globalBlocks.map(block => ({
        blockId: block.blockId,
        original: block.original,
        processed: block.processed,
        replacedCount: block.replacedCount,
        unreplacedCount: block.unreplacedCount,
        unreplacedList: block.unreplacedList
      }));
      
      setProcessedPrompts(newProcessedPrompts);
      setGlobalProcessedPrompts(newGlobalProcessedPrompts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[ShenyuPromptPreviewModal] 处理提示词时出错:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 初始加载和弹窗打开时处理提示词
  useEffect(() => {
    if (isOpen) {
      handleProcessAllPrompts();
    }
  }, [isOpen, cards, globalPromptBlocks, controlValues, agentName]);
  
  // 当弹窗不开启时，不渲染内容，提高性能
  if (!isOpen) return null;
  
  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // 高亮显示替换和未替换的占位符
  const highlightText = (text: string) => {
    const placeholderPattern = /(\{#[^}]+\})/g;
    const parts = text.split(placeholderPattern);
    
    return parts.map((part, index) => {
      if (part.match(placeholderPattern)) {
        return (
          <span key={index} style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.2)', 
            color: '#ff6b6b',
            padding: '0 2px',
            borderRadius: '2px'
          }}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '900px',
        height: '80vh',
        backgroundColor: 'var(--main-bg)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 弹窗标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--secondary-bg)'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-lg)', color: 'var(--text-white)' }}>
            提示词预览 - {agentName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{ 
              color: 'var(--text-light-gray)', 
              fontSize: 'var(--font-xs)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: 'var(--space-xs)' }}>最后更新:</span>
              <span>{formatTime(lastUpdated)}</span>
            </div>
            <button 
              onClick={handleProcessAllPrompts}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-sm)'
              }}
            >
              {isProcessing ? '处理中...' : '刷新'}
            </button>
            <button 
              onClick={onClose}
              aria-label="关闭"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-white)',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-xs)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* 切换标签栏 */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--card-bg)'
        }}>
          <div
            onClick={() => setActiveTab('replaced')}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer',
              fontWeight: activeTab === 'replaced' ? 'bold' : 'normal',
              color: activeTab === 'replaced' ? 'var(--text-white)' : 'var(--text-light-gray)',
              borderBottom: activeTab === 'replaced' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeTab === 'replaced' ? 'var(--main-bg)' : 'transparent'
            }}
          >
            替换后内容
          </div>
          <div
            onClick={() => setActiveTab('promptBlocks')}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer',
              fontWeight: activeTab === 'promptBlocks' ? 'bold' : 'normal',
              color: activeTab === 'promptBlocks' ? 'var(--text-white)' : 'var(--text-light-gray)',
              borderBottom: activeTab === 'promptBlocks' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeTab === 'promptBlocks' ? 'var(--main-bg)' : 'transparent'
            }}
          >
            原始提示词
          </div>
        </div>
        
        {/* 内容区域 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-md)',
        }}>
          {isProcessing ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text-light-gray)'
            }}>
              处理提示词中，请稍候...
            </div>
          ) : (
            <>
              {/* 卡片提示词块 */}
              {cards.map((card, cardIndex) => (
                <div key={card.id} style={{ marginBottom: 'var(--space-md)' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: 'var(--text-white)', 
                    marginBottom: 'var(--space-sm)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    backgroundColor: 'var(--secondary-bg)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {cardIndex + 1}. {card.title} ({card.id})
                  </div>
                  
                  {/* 卡片提示词块列表 */}
                  <div style={{ marginLeft: 'var(--space-md)' }}>
                    {Object.entries(card.promptBlocks).map(([blockId, text], blockIndex) => {
                      const processedBlock = processedPrompts.find(p => 
                        p.cardId === card.id && p.blockId === blockId
                      );
                      
                      if (!processedBlock) return null;
                      
                      return (
                        <div key={blockId} style={{ 
                          marginBottom: 'var(--space-md)',
                          padding: 'var(--space-sm)',
                          backgroundColor: 'var(--card-bg)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--brand-color)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-xs)',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: 'var(--space-xs)',
                            color: 'var(--text-white)',
                            fontSize: 'var(--font-sm)'
                          }}>
                            <div>
                              <strong>{blockId}</strong>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              gap: 'var(--space-sm)',
                              color: 'var(--text-light-gray)',
                              fontSize: 'var(--font-xs)'
                            }}>
                              <span style={{ color: 'var(--success-color)' }}>
                                替换: {processedBlock.replacedCount}
                              </span>
                              {processedBlock.unreplacedCount > 0 && (
                                <span style={{ color: 'var(--error-color)' }}>
                                  未替换: {processedBlock.unreplacedCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ 
                            backgroundColor: 'var(--main-bg)', 
                            padding: 'var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-white)',
                            whiteSpace: 'pre-wrap',
                            overflowX: 'auto',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {activeTab === 'promptBlocks' ? (
                              processedBlock.original
                            ) : (
                              <>
                                {processedBlock.unreplacedCount > 0 
                                  ? highlightText(processedBlock.processed)
                                  : processedBlock.processed
                                }
                                
                                {processedBlock.unreplacedCount > 0 && (
                                  <div style={{ 
                                    marginTop: 'var(--space-sm)',
                                    padding: 'var(--space-xs)',
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                    border: '1px solid var(--error-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 'var(--font-xs)',
                                    color: 'var(--error-color)'
                                  }}>
                                    <strong>未替换的占位符:</strong> {processedBlock.unreplacedList.join(', ')}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* 全局提示词块 - 如果存在 */}
              {Object.keys(globalPromptBlocks).length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: 'var(--text-white)', 
                    marginBottom: 'var(--space-sm)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    backgroundColor: 'var(--secondary-bg)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    全局提示词块
                  </div>
                  
                  {/* 全局提示词块列表 */}
                  <div style={{ marginLeft: 'var(--space-md)' }}>
                    {Object.entries(globalPromptBlocks).map(([blockId, text]) => {
                      const processedBlock = globalProcessedPrompts.find(p => p.blockId === blockId);
                      
                      if (!processedBlock) return null;
                      
                      return (
                        <div key={blockId} style={{ 
                          marginBottom: 'var(--space-md)',
                          padding: 'var(--space-sm)',
                          backgroundColor: 'var(--card-bg)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid #8e44ad' // 紫色，区别于卡片提示词
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-xs)',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: 'var(--space-xs)',
                            color: 'var(--text-white)',
                            fontSize: 'var(--font-sm)'
                          }}>
                            <div>
                              <strong>{blockId}</strong>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              gap: 'var(--space-sm)',
                              color: 'var(--text-light-gray)',
                              fontSize: 'var(--font-xs)'
                            }}>
                              <span style={{ color: 'var(--success-color)' }}>
                                替换: {processedBlock.replacedCount}
                              </span>
                              {processedBlock.unreplacedCount > 0 && (
                                <span style={{ color: 'var(--error-color)' }}>
                                  未替换: {processedBlock.unreplacedCount}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ 
                            backgroundColor: 'var(--main-bg)', 
                            padding: 'var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-white)',
                            whiteSpace: 'pre-wrap',
                            overflowX: 'auto',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {activeTab === 'promptBlocks' ? (
                              processedBlock.original
                            ) : (
                              <>
                                {processedBlock.unreplacedCount > 0 
                                  ? highlightText(processedBlock.processed)
                                  : processedBlock.processed
                                }
                                
                                {processedBlock.unreplacedCount > 0 && (
                                  <div style={{ 
                                    marginTop: 'var(--space-sm)',
                                    padding: 'var(--space-xs)',
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                    border: '1px solid var(--error-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 'var(--font-xs)',
                                    color: 'var(--error-color)'
                                  }}>
                                    <strong>未替换的占位符:</strong> {processedBlock.unreplacedList.join(', ')}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* 如果没有提示词块 */}
              {processedPrompts.length === 0 && Object.keys(globalPromptBlocks).length === 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'var(--text-light-gray)',
                  fontStyle: 'italic'
                }}>
                  没有找到提示词块。请先生成Agent或添加提示词块。
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 底部按钮区 */}
        <div style={{
          padding: 'var(--space-md)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShenyuPromptPreviewModal;
