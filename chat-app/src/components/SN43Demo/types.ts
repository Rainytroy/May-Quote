/**
 * Shenyu SN43Demo 类型定义文件
 */

/**
 * 提示词块接口定义
 */
export interface PromptBlock {
  text: string;  // 提示词内容
  id?: string;   // 唯一标识符（可选）
  order?: number; // 排序顺序（可选）
}

/**
 * 全局提示词块接口定义
 * 用于在多卡片模式下整合各卡片结果
 */
export interface GlobalPromptBlock {
  id: string;    // 标识符
  text: string;  // 提示词内容
}

/**
 * 全局提示词块集合
 * 键为提示词块ID，值为块内容
 */
export interface GlobalPromptBlocks {
  [key: string]: string; // 例如: "finalSummary": "综合所有卡片结果..."
}

/**
 * 用户输入接口定义
 * 键为输入字段ID，值为字段内容
 */
export interface UserInputs {
  [key: string]: string;  // 例如: "inputA1": "智能手表"
}

/**
 * 管理员配置接口定义
 * 键为配置字段ID，值为字段内容
 */
export interface AdminInputs {
  [key: string]: string;  // 例如: "inputB1": "分析竞品"
}

/**
 * 卡片提示词块集合
 * 键为提示词块ID，值为块内容
 */
export interface CardPromptBlocks {
  [key: string]: string; // 例如: "promptBlock1": "根据输入分析..."
}

/**
 * 卡片接口定义
 * 用于多卡片模式下的每个独立卡片
 */
export interface Card {
  id: string;                 // 卡片唯一标识符
  title: string;              // 卡片标题
  adminInputs: AdminInputs;   // 卡片特定的管理员配置
  promptBlocks: CardPromptBlocks; // 卡片特定的提示词块
}

/**
 * SN43历史记录接口定义
 */
export interface SN43History {
  id: string;                  // 唯一标识符
  timestamp: number;           // 创建时间戳
  userInputs: UserInputs;      // 用户输入
  adminInputs: AdminInputs;    // 管理员配置
  promptBlocks: PromptBlock[]; // 提示词块
  result?: string;             // 执行结果（可选）
  selectedJsonFile?: string;   // 选中的JSON文件（可选）
  // 多卡片模式的扩展字段
  cards?: Card[];              // 卡片数组（可选）
  globalPromptBlocks?: GlobalPromptBlocks; // 全局提示词块（可选）
}

/**
 * 执行状态枚举
 */
export enum ExecutionStatus {
  IDLE = 'idle',               // 空闲状态
  PREPARING = 'preparing',     // 准备中
  EXECUTING = 'executing',     // 执行中
  COMPLETED = 'completed',     // 完成
  ERROR = 'error'              // 错误
}

/**
 * SN43 配置文件接口定义
 */
export interface SN43ConfigFile {
  name: string;                // 配置文件名称
  description?: string;        // 配置描述（可选）
  language: string;            // 语言（如 'zh', 'en'）
  
  // 单卡片模式的字段
  userInputs?: UserInputs;     // 默认用户输入（可选）
  adminInputs?: AdminInputs;   // 默认管理员配置（可选）
  promptBlocks?: PromptBlock[]; // 默认提示词块（可选）
  
  // 多卡片模式的字段
  cards?: Card[];              // 卡片数组（可选）
  globalPromptBlocks?: GlobalPromptBlocks; // 全局提示词块（可选）
  
  version?: string;            // 版本号（可选）
  isMultiCard?: boolean;       // 是否为多卡片模式（可选）
}

/**
 * 主题配置接口定义
 */
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}
