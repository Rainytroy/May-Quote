import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getDefaultFirstStagePrompt, getDefaultSecondStagePrompt, TemplateType } from '../AgentConfigPanel/promptTemplates';
import { openDatabase, generateId } from '../../../utils/storage-db'; // 导入数据库工具

// 定义常量
const PROMPT_TEMPLATE_STORE = 'prompt-templates';
const ACTIVE_TEMPLATE_ID_KEY = 'sn43_activePromptTemplateId';

// 提示词模板的数据结构
export interface PromptTemplateSet {
  id: string; // 唯一ID
  name: string; // 用户定义的名称
  firstStage: string;
  secondStage: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean; // 标记是否为不可删除的默认模板
  version?: string; // 版本标识，用于检测内容更新
  hidden?: boolean; // 标记是否在列表中隐藏，不向用户显示
}

interface PromptTemplateContextType {
  activeTemplates: PromptTemplateSet; // 当前激活的模板
  savedTemplates: PromptTemplateSet[]; // 所有已保存的模板列表
  loadTemplates: () => Promise<void>; // 从数据库加载所有模板
  setActiveTemplate: (templateId: string) => Promise<void>; // 设置激活模板
  saveTemplate: (template: Omit<PromptTemplateSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<PromptTemplateSet | null>; // 保存（新建或更新）模板
  deleteTemplate: (templateId: string) => Promise<void>; // 删除模板
  resetToDefaultTemplates: (templateType?: TemplateType) => Promise<void>; // 重置当前激活模板为指定版本的默认值
}

const PromptTemplateContext = createContext<PromptTemplateContextType | undefined>(undefined);

export const PromptTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 原版提示词模板
  const originalTemplate: PromptTemplateSet = {
    id: 'default',
    name: '原版提示词',
    firstStage: getDefaultFirstStagePrompt(TemplateType.ORIGINAL),
    secondStage: getDefaultSecondStagePrompt(TemplateType.ORIGINAL),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
  };

  // 迭代版提示词模板 - 不对用户显示，仅作为内部引用
  const advancedTemplate: PromptTemplateSet = {
    id: 'advanced',
    name: '迭代版提示词',
    firstStage: getDefaultFirstStagePrompt(TemplateType.ADVANCED),
    secondStage: getDefaultSecondStagePrompt(TemplateType.ADVANCED),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    hidden: true, // 标记为隐藏，不在列表中显示
  };
  
  // 迭代版2.0提示词模板 (添加版本标识)
  const iteration2Template: PromptTemplateSet = {
    id: 'iteration2',
    name: '迭代版2.0',
    firstStage: getDefaultFirstStagePrompt(TemplateType.ITERATION_2),
    secondStage: getDefaultSecondStagePrompt(TemplateType.ITERATION_2),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    version: 'v2.0.1', // 与下方检查使用的版本号一致
  };

  const [activeTemplates, setActiveTemplates] = useState<PromptTemplateSet>(originalTemplate);
  const [savedTemplates, setSavedTemplates] = useState<PromptTemplateSet[]>([]);

  const DB_NAME = 'sn43-templates-db'; // 使用独立的数据库名称
  const DB_VERSION = 1; // 从1开始，因为这是全新的数据库

  // 数据库升级逻辑 - 适用于新的数据库
  const upgradeDb = (db: IDBDatabase, oldVersion: number) => {
    // 对于新数据库，从版本0开始
    if (oldVersion < 1) {
      // 创建提示词模板存储
      if (!db.objectStoreNames.contains(PROMPT_TEMPLATE_STORE)) {
        const store = db.createObjectStore(PROMPT_TEMPLATE_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('已创建提示词模板存储对象');
      }
    }
  };
  
  // 修改 openDatabase 调用以包含升级逻辑
  const getDb = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject('数据库打开失败');
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        upgradeDb(db, event.oldVersion);
        // 注意：onupgradeneeded 完成后会自动调用 onsuccess
      };
    });
  };


  const loadTemplates = useCallback(async () => {
    try {
      const db = await getDb();
      const tx = db.transaction(PROMPT_TEMPLATE_STORE, 'readonly');
      const store = tx.objectStore(PROMPT_TEMPLATE_STORE);
      const allTemplates = await new Promise<PromptTemplateSet[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      
      // 确保默认模板存在于列表中且名称正确
      let templatesToSet = allTemplates;
      const hasOriginalTemplate = templatesToSet.find(t => t.id === 'default');
      const hasAdvancedTemplate = templatesToSet.find(t => t.id === 'advanced');
      const hasIteration2Template = templatesToSet.find(t => t.id === 'iteration2');
      
      // 检查是否需要更新或添加默认模板
      const writeTx = db.transaction(PROMPT_TEMPLATE_STORE, 'readwrite');
      const writeStore = writeTx.objectStore(PROMPT_TEMPLATE_STORE);
      let needsUpdate = false;
      
      // 处理原版提示词模板
      if (!hasOriginalTemplate) {
        // 如果不存在，则添加
        writeStore.put(originalTemplate);
        templatesToSet = [originalTemplate, ...templatesToSet];
        needsUpdate = true;
      } else if (hasOriginalTemplate.name !== '原版提示词') {
        // 如果存在但名称不正确，则更新
        const updatedTemplate = {
          ...hasOriginalTemplate,
          name: '原版提示词'
        };
        writeStore.put(updatedTemplate);
        // 更新本地列表中的名称
        templatesToSet = templatesToSet.map(t => 
          t.id === 'default' ? updatedTemplate : t
        );
        needsUpdate = true;
      }
      
      // 处理迭代版提示词模板
      if (!hasAdvancedTemplate) {
        // 如果不存在，则添加
        writeStore.put(advancedTemplate);
        templatesToSet = [advancedTemplate, ...templatesToSet];
        needsUpdate = true;
      } else if (hasAdvancedTemplate.name !== '迭代版提示词') {
        // 如果存在但名称不正确，则更新
        const updatedTemplate = {
          ...hasAdvancedTemplate,
          name: '迭代版提示词'
        };
        writeStore.put(updatedTemplate);
        // 更新本地列表中的名称
        templatesToSet = templatesToSet.map(t => 
          t.id === 'advanced' ? updatedTemplate : t
        );
        needsUpdate = true;
      }
      
      // 处理迭代版2.0提示词模板
      // 添加版本标识符，用于检测模板内容是否是最新的
      const iteration2Version = 'v2.0.1'; // 版本标识，每次更新模板内容时递增
      
      if (!hasIteration2Template) {
        // 如果不存在，则添加
        writeStore.put(iteration2Template);
        templatesToSet = [iteration2Template, ...templatesToSet];
        needsUpdate = true;
      } else if (hasIteration2Template.name !== '迭代版2.0' || 
                 !hasIteration2Template.version || 
                 hasIteration2Template.version !== iteration2Version) {
        // 如果存在但名称不正确或版本不是最新的，则更新
        console.log("更新迭代版2.0模板到最新版本", iteration2Version);
        const updatedTemplate = {
          ...hasIteration2Template,
          name: '迭代版2.0',
          firstStage: getDefaultFirstStagePrompt(TemplateType.ITERATION_2),
          secondStage: getDefaultSecondStagePrompt(TemplateType.ITERATION_2),
          version: iteration2Version,
          updatedAt: Date.now()
        };
        writeStore.put(updatedTemplate);
        // 更新本地列表中的模板
        templatesToSet = templatesToSet.map(t => 
          t.id === 'iteration2' ? updatedTemplate : t
        );
        needsUpdate = true;
      }
      
      // 完成事务
      if (needsUpdate) {
        await new Promise(r => writeTx.oncomplete = r);
      } else {
        writeTx.abort(); // 如果没有需要更新的内容，中止事务
      }
      
      setSavedTemplates(templatesToSet.sort((a, b) => b.updatedAt - a.updatedAt));

      const activeId = localStorage.getItem(ACTIVE_TEMPLATE_ID_KEY) || 'advanced';
      const active = templatesToSet.find(t => t.id === activeId) || advancedTemplate;
      setActiveTemplates(active);
      
      db.close();
      console.log('提示词模板已加载:', templatesToSet, '激活模板:', active.name);
    } catch (error) {
      console.error('加载提示词模板失败:', error);
      setSavedTemplates([originalTemplate]); // 至少有默认模板
      setActiveTemplates(originalTemplate);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const saveTemplate = async (templateData: Omit<PromptTemplateSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PromptTemplateSet | null> => {
    try {
      const db = await getDb();
      const tx = db.transaction(PROMPT_TEMPLATE_STORE, 'readwrite');
      const store = tx.objectStore(PROMPT_TEMPLATE_STORE);
      
      const now = Date.now();
      let templateToSave: PromptTemplateSet;

      if (templateData.id && templateData.id !== 'default') { // 更新现有模板 (非默认)
        const existing = await new Promise<PromptTemplateSet | undefined>(r => {
          const req = store.get(templateData.id!);
          req.onsuccess = () => r(req.result);
          req.onerror = () => r(undefined);
        });
        if (!existing || existing.isDefault) {
          console.error('不能修改默认模板或模板不存在');
          db.close();
          return null;
        }
        templateToSave = { ...existing, ...templateData, name: templateData.name, firstStage: templateData.firstStage, secondStage: templateData.secondStage, updatedAt: now };
      } else { // 创建新模板
        templateToSave = {
          id: generateId(),
          name: templateData.name,
          firstStage: templateData.firstStage,
          secondStage: templateData.secondStage,
          createdAt: now,
          updatedAt: now,
        };
      }
      
      await new Promise<void>((resolve, reject) => {
        const req = store.put(templateToSave);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      
      await new Promise(r => tx.oncomplete = r);
      db.close();
      
      await loadTemplates(); // 重新加载以更新列表和激活状态
      setActiveTemplate(templateToSave.id); // 保存后自动设为激活
      console.log('提示词模板已保存:', templateToSave.name);
      return templateToSave;
    } catch (error) {
      console.error('保存提示词模板失败:', error);
      return null;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (templateId === 'default') {
      console.warn('不能删除默认模板');
      return;
    }
    try {
      const db = await getDb();
      const tx = db.transaction(PROMPT_TEMPLATE_STORE, 'readwrite');
      const store = tx.objectStore(PROMPT_TEMPLATE_STORE);
      await new Promise<void>((resolve, reject) => {
        const req = store.delete(templateId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      await new Promise(r => tx.oncomplete = r);
      db.close();
      
      // 如果删除的是当前激活的模板，则重置为原版模板
      if (activeTemplates.id === templateId) {
        setActiveTemplates(originalTemplate);
        localStorage.setItem(ACTIVE_TEMPLATE_ID_KEY, 'default');
      }
      await loadTemplates(); // 重新加载列表
      console.log('提示词模板已删除:', templateId);
    } catch (error) {
      console.error('删除提示词模板失败:', error);
    }
  };

  const setActiveTemplate = async (templateId: string) => {
    const templateToActivate = savedTemplates.find(t => t.id === templateId) || originalTemplate;
    setActiveTemplates(templateToActivate);
    localStorage.setItem(ACTIVE_TEMPLATE_ID_KEY, templateToActivate.id);
    console.log('激活的提示词模板已设置为:', templateToActivate.name);
  };
  
  const resetToDefaultTemplates = async (templateType?: TemplateType) => {
    // 注意：这个方法现在在PromptTemplateEditor中被重新实现
    // 这里保留是为了向后兼容，但实际使用时建议使用Editor中直接操作的版本
    // 这不再是切换模板，而是获取默认模板内容的参考API
    let template;
    switch (templateType) {
      case TemplateType.ADVANCED:
        template = advancedTemplate;
        break;
      case TemplateType.ITERATION_2:
        template = iteration2Template;
        break;
      default:
        template = originalTemplate;
    }
    setActiveTemplates(template);
    localStorage.setItem(ACTIVE_TEMPLATE_ID_KEY, template.id);
    console.log(`激活的提示词模板已设置为${template.name}。`);
  };

  return (
    <PromptTemplateContext.Provider value={{ 
      activeTemplates, 
      savedTemplates,
      loadTemplates,
      setActiveTemplate,
      saveTemplate,
      deleteTemplate,
      resetToDefaultTemplates
    }}>
      {children}
    </PromptTemplateContext.Provider>
  );
};

export const usePromptTemplates = (): PromptTemplateContextType => {
  const context = useContext(PromptTemplateContext);
  if (!context) {
    throw new Error('usePromptTemplates必须在PromptTemplateProvider内部使用');
  }
  return context;
};
