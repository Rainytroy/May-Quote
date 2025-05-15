/**
 * Shenyu 神谕集成模块类型定义文件
 */

import { Message as MayMessage } from '../Chat/MessageItem';

/**
 * 继承自SN43Demo的基础类型
 */
import {
  PromptBlock,
  GlobalPromptBlock,
  GlobalPromptBlocks,
  UserInputs,
  AdminInputs,
  CardPromptBlocks,
  Card,
  SN43ConfigFile
} from '../SN43Demo/types';

export type {
  PromptBlock,
  GlobalPromptBlock,
  GlobalPromptBlocks,
  UserInputs,
  AdminInputs,
  CardPromptBlocks,
  Card,
  SN43ConfigFile
};

/**
 * 扩展May的Message接口以支持神谕功能
 * 注意：这只是类型定义，不会修改May的代码
 * 实际集成时需要修改Message接口
 */
export interface ShenyuMessage extends MayMessage {
  isShenyu?: boolean;              // 标识是否为神谕消息
  type?: 'json' | 'prompt' | 'process'; // 消息类型
  sender?: string;                 // 消息发送者标识
  originalUserInput?: string;      // 原始用户输入，用于二阶段提示词
  shenyuData?: {                   // 神谕特有数据
    isValidJson: boolean;          // 是否为有效JSON
    jsonContent: string | null;    // JSON内容
    templateName: string;          // 使用的模板名称
    cards?: number;                // 卡片数量
    adminInputs?: number;          // 管理员输入数量
    promptBlocks?: number;         // 提示词块数量
    hasGlobalPrompt?: boolean;     // 是否有全局提示词
  };
}

/**
 * 聊天模式
 */
export type ChatMode = 'may' | 'shenyu';

/**
 * JSON结构信息
 */
export interface JsonStructureInfo {
  isValidJson: boolean;          // 是否为有效JSON
  jsonContent: string | null;    // JSON内容
  cards?: number;                // 卡片数量
  adminInputs?: number;          // 管理员输入数量
  promptBlocks?: number;         // 提示词块数量
  hasGlobalPrompt?: boolean;     // 是否有全局提示词
}

/**
 * 神谕响应结构
 */
export interface ShenyuResponse extends JsonStructureInfo {
  rawResponse: string;           // 原始响应
  templateName: string;          // 使用的模板名称
}

/**
 * 提示词模板集合
 */
export interface PromptTemplateSet {
  id: string;                    // 模板唯一ID
  name: string;                  // 模板名称
  firstStage: string;            // 第一阶段提示词
  secondStage: string;           // 第二阶段提示词
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  isDefault?: boolean;           // 是否为默认模板
}

/**
 * 提示词模板上下文类型
 */
export interface PromptTemplateContextType {
  templates: PromptTemplateSet[];               // 所有模板
  activeTemplate: PromptTemplateSet | null;     // 当前激活的模板
  addTemplate: (template: PromptTemplateSet) => void;  // 添加模板
  updateTemplate: (id: string, template: Partial<PromptTemplateSet>) => void; // 更新模板
  deleteTemplate: (id: string) => void;         // 删除模板
  setActiveTemplate: (id: string) => void;      // 设置激活模板
}

/**
 * 神谕上下文类型
 */
export interface ShenyuContextType {
  // 状态
  currentMode: ChatMode;                        // 当前模式
  isProcessing: boolean;                        // 是否正在处理请求
  lastResponse: ShenyuResponse | null;          // 最近一次响应
  
  // 操作方法
  setMode: (mode: ChatMode) => void;             // 设置模式
  processShenyuRequest: (input: string) => Promise<ShenyuResponse>;  // 处理神谕请求
  processEditRequest: (originalContent: string, editContent: string) => Promise<ShenyuResponse>; // 处理修改请求
  
  // 模板相关
  activeTemplate: PromptTemplateSet | null;      // 当前激活的模板
}

/**
 * 神谕气泡组件属性
 */
export interface ShenyuBubbleProps {
  message: ShenyuMessage;            // 消息对象
  onEdit: () => void;                // 编辑回调
  onView: () => void;                // 查看回调
}

/**
 * 神谕编辑模态框属性
 */
export interface ShenyuEditModalProps {
  isOpen: boolean;                   // 是否打开
  onClose: () => void;               // 关闭回调
  message: ShenyuMessage | null;     // 消息对象
  onSubmit: (editContent: string) => void;  // 提交修改回调
}
