/**
 * May-Shenyu共享类型定义
 * 
 * 本文件定义了May和神谕(Shenyu)组件共享的数据类型，
 * 用于支持两种模式的无缝整合。
 */

import { Card, GlobalPromptBlocks } from './components/SN43Demo/types';
import { 
  Conversation as OriginalConversation, 
  ConversationMeta as OriginalConversationMeta,
  ClipboardItem as OriginalClipboardItem
} from './types';
import { Message as OriginalMessage } from './components/Chat/MessageItem';

/**
 * 扩展消息类型
 * 保持与原始Message接口兼容，同时添加神谕特有字段
 */
export interface Message extends OriginalMessage {
  // 神谕特有字段(可选)
  type?: 'json' | 'prompt' | 'progress';
  jsonOutput?: string;
  apiRawResponse?: string;
  sender?: string;
  progress?: ProgressInfo;
}

/**
 * 扩展对话类型
 * 保持与原始Conversation接口兼容，同时添加模式和神谕状态字段
 */
export interface Conversation extends OriginalConversation {
  // 新增字段
  currentMode?: 'may' | 'shenyu';  // 当前活动模式
  shenyuState?: ShenyuState;       // 神谕状态(可选)
}

/**
 * 对话元数据 - 直接复用原始定义
 */
export type ConversationMeta = OriginalConversationMeta;

/**
 * 剪贴板项目 - 直接复用原始定义
 */
export type ClipboardItem = OriginalClipboardItem;

/**
 * 神谕状态
 */
export interface ShenyuState {
  cards: Card[];                 // 当前卡片数据
  globalPromptBlocks: GlobalPromptBlocks;  // 全局提示词块
  hasGenerated: boolean;         // 是否已生成过
  activeTemplate: string;        // 当前使用的模板ID
  latestJsonOutput?: string;     // 最新JSON输出
}

/**
 * 提示词执行进度信息
 */
export interface ProgressInfo {
  current: number;       // 当前执行的块数
  total: number;         // 总块数
  completed: boolean;    // 是否完成
  cardBlocks: number;    // 卡片提示词块数
  globalBlocks: number;  // 全局提示词块数
}
