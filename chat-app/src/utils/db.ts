/**
 * Dexie数据库服务
 * 使用Dexie.js提供更可靠的IndexedDB访问
 */

import Dexie from 'dexie';
import { Conversation, ConversationMeta } from '../types';

// 定义数据库类
class MayDatabase extends Dexie {
  // 表定义
  conversations!: Dexie.Table<Conversation, string>;
  conversationMetas!: Dexie.Table<ConversationMeta, string>;
  settings!: Dexie.Table<{key: string, value: string}, string>;

  constructor() {
    super('may-app-db');
    
    // 定义数据库结构
    this.version(1).stores({
      // 主对话表：存储完整对话内容
      conversations: 'id, updatedAt',
      
      // 对话元数据表：存储对话概要信息，用于列表显示
      conversationMetas: 'id, updatedAt, title',
      
      // 设置表：存储应用配置
      settings: 'key'
    });
  }
  
  // 删除对话的事务方法 - 单一事务处理多表操作
  async deleteConversation(id: string): Promise<boolean> {
    try {
      // 检查是否为当前活动对话
      const activeId = await this.settings.get('active-conversation-id');
      
      // 在单一事务中处理所有操作
      await this.transaction('rw', 
        [this.conversations, this.conversationMetas, this.settings], 
        async () => {
          // 删除主对话
          await this.conversations.delete(id);
          
          // 删除元数据
          await this.conversationMetas.delete(id);
          
          // 如果是活动对话，清除引用
          if (activeId?.value === id) {
            await this.settings.put({key: 'active-conversation-id', value: ''});
          }
      });
      
      return true;
    } catch (error) {
      console.error('删除对话失败:', error);
      return false;
    }
  }
}

// 配置键名定义
export const CONFIG_KEYS = {
  API_KEY: 'api-key',
  MODEL: 'selected-model',
  THEME: 'app-theme',
  ACTIVE_CONVERSATION_ID: 'active-conversation-id'
};

// 创建数据库单例
const db = new MayDatabase();

/**
 * 数据库服务
 * 提供应用所需的所有数据访问方法
 */
export const dbService = {
  // 保存对话（包括元数据）
  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      await db.transaction('rw', 
        [db.conversations, db.conversationMetas], 
        async () => {
          // 保存完整对话
          await db.conversations.put(conversation);
          
          // 创建并保存元数据
          const lastMessage = conversation.messages.length > 0 
            ? conversation.messages[conversation.messages.length - 1] 
            : null;
          
          const preview = lastMessage 
            ? (lastMessage.content.length > 50 
                ? lastMessage.content.substring(0, 50) + '...' 
                : lastMessage.content)
            : '';
          
          const meta: ConversationMeta = {
            id: conversation.id,
            title: conversation.title,
            preview,
            messageCount: conversation.messages.length,
            updatedAt: conversation.updatedAt,
            // 添加神谕JSON字段，如果存在的话
            ...(conversation.shenyuJson ? { shenyuJson: conversation.shenyuJson } : {})
          };
          
          await db.conversationMetas.put(meta);
      });
    } catch (error) {
      console.error('保存对话失败:', error);
      throw error;
    }
  },
  
  // 获取元数据列表
  async getConversationMetaList(): Promise<ConversationMeta[]> {
    try {
      return await db.conversationMetas
        .orderBy('updatedAt')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('获取对话列表失败:', error);
      return [];
    }
  },
  
  // 获取对话
  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const conversation = await db.conversations.get(id);
      return conversation || null;
    } catch (error) {
      console.error('获取对话失败:', error);
      return null;
    }
  },
  
  // 删除对话
  async deleteConversation(id: string): Promise<boolean> {
    return await db.deleteConversation(id);
  },
  
  // 获取最后活动的对话ID
  async getLastActiveConversationId(): Promise<string | null> {
    try {
      const metaList = await this.getConversationMetaList();
      return metaList.length > 0 ? metaList[0].id : null;
    } catch (error) {
      console.error('获取最后活动对话ID失败:', error);
      return null;
    }
  },
  
  // 保存活动对话ID
  async saveActiveConversationId(id: string): Promise<boolean> {
    try {
      await db.settings.put({ key: 'active-conversation-id', value: id });
      return true;
    } catch (error) {
      console.error('保存活动对话ID失败:', error);
      return false;
    }
  },
  
  // 获取活动对话ID
  async getActiveConversationId(): Promise<string | null> {
    try {
      const record = await db.settings.get('active-conversation-id');
      return record && record.value ? record.value : null;
    } catch (error) {
      console.error('获取活动对话ID失败:', error);
      return null;
    }
  },
  
  // 设置相关的方法
  async saveConfig(key: string, value: string): Promise<boolean> {
    try {
      await db.settings.put({key, value});
      return true;
    } catch (error) {
      console.error(`保存配置项 ${key} 失败:`, error);
      return false;
    }
  },
  
  async getConfig(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const result = await db.settings.get(key);
      return result ? result.value : defaultValue;
    } catch (error) {
      console.error(`获取配置项 ${key} 失败:`, error);
      return defaultValue;
    }
  },
  
  // 加密/解密
  encryptData(data: string): string {
    return btoa(data);
  },
  
  decryptData(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch (e) {
      return '';
    }
  },
  
  // 辅助函数
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  },
  
  generateTitle(firstMessage?: string): string {
    if (firstMessage && firstMessage.trim().length > 0) {
      // 尝试从第一条消息生成标题
      const cleanedMessage = firstMessage.trim();
      
      // 如果消息很短，直接使用
      if (cleanedMessage.length <= 20) {
        return cleanedMessage;
      }
      
      // 否则截取前20个字符
      return cleanedMessage.substring(0, 20) + '...';
    }
    
    // 默认标题：使用日期时间
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `新对话 ${dateStr} ${timeStr}`;
  },
  
  // 重置数据库
  async resetDatabase(): Promise<boolean> {
    try {
      await db.delete();
      
      // 重新创建数据库
      window.location.reload();
      return true;
    } catch (error) {
      console.error('重置数据库失败:', error);
      return false;
    }
  }
};

// 导出方便访问的函数
export const {
  saveConversation,
  getConversationMetaList,
  getConversation,
  deleteConversation,
  getLastActiveConversationId,
  saveActiveConversationId,
  getActiveConversationId,
  saveConfig,
  getConfig,
  encryptData,
  decryptData,
  generateId,
  generateTitle,
  resetDatabase
} = dbService;
