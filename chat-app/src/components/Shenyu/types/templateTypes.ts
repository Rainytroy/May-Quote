/**
 * 提示词模板类型定义
 */

/**
 * 提示词模板数据接口
 * 
 * @interface PromptTemplate
 */
export interface PromptTemplate {
  id: string;         // 模板唯一标识符
  name: string;       // 模板名称（用户可编辑）
  content: string;    // 模板内容
  isBuiltIn: boolean; // 是否为内置模板
  isActive: number;   // 是否激活 (0: 未激活, 1: 激活)
  createdAt: number;  // 创建时间戳
  updatedAt: number;  // 更新时间戳
}

/**
 * 创建新模板的参数
 */
export interface CreateTemplateParams {
  name: string;
  content: string;
  isBuiltIn?: boolean;
  isActive?: number;  // 0: 未激活, 1: 激活
}

/**
 * 更新模板的参数
 */
export interface UpdateTemplateParams {
  name?: string;
  content?: string;
  isActive?: number;  // 0: 未激活, 1: 激活
}
