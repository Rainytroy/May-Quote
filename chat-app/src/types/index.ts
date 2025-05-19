import { Message } from '../components/Chat/MessageItem';

/**
 * 引用项定义
 */
export interface ReferenceItem {
  id: string;           // 唯一标识符
  content: string;      // 完整引用内容
  previewText: string;  // 预览文本（前10个字符）
  timestamp: number;    // 引用创建时间戳
}

/**
 * 剪贴板项定义
 */
export interface ClipboardItem {
  id: string;              // 唯一标识
  content: string;         // 内容文本，支持Markdown
  timestamp: number;       // 创建时间戳
  order: number;           // 排序顺序（用于拖拽排序）
  source?: {               // 来源信息，可选字段
    conversationId: string;  // 对话ID
    messageId: string;       // 消息ID，用于定位源消息
  };
}

/**
 * 剪贴板Tab定义
 */
export interface ClipboardTab {
  id: string;              // Tab唯一标识
  title: string;           // Tab标题
  type: 'clipboard' | 'custom' | 'shenyu'; // Tab类型
  closable: boolean;       // 是否可关闭
}

/**
 * 对话接口定义
 */
export interface Conversation {
  id: string;             // 对话唯一ID
  title: string;          // 对话标题（从第一条消息生成或自定义）
  messages: Message[];    // 对话中的消息（最多保存100条）
  clipboardItems: ClipboardItem[]; // 与对话关联的剪贴板项
  createdAt: number;      // 创建时间戳
  updatedAt: number;      // 最后更新时间戳
  shenyuJson?: string;    // 神谕JSON数据，可选字段
}

/**
 * 对话元数据接口定义
 * 用于对话列表显示，减少内存占用
 */
export interface ConversationMeta {
  id: string;         // 对话唯一ID
  title: string;      // 对话标题
  preview: string;    // 最后一条消息的预览（截取）
  messageCount: number; // 消息数量
  updatedAt: number;  // 最后更新时间
  shenyuJson?: string; // 神谕JSON数据，可选字段
}
