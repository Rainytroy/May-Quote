import { 
  Conversation, 
  ConversationMeta 
} from '../sharedTypes';

// 数据库配置
const DB_NAME = 'may-app-db';
const DB_VERSION = 3; // 版本升级到3，以便支持扩展字段
const CONVERSATION_STORE = 'conversations';
const META_STORE = 'conversation-meta';
const CONFIG_STORE = 'app-config'; // 新增：配置存储对象

// 配置键名定义
export const CONFIG_KEYS = {
  API_KEY: 'api-key',
  MODEL: 'selected-model',
  THEME: 'app-theme',
  ACTIVE_CONVERSATION_ID: 'active-conversation-id'
};

/**
 * 打开数据库连接
 */
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('数据库打开失败');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      // 版本1：创建基本对话存储
      if (oldVersion < 1) {
        // 创建对话存储
        if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
          const conversationStore = db.createObjectStore(CONVERSATION_STORE, { keyPath: 'id' });
          conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains(META_STORE)) {
          const metaStore = db.createObjectStore(META_STORE, { keyPath: 'id' });
          metaStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      }
      
      // 版本2：添加配置存储
      if (oldVersion < 2) {
        // 创建配置存储，使用键值对格式
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
          console.log('已创建配置存储对象');
        }
      }
      
      // 版本3：支持扩展字段(May-Shenyu整合)
      if (oldVersion < 3) {
        console.log('升级数据库以支持May-Shenyu整合扩展字段');
        // 不需要修改数据库结构，因为IndexedDB可以自动处理对象中的新字段
        // 但我们可以在这里添加日志或执行其他必要的迁移任务
      }
    };
  });
}

/**
 * 保存完整对话
 */
export async function saveConversation(conversation: Conversation): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([CONVERSATION_STORE, META_STORE], 'readwrite');
    
    // 保存完整对话
    const conversationStore = tx.objectStore(CONVERSATION_STORE);
    conversationStore.put(conversation);
    
    // 同时更新元数据
    const metaStore = tx.objectStore(META_STORE);
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
      updatedAt: conversation.updatedAt
    };
    
    metaStore.put(meta);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      
      tx.onerror = (event) => {
        db.close();
        reject('保存对话失败');
      };
    });
  } catch (error) {
    console.error('保存对话失败:', error);
    throw error;
  }
}

/**
 * 获取对话元数据列表
 * 按更新时间降序排列
 */
export async function getConversationMetaList(): Promise<ConversationMeta[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const index = store.index('updatedAt');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // 按更新时间降序
      const metaList: ConversationMeta[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          metaList.push(cursor.value);
          cursor.continue();
        } else {
          db.close();
          resolve(metaList);
        }
      };
      
      request.onerror = (event) => {
        db.close();
        reject('获取对话列表失败');
      };
    });
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return [];
  }
}

/**
 * 获取完整对话
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(CONVERSATION_STORE, 'readonly');
    const store = tx.objectStore(CONVERSATION_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const conversation = (event.target as IDBRequest).result;
        db.close();
        resolve(conversation || null);
      };
      
      request.onerror = (event) => {
        db.close();
        reject('获取对话失败');
      };
    });
  } catch (error) {
    console.error('获取对话失败:', error);
    return null;
  }
}

/**
 * 删除对话
 * 增强版本：确保彻底删除并清理相关引用
 * 改进的数据库连接管理和验证机制
 */
export async function deleteConversation(id: string): Promise<boolean> {
  let db: IDBDatabase | null = null;
  
  try {
    // 先验证ID是否有效
    if (!id || typeof id !== 'string') {
      console.error('删除对话失败: 无效的ID');
      return false;
    }
    
    // 检查active-conversation-id是否指向要删除的对话
    const activeId = await getConfig(CONFIG_KEYS.ACTIVE_CONVERSATION_ID, '');
    if (activeId === id) {
      // 如果是当前活动对话，先清除这个关联
      await saveConfig(CONFIG_KEYS.ACTIVE_CONVERSATION_ID, '');
    }
    
    // 打开数据库连接 - 只打开一次
    db = await openDatabase();
    
    // 确保db不为null
    if (!db) {
      console.error('数据库连接失败');
      return false;
    }

    // 第一步：执行删除操作
    console.log(`开始删除对话: ${id}`);
    const deleteSuccess = await executeDeleteOperation(db, id);
    
    if (!deleteSuccess) {
      console.error('初次删除操作未成功完成');
      return false;
    }
    
    // 第二步：等待更长时间以确保持久化完成
    // IndexedDB需要时间将操作写入磁盘
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 第三步：验证两个存储中的记录都已被删除
    const verificationResult = await verifyDeletion(db, id);
    
    // 第四步：如果验证失败，进行重试
    if (!verificationResult.success) {
      console.log('删除验证失败，开始重试...');
      
      // 记录未被删除的存储
      if (!verificationResult.conversationDeleted) {
        console.log('对话存储中记录仍存在，重新删除');
      }
      if (!verificationResult.metaDeleted) {
        console.log('元数据存储中记录仍存在，重新删除');
      }
      
      // 执行第二次删除尝试
      const retrySuccess = await executeDeleteOperation(db, id);
      
      // 更长的等待时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次验证
      const finalVerification = await verifyDeletion(db, id);
      
      if (!finalVerification.success) {
        console.error('经过多次尝试后仍无法完全删除记录');
        // 详细记录残留的存储对象
        if (!finalVerification.conversationDeleted) {
          console.error('对话记录删除失败');
        }
        if (!finalVerification.metaDeleted) {
          console.error('元数据记录删除失败');
        }
        return false;
      }
    }
    
    console.log(`对话ID ${id} 已完全删除并已验证`);
    return true;
  } catch (error) {
    console.error('删除对话过程中发生异常:', error);
    return false;
  } finally {
    // 确保在所有操作完成后才关闭数据库连接
    if (db) {
      try {
        db.close();
        console.log('数据库连接已安全关闭');
      } catch (closeError) {
        console.error('关闭数据库连接时出错:', closeError);
      }
    }
  }
}

/**
 * 执行实际的删除操作
 * 将删除操作封装在单独的函数中以便重用
 */
async function executeDeleteOperation(db: IDBDatabase, id: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction([CONVERSATION_STORE, META_STORE], 'readwrite');
      
      // 删除完整对话
      const conversationStore = tx.objectStore(CONVERSATION_STORE);
      const conversationRequest = conversationStore.delete(id);
      
      // 跟踪单独的请求状态
      let conversationDeleted = false;
      conversationRequest.onsuccess = () => {
        console.log(`对话存储中ID为 ${id} 的记录删除请求已完成`);
        conversationDeleted = true;
      };
      
      // 删除元数据
      const metaStore = tx.objectStore(META_STORE);
      const metaRequest = metaStore.delete(id);
      
      // 跟踪单独的请求状态
      let metaDeleted = false;
      metaRequest.onsuccess = () => {
        console.log(`元数据存储中ID为 ${id} 的记录删除请求已完成`);
        metaDeleted = true;
      };
      
      // 设置事务完成回调
      tx.oncomplete = () => {
        if (conversationDeleted && metaDeleted) {
          console.log(`对话ID为 ${id} 的记录删除事务已完成`);
          resolve(true);
        } else {
          console.warn(`对话ID为 ${id} 的记录删除事务完成，但某些操作可能未成功`);
          resolve(false);
        }
      };
      
      tx.onerror = (event) => {
        console.error('删除对话事务失败:', tx.error);
        resolve(false);
      };
      
      tx.onabort = (event) => {
        console.error('删除对话事务被中止:', tx.error);
        resolve(false);
      };
    } catch (error) {
      console.error('创建删除事务失败:', error);
      resolve(false);
    }
  });
}

/**
 * 验证记录是否已从两个存储中删除
 * 返回详细的验证结果
 */
async function verifyDeletion(db: IDBDatabase, id: string): Promise<{
  success: boolean;
  conversationDeleted: boolean;
  metaDeleted: boolean;
}> {
  // 1. 验证对话存储
  const conversationResult = await verifyStoreForRecord(db, CONVERSATION_STORE, id);
  
  // 2. 验证元数据存储
  const metaResult = await verifyStoreForRecord(db, META_STORE, id);
  
  // 3. 整合结果
  return {
    success: conversationResult && metaResult,
    conversationDeleted: conversationResult,
    metaDeleted: metaResult
  };
}

/**
 * 验证特定存储中是否已删除记录
 */
async function verifyStoreForRecord(db: IDBDatabase, storeName: string, id: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          // 记录不存在，表示已成功删除
          console.log(`确认 ${storeName} 中ID为 ${id} 的记录已删除`);
          resolve(true);
        } else {
          // 记录仍然存在
          console.error(`验证失败: ${storeName} 中ID为 ${id} 的记录仍然存在`);
          resolve(false);
        }
      };
      
      request.onerror = () => {
        console.error(`验证 ${storeName} 中记录删除失败:`, request.error);
        resolve(false);
      };
      
      tx.oncomplete = () => {
        // 事务完成时不关闭连接，由主函数统一管理
      };
    } catch (error) {
      console.error(`验证 ${storeName} 时出错:`, error);
      resolve(false);
    }
  });
}

/**
 * 获取最后活动的对话ID
 */
export async function getLastActiveConversationId(): Promise<string | null> {
  try {
    const metaList = await getConversationMetaList();
    return metaList.length > 0 ? metaList[0].id : null;
  } catch (error) {
    console.error('获取最后活动对话ID失败:', error);
    return null;
  }
}

/**
 * 保存配置项
 * @param key 配置键名
 * @param value 配置值
 */
export async function saveConfig(key: string, value: string): Promise<boolean> {
  if (!key) return false;
  
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    const tx = db.transaction(CONFIG_STORE, 'readwrite');
    const store = tx.objectStore(CONFIG_STORE);
    
    // 保存配置项
    store.put({ key, value });
    
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        if (db) db.close();
        console.log(`配置项 ${key} 已保存`);
        resolve(true);
      };
      
      tx.onerror = (event) => {
        if (db) db.close();
        console.error(`保存配置项 ${key} 失败:`, tx.error);
        resolve(false);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error(`保存配置项 ${key} 时出错:`, error);
    return false;
  }
}

/**
 * 获取配置项
 * @param key 配置键名
 * @param defaultValue 默认值，如果未找到配置项则返回此值
 */
export async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
  if (!key) return defaultValue;
  
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    const tx = db.transaction(CONFIG_STORE, 'readonly');
    const store = tx.objectStore(CONFIG_STORE);
    
    return new Promise((resolve) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (db) db.close();
        const result = request.result;
        if (result && result.value !== undefined) {
          resolve(result.value);
        } else {
          resolve(defaultValue);
        }
      };
      
      request.onerror = () => {
        if (db) db.close();
        console.error(`获取配置项 ${key} 失败:`, request.error);
        resolve(defaultValue);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error(`获取配置项 ${key} 时出错:`, error);
    return defaultValue;
  }
}

/**
 * 删除配置项
 * @param key 配置键名
 */
export async function deleteConfig(key: string): Promise<boolean> {
  if (!key) return false;
  
  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    const tx = db.transaction(CONFIG_STORE, 'readwrite');
    const store = tx.objectStore(CONFIG_STORE);
    
    // 删除配置项
    store.delete(key);
    
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        if (db) db.close();
        console.log(`配置项 ${key} 已删除`);
        resolve(true);
      };
      
      tx.onerror = () => {
        if (db) db.close();
        console.error(`删除配置项 ${key} 失败:`, tx.error);
        resolve(false);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error(`删除配置项 ${key} 时出错:`, error);
    return false;
  }
}

/**
 * 简单加密函数（从storage.ts移植）
 * @param data 要加密的字符串
 */
export const encryptData = (data: string): string => {
  // 这里仅做简单混淆，生产环境应使用更安全的加密方案
  return btoa(data);
};

/**
 * 简单解密函数（从storage.ts移植）
 * @param encrypted 加密的字符串
 */
export const decryptData = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch (e) {
    return '';
  }
};

// 修改为使用IndexedDB的版本
/**
 * 保存最后活动的对话ID
 */
export async function saveActiveConversationId(id: string): Promise<boolean> {
  return await saveConfig(CONFIG_KEYS.ACTIVE_CONVERSATION_ID, id);
}

/**
 * 获取本地存储的活动对话ID
 */
export async function getActiveConversationId(): Promise<string | null> {
  const id = await getConfig(CONFIG_KEYS.ACTIVE_CONVERSATION_ID, '');
  return id || null;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * 为新对话生成标题
 */
export function generateTitle(firstMessage?: string): string {
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
}

/**
 * 清空数据库
 * 删除所有存储的对话、元数据和配置项，恢复到初始状态
 */
export async function resetDatabase(): Promise<boolean> {
  let db: IDBDatabase | null = null;
  try {
    // 打开数据库连接
    db = await openDatabase();
    
    // 创建一个包含所有存储对象的事务
    const tx = db.transaction([CONVERSATION_STORE, META_STORE, CONFIG_STORE], 'readwrite');
    
    // 清空各个存储对象
    const conversationStore = tx.objectStore(CONVERSATION_STORE);
    const metaStore = tx.objectStore(META_STORE);
    const configStore = tx.objectStore(CONFIG_STORE);
    
    // 清空所有记录
    conversationStore.clear();
    metaStore.clear();
    configStore.clear();
    
    // 等待事务完成
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        // 清空完成后关闭数据库连接
        if (db) db.close();
        
        // 同时清除任何localStorage和sessionStorage缓存
        sessionStorage.clear();
        
        console.log('数据库已重置');
        resolve(true);
      };
      
      tx.onerror = (event) => {
        if (db) db.close();
        console.error('重置数据库失败:', tx.error);
        resolve(false);
      };
    });
  } catch (error) {
    if (db) db.close();
    console.error('重置数据库时出错:', error);
    return false;
  }
}
