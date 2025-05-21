/**
 * 提示词模板数据库服务
 * 扩展现有数据库，提供模板管理功能
 */

import Dexie from 'dexie';
import { PromptTemplate, CreateTemplateParams, UpdateTemplateParams } from '../components/Shenyu/types/templateTypes';
import { SHENYU_PROMPT_TEMPLATE } from '../components/Shenyu/utils/promptTemplates';

// 扩展现有数据库
class TemplateDatabase extends Dexie {
  // 提示词模板表
  templates!: Dexie.Table<PromptTemplate, string>;

  constructor() {
    super('may-shenyu-template-db');
    
    // 定义数据库结构
    this.version(1).stores({
      // 模板表：存储提示词模板
      templates: 'id, name, isBuiltIn, isActive, createdAt, updatedAt'
    });
  }
}

// 创建数据库单例
const templateDb = new TemplateDatabase();

/**
 * 模板数据库服务
 * 提供模板管理所需的所有数据访问方法
 */
export const templateDbService = {
  /**
   * 初始化模板数据库
   * 如果数据库为空，则创建内置标准模板
   */
  async initTemplateDb(): Promise<void> {
    try {
      // 检查是否有任何模板
      const count = await templateDb.templates.count();
      
      // 如果没有任何模板，创建内置标准模板
      if (count === 0) {
        const standardTemplate: PromptTemplate = {
          id: 'standard-template',
          name: '标准模板',
          content: SHENYU_PROMPT_TEMPLATE,
          isBuiltIn: true,
          isActive: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        await templateDb.templates.add(standardTemplate);
        console.log('已初始化标准模板');
      }
    } catch (error) {
      console.error('初始化模板数据库失败:', error);
    }
  },
  
  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    try {
      return await templateDb.templates
        .orderBy('updatedAt')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('获取所有模板失败:', error);
      return [];
    }
  },
  
  /**
   * 获取模板
   */
  async getTemplate(id: string): Promise<PromptTemplate | null> {
    try {
      const template = await templateDb.templates.get(id);
      return template || null;
    } catch (error) {
      console.error('获取模板失败:', error);
      return null;
    }
  },
  
  /**
   * 获取激活的模板
   */
  async getActiveTemplate(): Promise<PromptTemplate | null> {
    try {
      const activeTemplate = await templateDb.templates
        .where('isActive')
        .equals(1)
        .first();
      
      // 确保返回null而不是undefined
      if (activeTemplate) {
        return activeTemplate;
      }
      
      // 如果没有激活的模板，尝试激活标准模板
      const standardTemplate = await templateDb.templates.get('standard-template');
      if (standardTemplate) {
        await this.activateTemplate(standardTemplate.id);
        return standardTemplate;
      }
      
      return null;
    } catch (error) {
      console.error('获取激活模板失败:', error);
      return null;
    }
  },
  
  /**
   * 创建新模板
   */
  async createTemplate(params: CreateTemplateParams): Promise<string | null> {
    try {
      const id = `template-${Date.now()}`;
      const now = Date.now();
      
      const template: PromptTemplate = {
        id,
        name: params.name,
        content: params.content,
        isBuiltIn: params.isBuiltIn || false,
        isActive: params.isActive !== undefined ? params.isActive : 0,
        createdAt: now,
        updatedAt: now
      };
      
      // 如果新模板被设置为激活状态，需要取消其他模板的激活状态
      if (template.isActive === 1) {
        await templateDb.transaction('rw', templateDb.templates, async () => {
          // 取消所有模板的激活状态
          await templateDb.templates
            .where('isActive')
            .equals(1)
            .modify({ isActive: 0 });
          
          // 添加新模板
          await templateDb.templates.add(template);
        });
      } else {
        // 直接添加新模板
        await templateDb.templates.add(template);
      }
      
      return id;
    } catch (error) {
      console.error('创建模板失败:', error);
      return null;
    }
  },
  
  /**
   * 更新模板
   */
  async updateTemplate(id: string, params: UpdateTemplateParams): Promise<boolean> {
    try {
      const template = await templateDb.templates.get(id);
      if (!template) {
        console.error('更新模板失败: 未找到模板', id);
        return false;
      }
      
      // 如果是内置模板，只允许更新激活状态
      if (template.isBuiltIn) {
        if (params.isActive !== undefined) {
          // 如果要激活此模板，需要取消其他模板的激活状态
          if (params.isActive === 1) {
            await templateDb.transaction('rw', templateDb.templates, async () => {
              // 取消所有模板的激活状态
              await templateDb.templates
                .where('isActive')
                .equals(1)
                .modify({ isActive: 0 });
              
              // 更新此模板
              await templateDb.templates.update(id, { 
                isActive: 1,
                updatedAt: Date.now()
              });
            });
          } else {
            // 直接更新此模板
            await templateDb.templates.update(id, { 
              isActive: 0,
              updatedAt: Date.now()
            });
          }
          return true;
        }
        console.error('更新模板失败: 不允许修改内置模板的内容', id);
        return false;
      }
      
      // 对于自定义模板，可以更新所有字段
      const updates: any = {
        updatedAt: Date.now()
      };
      
      if (params.name !== undefined) updates.name = params.name;
      if (params.content !== undefined) updates.content = params.content;
      
      // 如果更新激活状态，需要特殊处理
      if (params.isActive !== undefined) {
        if (params.isActive === 1) {
          // 需要在事务中处理
          await templateDb.transaction('rw', templateDb.templates, async () => {
            // 取消所有模板的激活状态
            await templateDb.templates
              .where('isActive')
              .equals(1)
              .modify({ isActive: 0 });
            
            // 更新此模板
            updates.isActive = 1;
            await templateDb.templates.update(id, updates);
          });
          return true;
        } else {
          // 直接更新
          updates.isActive = 0;
        }
      }
      
      // 应用所有更新
      await templateDb.templates.update(id, updates);
      return true;
    } catch (error) {
      console.error('更新模板失败:', error);
      return false;
    }
  },
  
  /**
   * 激活模板
   */
  async activateTemplate(id: string): Promise<boolean> {
    try {
      // 添加详细日志
      console.log(`[TemplateDB] 开始激活模板: ${id}`);
      
      // 获取模板，确认是否存在
      const template = await templateDb.templates.get(id);
      if (!template) {
        console.error(`[TemplateDB] 激活模板失败: 未找到ID为 ${id} 的模板`);
        return false;
      }
      
      // 如果模板已经是激活状态，直接返回成功
      if (template.isActive === 1) {
        console.log(`[TemplateDB] 模板 ${id} 已经是激活状态`);
        return true;
      }
      
      // 使用事务处理激活操作
      await templateDb.transaction('rw', templateDb.templates, async () => {
        console.log(`[TemplateDB] 开始事务: 取消所有模板的激活状态并激活模板 ${id}`);
        
        // 取消所有模板的激活状态
        const deactivatedCount = await templateDb.templates
          .where('isActive')
          .equals(1)
          .modify({ isActive: 0 });
        
        console.log(`[TemplateDB] 已取消 ${deactivatedCount} 个模板的激活状态`);
        
        // 激活目标模板
        await templateDb.templates.update(id, { 
          isActive: 1,
          updatedAt: Date.now()
        });
        
        console.log(`[TemplateDB] 已激活模板 ${id}`);
      });
      
      console.log(`[TemplateDB] 成功完成模板 ${id} 的激活`);
      return true;
    } catch (error) {
      console.error(`[TemplateDB] 激活模板 ${id} 时发生错误:`, error);
      return false;
    }
  },
  
  /**
   * 复制标准模板到当前模板
   */
  async copyStandardToTemplate(id: string): Promise<boolean> {
    try {
      // 获取标准模板和目标模板
      const standardTemplate = await templateDb.templates.get('standard-template');
      const targetTemplate = await templateDb.templates.get(id);
      
      if (!standardTemplate || !targetTemplate) {
        console.error('复制标准模板失败: 模板不存在');
        return false;
      }
      
      // 不允许修改内置模板
      if (targetTemplate.isBuiltIn) {
        console.error('复制标准模板失败: 不允许修改内置模板');
        return false;
      }
      
      // 更新目标模板内容
      await templateDb.templates.update(id, {
        content: standardTemplate.content,
        updatedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('复制标准模板失败:', error);
      return false;
    }
  },
  
  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const template = await templateDb.templates.get(id);
      if (!template) {
        console.error('删除模板失败: 未找到模板', id);
        return false;
      }
      
      // 不允许删除内置模板
      if (template.isBuiltIn) {
        console.error('删除模板失败: 不允许删除内置模板', id);
        return false;
      }
      
      // 如果要删除的是激活模板，需要激活标准模板
      if (template.isActive === 1) {
        await templateDb.transaction('rw', templateDb.templates, async () => {
          // 删除模板
          await templateDb.templates.delete(id);
          
          // 激活标准模板
          await templateDb.templates
            .where('id')
            .equals('standard-template')
            .modify({ isActive: 1 });
        });
      } else {
        // 直接删除
        await templateDb.templates.delete(id);
      }
      
      return true;
    } catch (error) {
      console.error('删除模板失败:', error);
      return false;
    }
  },
  
  /**
   * 生成ID
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
};

// 导出方便访问的函数
export const {
  initTemplateDb,
  getAllTemplates,
  getTemplate,
  getActiveTemplate,
  createTemplate,
  updateTemplate,
  activateTemplate,
  copyStandardToTemplate,
  deleteTemplate,
  generateId
} = templateDbService;
