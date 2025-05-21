import { Card, GlobalPromptBlocks } from '../../SN43Demo/types';

// 转义正则表达式特殊字符
export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示整个匹配的字符串
};

export interface ProcessedPromptBlock {
  cardId: string;
  cardTitle: string;
  blockId: string;
  original: string;
  processed: string;
  replacedCount: number;
  unreplacedCount: number;
  unreplacedList: string[];
  isGlobal: boolean;
}

export interface ProcessPromptResults {
  cardBlocks: ProcessedPromptBlock[];
  globalBlocks: ProcessedPromptBlock[];
  processedBlocksDict: Record<string, string>;
}

/**
 * 递归替换提示词中的占位符
 * 支持嵌套替换，处理跨卡片提示词引用
 */
export function replacePromptPlaceholders(
  text: string,
  controlValues: Record<string, any>,
  agentName: string,
  cards: Card[],
  userInput: string = '',
  depth: number = 0,
  processedRefs: Set<string> = new Set()
) {
  // 防止过深递归
  if (depth > 10) {
    console.warn('[PromptProcessor] 替换深度超过10层，可能存在循环引用，停止替换');
    return {
      processed: text,
      replacedCount: 0,
      unreplacedCount: 0,
      unreplacedList: []
    };
  }
  
  console.log(`[PromptProcessor] 开始替换占位符(深度:${depth})`, {
    textLength: text.length,
    controlValuesCount: Object.keys(controlValues).length
  });
  
  let result = text;
  const unreplacedList: string[] = [];
  
  // 原始占位符列表 - 匹配 {#xxx} 格式的所有占位符
  const originalPlaceholders = text.match(/\{#[^}]+\}/g) || [];
  console.log(`[PromptProcessor] 检测到 ${originalPlaceholders.length} 个占位符:`, originalPlaceholders);
  
  // 1. 替换用户输入引用 {#input}
  const basicInputPattern = /\{#input\}/g;
  const basicInputCount = (text.match(basicInputPattern) || []).length;
  
  if (basicInputCount > 0) {
    result = result.replace(basicInputPattern, userInput || agentName);
    console.log(`[PromptProcessor] 替换了 ${basicInputCount} 个用户输入引用 {#input}`);
  }
  
  // 2. 替换管理员输入引用 {#inputB1}, {#inputB2} 等
  // 处理所有controlValues并进行替换
  if (depth === 0) { // 只在顶层记录详细信息，避免递归时日志过多
    console.log('[PromptProcessor] 使用以下控件值替换占位符:', controlValues);
  }
  
  // 对每个controlValues进行占位符替换并打印详细日志
  let replacedCount = basicInputCount;
  for (const [key, value] of Object.entries(controlValues)) {
    if (value === undefined || value === null) {
      console.log(`[PromptProcessor] 跳过undefined/null控件: ${key}`);
      continue; // 只跳过undefined和null值，允许空字符串
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
          
          console.log(`[PromptProcessor] 替换了 ${matchCount} 个占位符 ${placeholder} => "${stringValue.substring(0, 30)}${stringValue.length > 30 ? '...' : ''}"`);
          
          // 详细输出替换前后的内容片段
          const placeholderIndex = oldResult.indexOf(placeholder);
          if (placeholderIndex >= 0) {
            const start = Math.max(0, placeholderIndex - 30);
            const end = Math.min(oldResult.length, placeholderIndex + placeholder.length + 30);
            console.log(`[PromptProcessor] 替换前片段: "${oldResult.substring(start, end)}"`);
            
            const newStart = placeholderIndex - 30 >= 0 ? placeholderIndex - 30 : 0;
            const newEnd = Math.min(result.length, newStart + stringValue.length + 60);
            console.log(`[PromptProcessor] 替换后片段: "${result.substring(newStart, newEnd)}"`);
          }
        }
      }
    }
  }
  
  // 3. 构建卡片输入值字典，用于处理跨卡片输入引用
  // 这里使用与processedBlocksDict相同的键名格式，确保一致性
  const cardInputValues: Record<string, string> = {};
  if (depth === 0) { // 只在顶层构建一次
    cards.forEach(card => {
      if (card.adminInputs) {
        Object.entries(card.adminInputs).forEach(([inputKey, inputValue]) => {
          if (inputValue) {
            // 提取默认值部分 (从 <def>xxx</def> 中)
            const valueStr = String(inputValue);
            const defaultMatch = valueStr.match(/<def>(.*?)<\/def>/);
            const value = defaultMatch ? defaultMatch[1] : valueStr;
            
            // 保存到卡片输入字典中，键名格式: "card1.inputB13"
            // 确保与查找时使用的键名格式一致
            cardInputValues[`${card.id}.${inputKey}`] = value;
          }
        });
      }
    });
    console.log(`[PromptProcessor] 构建了跨卡片输入字典，共 ${Object.keys(cardInputValues).length} 项`);
  }

  // 4. 尝试匹配跨卡片输入引用 {#card1.inputB3}
  const crossCardReferences = result.match(/\{#card[0-9]+\.input[^}]+\}/g) || [];
  if (crossCardReferences.length > 0) {
    console.log(`[PromptProcessor] 检测到 ${crossCardReferences.length} 个跨卡片输入引用，尝试处理`);
    
    // 尝试解析和替换跨卡片引用
    crossCardReferences.forEach(ref => {
      // 避免重复处理相同的引用
      if (processedRefs.has(ref)) {
        console.warn(`[PromptProcessor] 跳过已处理的引用，可能存在循环: ${ref}`);
        return;
      }
      
      // 标记为已处理，避免循环引用
      processedRefs.add(ref);
      
      // 提取卡片ID和输入字段ID
      const match = ref.match(/\{#card([0-9]+)\.input([^}]+)\}/);
      if (match) {
        const cardId = match[1];
        const inputId = match[2];
        
        // *** 关键修改 ***
        // 构建引用键，格式与字典构建时一致："card1.inputB13"
        const cardPrefix = `card${cardId}`;
        const inputKey = inputId.startsWith('B') ? `inputB${inputId.substring(1)}` : `inputB${inputId}`;
        const refKey = `${cardPrefix}.${inputKey}`;
        
        // 查找并替换 - 首先尝试卡片输入字典
        if (cardInputValues[refKey]) {
          const valueToUse = String(cardInputValues[refKey]);
          result = result.replace(new RegExp(escapeRegExp(ref), 'g'), valueToUse);
          replacedCount++;
          
          console.log(`[PromptProcessor] 成功替换跨卡片输入引用 ${ref} => "${valueToUse.substring(0, 30)}${valueToUse.length > 30 ? '...' : ''}"`);
          console.log(`[PromptProcessor] 使用的键: ${refKey}`);
        }
        // 退化到原始逻辑：尝试从controlValues中查找
        else {
          const fallbackKey = `inputB${inputId}`;
          if (controlValues[fallbackKey]) {
            const valueToUse = String(controlValues[fallbackKey]);
            result = result.replace(new RegExp(escapeRegExp(ref), 'g'), valueToUse);
            replacedCount++;
            
            console.log(`[PromptProcessor] 从controlValues替换了跨卡片引用 ${ref} => "${valueToUse.substring(0, 30)}${valueToUse.length > 30 ? '...' : ''}"`);
          } else {
            console.log(`[PromptProcessor] 未找到值来替换跨卡片引用: ${ref}`);
            console.log(`[PromptProcessor] 尝试过的键: ${refKey}, ${fallbackKey}`);
            if (!unreplacedList.includes(ref)) {
              unreplacedList.push(ref);
            }
          }
        }
      }
    });
  }
  
  // 4. 处理提示词引用 {#promptBlock1} 或 {#card1.promptBlock1}
  const promptBlockReferences = result.match(/\{#(?:card[0-9]+\.)?promptBlock[0-9]+\}/g) || [];
  if (promptBlockReferences.length > 0) {
    console.log(`[PromptProcessor] 检测到 ${promptBlockReferences.length} 个提示词引用，开始处理`);
    
    // 处理每个提示词引用
    for (const ref of promptBlockReferences) {
      // 检查循环引用
      if (processedRefs.has(ref)) {
        console.warn(`[PromptProcessor] 检测到循环引用: ${ref}`);
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
            console.log(`[PromptProcessor] 找到跨卡片提示词块 ${cardId}.${blockId}`);
          }
        } else {
          // 当前卡片提示词引用 - 需要具体上下文，但不确定当前卡片
          // 暂时搜索所有卡片
          for (const card of cards) {
            if (card.promptBlocks[blockId]) {
              foundPromptText = card.promptBlocks[blockId];
              console.log(`[PromptProcessor] 找到同卡片提示词块 ${blockId} (在卡片 ${card.id})`);
              break;
            }
          }
        }
        
        if (foundPromptText) {
          // 递归替换提示词块内容中的占位符
          const newProcessedRefs = new Set(processedRefs);
          const { processed: replacedPromptText } = replacePromptPlaceholders(
            foundPromptText,
            controlValues,
            agentName,
            cards,
            userInput,
            depth + 1,
            newProcessedRefs
          );
          
          // 替换当前引用为处理后的提示词块内容
          const oldResult = result;
          result = result.replace(new RegExp(escapeRegExp(ref), 'g'), replacedPromptText);
          replacedCount++;
          
          console.log(`[PromptProcessor] 替换了提示词引用 ${ref} => "${replacedPromptText.substring(0, 30)}${replacedPromptText.length > 30 ? '...' : ''}"`);
        } else {
          console.log(`[PromptProcessor] 未找到提示词块: ${ref}`);
          if (!unreplacedList.includes(ref)) {
            unreplacedList.push(ref);
          }
        }
      }
    }
  }
  
  // 检查是否仍有未替换的占位符
  const remainingPlaceholders = result.match(/\{#[^}]+\}/g) || [];
  console.log(`[PromptProcessor] 替换后剩余 ${remainingPlaceholders.length} 个未替换占位符`);
  
  remainingPlaceholders.forEach(placeholder => {
    if (!unreplacedList.includes(placeholder)) {
      unreplacedList.push(placeholder);
      console.log(`[PromptProcessor] 未能替换占位符: ${placeholder}`);
    }
  });
  
  console.log(`[PromptProcessor] 总计替换了 ${replacedCount} 个占位符，剩余 ${unreplacedList.length} 个未替换`);
  
  return {
    processed: result,
    replacedCount: originalPlaceholders.length - remainingPlaceholders.length,
    unreplacedCount: remainingPlaceholders.length,
    unreplacedList
  };
}

/**
 * 处理所有提示词块，返回处理后的结果
 * 统一供"查看提示词"和"执行提示词"功能使用
 */
export function processAllPrompts(
  cards: Card[],
  globalPromptBlocks: GlobalPromptBlocks,
  controlValues: Record<string, any>,
  agentName: string,
  userInput: string = ''
): ProcessPromptResults {
  console.log('[PromptProcessor] 处理所有提示词块', {
    cardsCount: cards.length,
    globalBlocksCount: Object.keys(globalPromptBlocks).length,
    controlValuesCount: Object.keys(controlValues).length
  });
  
  // 创建用于存储已处理提示词的字典，用于跨提示词块引用
  const processedBlocksDict: Record<string, string> = {};
  
  // 对块进行排序，按ID数字从小到大排序
  const sortBlocks = (blocks: Array<[string, string]>) => {
    return [...blocks].sort((a, b) => {
      // 提取块ID中的数字部分
      const getBlockNumber = (blockId: string) => {
        const match = blockId.match(/promptBlock(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      return getBlockNumber(a[0]) - getBlockNumber(b[0]);
    });
  };
  
  // 1. 首先处理卡片中的提示词块
  console.log('[PromptProcessor] 第一步：处理卡片提示词块');
  const cardProcessedPrompts: ProcessedPromptBlock[] = [];
  
  // 定义特殊处理函数，优先处理提示词块引用
  const replacePromptBlockRefs = (text: string): string => {
    let result = text;
    
    // 匹配所有提示词块引用
    const promptBlockRefs = text.match(/\{#(?:card[0-9]+\.)?promptBlock[0-9]+\}/g) || [];
    
    if (promptBlockRefs.length > 0) {
      console.log(`[PromptProcessor] 检测到 ${promptBlockRefs.length} 个提示词块引用，使用已处理结果替换`);
      
      // 替换每个引用
      promptBlockRefs.forEach(ref => {
        // 提取卡片ID和提示词块ID
        const match = ref.match(/\{#(?:card([0-9]+)\.)?promptBlock([0-9]+)\}/);
        if (match) {
          const cardId = match[1] ? `card${match[1]}` : null;
          const blockId = `promptBlock${match[2]}`;
          
          // 构建引用键
          let refKey = cardId ? `${cardId}.${blockId}` : '';
          
          // 如果没有指定卡片，尝试在所有处理过的块中查找匹配的blockId
          if (!cardId) {
            // 从processedBlocksDict中查找包含该blockId的键
            refKey = Object.keys(processedBlocksDict).find(key => key.endsWith(`.${blockId}`)) || '';
          }
          
          // 如果找到了引用，替换为已处理的内容
          if (refKey && processedBlocksDict[refKey]) {
            console.log(`[PromptProcessor] 使用已处理的内容替换引用: ${ref} => [已处理内容 ${processedBlocksDict[refKey].length} 字符]`);
            result = result.replace(new RegExp(escapeRegExp(ref), 'g'), processedBlocksDict[refKey]);
          } else {
            console.warn(`[PromptProcessor] 未找到引用对应的已处理内容: ${ref}`);
          }
        }
      });
    }
    
    return result;
  };
  
  // 按顺序处理各个卡片的提示词块
  cards.forEach(card => {
    const cardPromptBlocks = Object.entries(card.promptBlocks);
    const sortedCardBlocks = sortBlocks(cardPromptBlocks);
    
    sortedCardBlocks.forEach(([blockId, text]) => {
      // 首先尝试替换提示词块引用
      const textWithBlockRefs = replacePromptBlockRefs(text);
      
      // 然后替换其他占位符
      const { processed, replacedCount, unreplacedCount, unreplacedList } = 
        replacePromptPlaceholders(textWithBlockRefs, controlValues, agentName, cards, userInput);
      
      // 保存处理结果供后续引用
      const blockKey = `${card.id}.${blockId}`;
      processedBlocksDict[blockKey] = processed;
      
      cardProcessedPrompts.push({
        cardId: card.id,
        cardTitle: card.title || card.id,
        blockId,
        original: text,
        processed,
        replacedCount,
        unreplacedCount,
        unreplacedList,
        isGlobal: false
      });
    });
  });
  
  // 2. 处理全局提示词块
  console.log('[PromptProcessor] 第二步：处理全局提示词块');
  const globalProcessedPrompts: ProcessedPromptBlock[] = [];
  
  // 排序全局提示词块
  const globalPromptBlocksEntries = Object.entries(globalPromptBlocks);
  const sortedGlobalBlocks = sortBlocks(globalPromptBlocksEntries);
  
  // 按顺序处理全局提示词块
  sortedGlobalBlocks.forEach(([blockId, text]) => {
    // 首先尝试替换提示词块引用
    const textWithBlockRefs = replacePromptBlockRefs(text);
    
    // 然后替换其他占位符
    const { processed, replacedCount, unreplacedCount, unreplacedList } = 
      replacePromptPlaceholders(textWithBlockRefs, controlValues, agentName, cards, userInput);
    
    // 保存处理结果供后续引用
    const blockKey = `global.${blockId}`;
    processedBlocksDict[blockKey] = processed;
    
    globalProcessedPrompts.push({
      cardId: 'global',
      cardTitle: '总结',
      blockId,
      original: text,
      processed,
      replacedCount,
      unreplacedCount,
      unreplacedList,
      isGlobal: true
    });
  });
  
  return {
    cardBlocks: cardProcessedPrompts,
    globalBlocks: globalProcessedPrompts,
    processedBlocksDict
  };
}
