import React, { useState, useEffect, useRef } from 'react';
import { Card, GlobalPromptBlocks } from '../../SN43Demo/types';
import { extractJsonStructureInfo } from '../utils/shenyuSystemPrompt';
import ShenyuPromptPreviewModal from './ShenyuPromptPreviewModal';
import { getActiveConversationId } from '../../../utils/db';
import { executeShenyuAgent } from '../core/ShenyuExecutionService';

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
  
  // 存储用户修改的输入值
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // 监听标题栏中的"查看提示词"和"运行"按钮点击事件
  useEffect(() => {
    // 查看提示词事件处理函数
    const handleViewPrompt = () => {
      console.log('[ShenyuCardView] 接收到查看提示词事件');
      setShowPromptPreview(true);
    };
    
    // 运行事件处理函数
    const handleRun = async () => {
      console.log('[ShenyuCardView] 接收到运行事件');
      console.log('[ShenyuCardView] 当前状态:', {
        cardsCount: cards.length,
        hasGlobalPromptBlocks: Object.keys(globalPromptBlocks).length > 0,
        configName
      });
      
      try {
        // 获取当前活动对话ID
        const activeConversationId = await getActiveConversationId();
        if (!activeConversationId) {
          console.error('[ShenyuCardView] 无法获取当前对话ID');
          alert('无法获取当前对话ID，请确保至少有一个活动对话');
          return;
        }
        
        // 调用神谕执行服务，传入用户修改的输入值
        const success = await executeShenyuAgent(
          cards,
          globalPromptBlocks,
          configName,
          activeConversationId,
          inputValues // 传入用户修改的输入值
        );
        
        if (success) {
          console.log('[ShenyuCardView] 神谕执行完成');
        } else {
          console.error('[ShenyuCardView] 神谕执行失败');
          alert('神谕执行失败，请查看控制台了解详情');
        }
      } catch (error) {
        console.error('[ShenyuCardView] 执行出错:', error);
        alert(`执行出错: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    // 添加事件监听
    window.addEventListener('shenyu-view-prompt', handleViewPrompt);
    window.addEventListener('shenyu-run', handleRun);
    
    // 组件卸载时清除事件监听
    return () => {
      window.removeEventListener('shenyu-view-prompt', handleViewPrompt);
      window.removeEventListener('shenyu-run', handleRun);
    };
  }, [cards, globalPromptBlocks, configName, inputValues]); // 添加inputValues到依赖数组，确保捕获最新值
  
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
      
      // 发送卡片状态变化事件，通知工具栏禁用按钮
      window.dispatchEvent(new CustomEvent('shenyu-cards-change', { 
        detail: { hasCards: false } 
      }));
      
      return;
    }
    
    try {
      // 尝试直接解析JSON
      const parsedJson = JSON.parse(jsonContent);
      console.log('[ShenyuCardView] 成功解析JSON');
      
      // 设置卡片
      const cardsArray = Array.isArray(parsedJson.cards) ? parsedJson.cards : [];
      setCards(cardsArray);
      
      // 发送卡片状态变化事件，通知工具栏更新按钮状态
      window.dispatchEvent(new CustomEvent('shenyu-cards-change', { 
        detail: { hasCards: cardsArray.length > 0 } 
      }));
      
      // 设置全局提示词块
      const globalBlocks = parsedJson.globalPromptBlocks && typeof parsedJson.globalPromptBlocks === 'object' ? 
        parsedJson.globalPromptBlocks : {};
      setGlobalPromptBlocks(globalBlocks);
      
      // 设置配置名称
      const name = parsedJson.name && typeof parsedJson.name === 'string' ? 
        parsedJson.name : '神谕卡片';
      setConfigName(name);
      
      // 初始化输入值
      const initialInputs: Record<string, string> = {};
      cardsArray.forEach((card: Card) => {
        if (card && card.adminInputs) {
          Object.entries(card.adminInputs).forEach(([key, value]) => {
            // 提取默认值
            const valueStr = String(value || '');
            const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
            const defaultValue = defaultMatch ? defaultMatch[1] : '';
            
            initialInputs[key] = defaultValue;
          });
        }
      });
      setInputValues(initialInputs);
      
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
        controlValues={inputValues} // 使用用户自定义的输入值
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
                            color: '#666666',
                            minWidth: '120px',
                            whiteSpace: 'nowrap'
                          }}>
                            {labelText || key}:
                          </div>
                          <input 
                            type="text"
                            value={inputValues[key] !== undefined ? inputValues[key] : defaultValue}
                            onChange={(e) => {
                              setInputValues(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }));
                            }}
                            aria-label={labelText || key}
                            title={labelText || key}
                            placeholder={defaultValue}
                            style={{
                              backgroundColor: 'var(--main-bg)',
                              color: 'var(--text-white)',
                              padding: 'var(--space-xs) var(--space-sm)',
                              borderRadius: 'var(--radius-sm)',
                              width: '100%',
                              border: '1px solid var(--border-color)',
                              fontSize: 'var(--font-sm)',
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
        </div>
        
        {/* 提示词块列表 - 但移除标题 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-lg)',
          marginBottom: 'var(--space-lg)'
        }}>
          {/* 这里移除了提示词块标题 */}
          
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

        {/* 空状态标题和提示 */}
        {cards.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(var(--space-md) + 20px)',
            color: 'var(--text-light-gray)',
            backgroundColor: 'var(--main-bg)',
            borderRadius: 'var(--radius-md)',
            gap: 'var(--space-md)'
          }}>
            <h4 style={{ 
              fontSize: 'var(--font-md)', 
              margin: 0,
              textAlign: 'center',
              color: '#666666',
              fontWeight: 'normal'
            }}>
              现在还没有开始构造卡片，请按照以下步骤操作：
            </h4>
            
            {/* 步骤1 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '30px', 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div style={{ textAlign: 'left', marginLeft: '10px' }}>在对话选择@神谕，说出你的想法</div>
            </div>
            
            {/* 连接线1 */}
            <div style={{ marginLeft: '15px', height: '15px' }}>
              <div style={{ borderLeft: '2px dashed #666666', height: '100%' }}></div>
            </div>
            
            {/* 步骤2 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '30px', 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <div style={{ textAlign: 'left', marginLeft: '10px' }}>当一个代码气泡出现时，这里就会出现卡片</div>
            </div>
            
            {/* 连接线2 */}
            <div style={{ marginLeft: '15px', height: '15px' }}>
              <div style={{ borderLeft: '2px dashed #666666', height: '100%' }}></div>
            </div>
            
            {/* 步骤3 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '30px', 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div style={{ textAlign: 'left', marginLeft: '10px' }}>你可以通过对话的方式不断修改它</div>
            </div>
            
            {/* 连接线3 */}
            <div style={{ marginLeft: '15px', height: '15px' }}>
              <div style={{ borderLeft: '2px dashed #666666', height: '100%' }}></div>
            </div>
            
            {/* 步骤4 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '30px', 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
              </div>
              <div style={{ textAlign: 'left', marginLeft: '10px' }}>在卡片中填入你需要的参数</div>
            </div>
            
            {/* 连接线4 */}
            <div style={{ marginLeft: '15px', height: '15px' }}>
              <div style={{ borderLeft: '2px dashed #666666', height: '100%' }}></div>
            </div>
            
            {/* 步骤5 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '30px', 
                display: 'flex', 
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div style={{ textAlign: 'left', marginLeft: '10px' }}>然后生成最终的内容</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShenyuCardView;
