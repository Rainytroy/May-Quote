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
  userInputs: UserInputs;      // 默认用户输入
  adminInputs: AdminInputs;    // 默认管理员配置
  promptBlocks: PromptBlock[]; // 默认提示词块
  version?: string;            // 版本号（可选）
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
