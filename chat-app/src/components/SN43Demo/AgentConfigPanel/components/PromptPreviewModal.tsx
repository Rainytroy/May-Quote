import React, { useState, useEffect } from 'react';
import { Card, GlobalPromptBlocks } from '../../types';

// 转义正则表达式特殊字符
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示整个匹配的字符串
};

interface PromptPreviewModalProps {
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
const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
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

  /**
   * 递归替换提示词中的占位符
   * 支持嵌套替换，处理跨卡片提示词引用
   */
  const replacePromptPlaceholders = (text: string, userInput: string = '', depth: number = 0, processedRefs: Set<string> = new Set()) => {
    // 防止过深递归
    if (depth > 10) {
      console.warn('[PromptPreviewModal] 替换深度超过10层，可能存在循环引用，停止替换');
      return {
        processed: text,
        replacedCount: 0,
        unreplacedCount: 0,
        unreplacedList: []
      };
    }
    
    console.log(`[PromptPreviewModal] 开始替换占位符(深度:${depth})`, {
      textLength: text.length,
      controlValuesCount: Object.keys(controlValues).length
    });
    
    let result = text;
    const unreplacedList: string[] = [];
    
    // 原始占位符列表 - 匹配 {#xxx} 格式的所有占位符
    const originalPlaceholders = text.match(/\{#[^}]+\}/g) || [];
    console.log(`[PromptPreviewModal] 检测到 ${originalPlaceholders.length} 个占位符:`, originalPlaceholders);
    
    // 1. 替换用户输入引用 {#input}
    const basicInputPattern = /\{#input\}/g;
    const basicInputCount = (text.match(basicInputPattern) || []).length;
    
    if (basicInputCount > 0) {
      result = result.replace(basicInputPattern, userInput || agentName);
      console.log(`[PromptPreviewModal] 替换了 ${basicInputCount} 个用户输入引用 {#input}`);
    }
    
    // 2. 替换管理员输入引用 {#inputB1}, {#inputB2} 等
    // 处理所有controlValues并进行替换
    if (depth === 0) { // 只在顶层记录详细信息，避免递归时日志过多
      console.log('[PromptPreviewModal] 使用以下控件值替换占位符:', controlValues);
    }
    
    // 对每个controlValues进行占位符替换并打印详细日志
    let replacedCount = basicInputCount;
    for (const [key, value] of Object.entries(controlValues)) {
      if (!value && value !== 0 && value !== false) {
        if (depth === 0) console.log(`[PromptPreviewModal] 跳过空值控件: ${key}`);
        continue; // 跳过空值
      }
      
      // 尝试多种可能的占位符格式
      const placeholderFormats = [
        `{#${key}}`,               // 标准格式 {#inputB1}
        `{#input${key.replace(/^input/, '')}}`, // 处理可能的重复前缀
        `{#${key.replace(/^input/, '')}}` // 处理没有input前缀的情况
      ];
      
      // 进行置换并记录结果
      for (const placeholder of placeholderFormats) {
        // 检查此占位符是否存在于文本中
        if (result.includes(placeholder)) {
          const pattern = new RegExp(escapeRegExp(placeholder), 'g');
          const matchCount = (result.match(pattern) || []).length;
          
          if (matchCount > 0) {
            const oldResult = result;
            const stringValue = String(value);
            result = result.replace(pattern, stringValue);
            replacedCount += matchCount;
            
            if (depth === 0) {
              console.log(`[PromptPreviewModal] 替换了 ${matchCount} 个占位符 ${placeholder} => "${stringValue.substring(0, 30)}${stringValue.length > 30 ? '...' : ''}"`);
              
              // 详细输出替换前后的内容片段
              const placeholderIndex = oldResult.indexOf(placeholder);
              if (placeholderIndex >= 0) {
                const start = Math.max(0, placeholderIndex - 30);
                const end = Math.min(oldResult.length, placeholderIndex + placeholder.length + 30);
                console.log(`[PromptPreviewModal] 替换前片段: "${oldResult.substring(start, end)}"`);
                
                const newStart = placeholderIndex - 30 >= 0 ? placeholderIndex - 30 : 0;
                const newEnd = Math.min(result.length, newStart + stringValue.length + 60);
                console.log(`[PromptPreviewModal] 替换后片段: "${result.substring(newStart, newEnd)}"`);
              }
            }
          }
        }
      }
    }
    
    // 3. 尝试匹配跨卡片引用 {#card1.inputB3}
    const crossCardReferences = result.match(/\{#card[0-9]+\.input[^}]+\}/g) || [];
    if (crossCardReferences.length > 0) {
      if (depth === 0) console.log(`[PromptPreviewModal] 检测到 ${crossCardReferences.length} 个跨卡片引用，尝试处理`);
      
      // 尝试解析和替换跨卡片引用
      crossCardReferences.forEach(ref => {
        // 避免重复处理相同的引用
        if (processedRefs.has(ref)) {
          console.warn(`[PromptPreviewModal] 跳过已处理的引用，可能存在循环: ${ref}`);
          return;
        }
        
        // 提取卡片ID和输入字段ID
        const match = ref.match(/\{#card([0-9]+)\.input([^}]+)\}/);
        if (match) {
          const cardId = match[1];
          const inputId = match[2];
          const keyToFind = `inputB${inputId}`;
          
          if (controlValues[keyToFind]) {
            const oldResult = result;
            result = result.replace(new RegExp(escapeRegExp(ref), 'g'), String(controlValues[keyToFind]));
            replacedCount++;
            
            if (depth === 0) console.log(`[PromptPreviewModal] 替换了跨卡片引用 ${ref} => "${String(controlValues[keyToFind]).substring(0, 30)}..."`);
          } else {
            if (depth === 0) console.log(`[PromptPreviewModal] 未找到值来替换跨卡片引用: ${ref}`);
            if (!unreplacedList.includes(ref)) {
              unreplacedList.push(ref);
            }
          }
        }
      });
    }
    
    // 4. 处理提示词引用 {#promptBlock1} 或 {#card1.promptBlock1}
    const promptBlockReferences = result.match(/\{#(?:card[0-9]+\.)?promptBlock[0-9]+\}/g) || [];
    if (promptBlockReferences.length > 0) {
      if (depth === 0) console.log(`[PromptPreviewModal] 检测到 ${promptBlockReferences.length} 个提示词引用，开始处理`);
      
      // 处理每个提示词引用
      for (const ref of promptBlockReferences) {
        // 检查循环引用
        if (processedRefs.has(ref)) {
          console.warn(`[PromptPreviewModal] 检测到循环引用: ${ref}`);
          if (!unreplacedList.includes(ref)) {
            unreplacedList.push(ref);
          }
          continue;
        }
        
        // 标记为已处理
        processedRefs.add(ref);
        
        // 提取卡片ID和提示词块ID
        const match = ref.match(/\{#(?:card([0-9]+)\.)?promptBlock([0-9]+)\}/);
        if (match) {
          const cardId = match[1] ? `card${match[1]}` : null;
          const blockId = `promptBlock${match[2]}`;
          let foundPromptText = null;
          
          // 查找对应的提示词块内容
          if (cardId) {
            // 跨卡片提示词引用
            const targetCard = cards.find(c => c.id === cardId);
            if (targetCard && targetCard.promptBlocks[blockId]) {
              foundPromptText = targetCard.promptBlocks[blockId];
              if (depth === 0) console.log(`[PromptPreviewModal] 找到跨卡片提示词块 ${cardId}.${blockId}`);
            }
          } else {
            // 当前卡片提示词引用 - 需要具体上下文，但不确定当前卡片
            // 暂时搜索所有卡片
            for (const card of cards) {
              if (card.promptBlocks[blockId]) {
                foundPromptText = card.promptBlocks[blockId];
                if (depth === 0) console.log(`[PromptPreviewModal] 找到同卡片提示词块 ${blockId} (在卡片 ${card.id})`);
                break;
              }
            }
          }
          
          if (foundPromptText) {
            // 递归替换提示词块内容中的占位符
            const newProcessedRefs = new Set(processedRefs);
            const { processed: replacedPromptText } = replacePromptPlaceholders(
              foundPromptText,
              userInput,
              depth + 1,
              newProcessedRefs
            );
            
            // 替换当前引用为处理后的提示词块内容
            const oldResult = result;
            result = result.replace(new RegExp(escapeRegExp(ref), 'g'), replacedPromptText);
            replacedCount++;
            
            if (depth === 0) {
              console.log(`[PromptPreviewModal] 替换了提示词引用 ${ref} => "${replacedPromptText.substring(0, 30)}${replacedPromptText.length > 30 ? '...' : ''}"`);
            }
          } else {
            if (depth === 0) console.log(`[PromptPreviewModal] 未找到提示词块: ${ref}`);
            if (!unreplacedList.includes(ref)) {
              unreplacedList.push(ref);
            }
          }
        }
      }
    }
    
    // 检查是否仍有未替换的占位符
    const remainingPlaceholders = result.match(/\{#[^}]+\}/g) || [];
    console.log(`[PromptPreviewModal] 替换后剩余 ${remainingPlaceholders.length} 个未替换占位符`);
    
    remainingPlaceholders.forEach(placeholder => {
      if (!unreplacedList.includes(placeholder)) {
        unreplacedList.push(placeholder);
        console.log(`[PromptPreviewModal] 未能替换占位符: ${placeholder}`);
      }
    });
    
    console.log(`[PromptPreviewModal] 总计替换了 ${replacedCount} 个占位符，剩余 ${unreplacedList.length} 个未替换`);
    
    return {
      processed: result,
      replacedCount: originalPlaceholders.length - remainingPlaceholders.length,
      unreplacedCount: remainingPlaceholders.length,
      unreplacedList
    };
  };

  // 处理所有提示词
  const processAllPrompts = () => {
    console.log('[PromptPreviewModal] 处理所有提示词块', {
      cardsCount: cards.length,
      globalBlocksCount: Object.keys(globalPromptBlocks).length,
      controlValuesCount: Object.keys(controlValues).length
    });
    setIsProcessing(true);
    
    try {
      // 处理卡片中的提示词块
      const newProcessedPrompts: Array<{
        cardId: string;
        cardTitle: string;
        blockId: string;
        original: string;
        processed: string;
        replacedCount: number;
        unreplacedCount: number;
        unreplacedList: string[];
      }> = [];
      
      cards.forEach(card => {
        Object.entries(card.promptBlocks).forEach(([blockId, text]) => {
          const { processed, replacedCount, unreplacedCount, unreplacedList } = 
            replacePromptPlaceholders(text);
          
          newProcessedPrompts.push({
            cardId: card.id,
            cardTitle: card.title,
            blockId,
            original: text,
            processed,
            replacedCount,
            unreplacedCount,
            unreplacedList
          });
        });
      });
      
      setProcessedPrompts(newProcessedPrompts);
      
      // 处理全局提示词块
      const newGlobalProcessedPrompts: Array<{
        blockId: string;
        original: string;
        processed: string;
        replacedCount: number;
        unreplacedCount: number;
        unreplacedList: string[];
      }> = [];
      
      Object.entries(globalPromptBlocks).forEach(([blockId, text]) => {
        const { processed, replacedCount, unreplacedCount, unreplacedList } = 
          replacePromptPlaceholders(text);
        
        newGlobalProcessedPrompts.push({
          blockId,
          original: text,
          processed,
          replacedCount,
          unreplacedCount,
          unreplacedList
        });
      });
      
      setGlobalProcessedPrompts(newGlobalProcessedPrompts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[PromptPreviewModal] 处理提示词时出错:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 初始加载和弹窗打开时处理提示词
  useEffect(() => {
    if (isOpen) {
      processAllPrompts();
    }
  }, [isOpen, cards, globalPromptBlocks, controlValues]);
  
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
              onClick={processAllPrompts}
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

export default PromptPreviewModal;
