import React, { useState, useEffect } from 'react';
import { Card, GlobalPromptBlocks } from '../../SN43Demo/types';
import { extractJsonStructureInfo } from '../utils/shenyuSystemPrompt';
import ShenyuPromptPreviewModal from './ShenyuPromptPreviewModal';

interface ShenyuCardViewProps {
  jsonContent?: string;
  className?: string;
}

/**
 * 神谕卡片视图组件
 * 
 * 用于在神谕标签页中显示JSON卡片和提示词块，复用SN43Demo中的卡片UI渲染逻辑
 */
const ShenyuCardView: React.FC<ShenyuCardViewProps> = ({ 
  jsonContent = '',
  className
}) => {
  // 解析后的卡片和全局提示词块
  const [cards, setCards] = useState<Card[]>([]);
  const [globalPromptBlocks, setGlobalPromptBlocks] = useState<GlobalPromptBlocks>({});
  const [configName, setConfigName] = useState<string>('神谕卡片');
  
  // 提示词预览弹窗状态
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  
  // 监听标题栏中的"查看提示词"和"运行"按钮点击事件
  useEffect(() => {
    // 查看提示词事件处理函数
    const handleViewPrompt = () => {
      console.log('[ShenyuCardView] 接收到查看提示词事件');
      setShowPromptPreview(true);
    };
    
    // 运行事件处理函数
    const handleRun = () => {
      console.log('[ShenyuCardView] 接收到运行事件');
      // TODO: 实现运行功能
    };
    
    // 添加事件监听
    window.addEventListener('shenyu-view-prompt', handleViewPrompt);
    window.addEventListener('shenyu-run', handleRun);
    
    // 组件卸载时清除事件监听
    return () => {
      window.removeEventListener('shenyu-view-prompt', handleViewPrompt);
      window.removeEventListener('shenyu-run', handleRun);
    };
  }, []);
  
  // 保存每个提示词块的折叠状态
  const [collapsedPrompts, setCollapsedPrompts] = useState<Record<string, boolean>>({});
  
  // 在JSON内容变化时重新解析 - 简化版
  useEffect(() => {
    console.log('[ShenyuCardView] jsonContent发生变化，长度:', jsonContent ? jsonContent.length : 0);
    
    // 处理空内容情况
    if (!jsonContent) {
      console.log('[ShenyuCardView] jsonContent为空，重置卡片');
      setCards([]);
      setGlobalPromptBlocks({});
      return;
    }
    
    try {
      // 尝试直接解析JSON
      const parsedJson = JSON.parse(jsonContent);
      console.log('[ShenyuCardView] 成功解析JSON');
      
      // 设置卡片
      const cardsArray = Array.isArray(parsedJson.cards) ? parsedJson.cards : [];
      setCards(cardsArray);
      
      // 设置全局提示词块
      const globalBlocks = parsedJson.globalPromptBlocks && typeof parsedJson.globalPromptBlocks === 'object' ? 
        parsedJson.globalPromptBlocks : {};
      setGlobalPromptBlocks(globalBlocks);
      
      // 设置配置名称
      const name = parsedJson.name && typeof parsedJson.name === 'string' ? 
        parsedJson.name : '神谕卡片';
      setConfigName(name);
      
    } catch (error) {
      console.error('[ShenyuCardView] 解析JSON失败，重置卡片');
      setCards([]);
      setGlobalPromptBlocks({});
    }
  }, [jsonContent]);
  
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
    <div className={`shenyu-card-view ${className || ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* 注意：移除了独立工具栏，将按钮移至内容区域 */}

      {/* 提示词预览弹窗 */}
      <ShenyuPromptPreviewModal 
        isOpen={showPromptPreview}
        onClose={() => setShowPromptPreview(false)}
        cards={cards}
        globalPromptBlocks={globalPromptBlocks}
        controlValues={
          // 从卡片的adminInputs中提取控件值
          cards.reduce((values, card) => {
            if (card && card.adminInputs) {
              Object.entries(card.adminInputs).forEach(([key, value]) => {
                // 提取默认值
                const valueStr = String(value || '');
                const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
                const defaultValue = defaultMatch ? defaultMatch[1] : '';
                
                values[key] = defaultValue;
              });
            }
            return values;
          }, {} as Record<string, any>)
        }
        agentName={configName}
      />
      
      {/* 内容区域 - 卡片和提示词块 */}
      <div className="shenyu-content" style={{
        flex: 1,
        overflow: 'auto',
        padding: 'var(--space-md)',
      }}>
        {/* 卡片列表 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-lg)',
          width: '100%'
        }}>
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
                          <div style={{
                            backgroundColor: 'var(--main-bg)',
                            color: 'var(--text-white)',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-sm)',
                            width: '100%',
                            border: '1px solid var(--border-color)',
                            fontSize: 'var(--font-sm)'
                          }}>
                            {defaultValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 提示词块列表 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-lg)',
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
                  <div 
                    className="prompt-block-content"
                    style={{
                      padding: 'var(--space-md)',
                      color: 'var(--text-white)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {promptText}
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* 展示全局提示词块 */}
          {Object.entries(globalPromptBlocks).map(([promptId, promptText]) => (
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
                <div 
                  className="prompt-block-content global"
                  style={{
                    padding: 'var(--space-md)',
                    color: 'var(--text-white)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {promptText}
                </div>
              )}
            </div>
          ))}
        </div>

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
              当前没有神谕卡片数据，请先发送神谕消息
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShenyuCardView;
