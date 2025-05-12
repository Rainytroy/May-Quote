/**
 * PromptTemplateContext.tsx
 * 
 * 提示词模板上下文管理组件，负责管理提示词模板的储存、加载和激活
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PromptTemplateSet, PromptTemplateContextType } from '../types';
import { getDefaultPromptTemplates, validatePromptTemplate } from '../core/PromptProcessor';

// 创建上下文
const PromptTemplateContext = createContext<PromptTemplateContextType | undefined>(undefined);

// 提示词模板上下文的本地存储键
const STORAGE_KEY = 'shenyu-prompt-templates';
const ACTIVE_TEMPLATE_KEY = 'shenyu-active-template';

/**
 * 提示词模板提供者组件
 */
export const PromptTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 所有模板
  const [templates, setTemplates] = useState<PromptTemplateSet[]>([]);
  // 当前激活的模板
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplateSet | null>(null);
  
  // 初始化加载模板
  useEffect(() => {
    loadTemplates();
  }, []);
  
  /**
   * 从本地存储加载模板
   */
  const loadTemplates = async () => {
    try {
      // 从本地存储获取模板
      const storedTemplates = localStorage.getItem(STORAGE_KEY);
      let parsedTemplates: PromptTemplateSet[] = [];
      
      if (storedTemplates) {
        parsedTemplates = JSON.parse(storedTemplates);
      }
      
      // 如果没有存储的模板或模板为空，加载默认模板
      if (!parsedTemplates || parsedTemplates.length === 0) {
        parsedTemplates = getDefaultPromptTemplates();
      }
      
      setTemplates(parsedTemplates);
      
      // 加载激活的模板
      const activeTemplateId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
      if (activeTemplateId) {
        const active = parsedTemplates.find(t => t.id === activeTemplateId);
        setActiveTemplate(active || parsedTemplates.find(t => t.isDefault) || parsedTemplates[0]);
      } else {
        // 如果没有指定激活的模板，选择默认模板或第一个模板
        setActiveTemplate(parsedTemplates.find(t => t.isDefault) || parsedTemplates[0]);
      }
    } catch (error) {
      console.error('加载提示词模板失败:', error);
      
      // 加载失败时，使用默认模板
      const defaultTemplates = getDefaultPromptTemplates();
      setTemplates(defaultTemplates);
      setActiveTemplate(defaultTemplates.find(t => t.isDefault) || defaultTemplates[0]);
    }
  };
  
  /**
   * 保存模板到本地存储
   */
  const saveTemplates = (updatedTemplates: PromptTemplateSet[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error('保存提示词模板失败:', error);
    }
  };
  
  /**
   * 保存激活的模板ID
   */
  const saveActiveTemplateId = (id: string) => {
    try {
      localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
    } catch (error) {
      console.error('保存激活模板ID失败:', error);
    }
  };
  
  /**
   * 添加模板
   */
  const addTemplate = (template: PromptTemplateSet) => {
    // 验证模板有效性
    if (!validatePromptTemplate(template)) {
      console.error('模板验证失败:', template);
      return;
    }
    
    const newTemplates = [...templates, template];
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
  };
  
  /**
   * 更新模板
   */
  const updateTemplate = (id: string, updatedTemplate: Partial<PromptTemplateSet>) => {
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const newTemplate = {
      ...templates[index],
      ...updatedTemplate,
      updatedAt: Date.now()
    };
    
    // 验证更新后的模板
    if (!validatePromptTemplate(newTemplate)) {
      console.error('更新后的模板验证失败:', newTemplate);
      return;
    }
    
    const newTemplates = [...templates];
    newTemplates[index] = newTemplate;
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    
    // 如果正在更新的模板是当前激活的模板，更新激活模板
    if (activeTemplate && activeTemplate.id === id) {
      setActiveTemplate(newTemplate);
    }
  };
  
  /**
   * 删除模板
   */
  const deleteTemplate = (id: string) => {
    // 不允许删除默认模板
    if (templates.find(t => t.id === id)?.isDefault) {
      console.warn('不能删除默认模板');
      return;
    }
    
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    
    // 如果删除的是当前激活的模板，选择默认模板或第一个模板
    if (activeTemplate && activeTemplate.id === id) {
      const newActive = newTemplates.find(t => t.isDefault) || newTemplates[0];
      setActiveTemplate(newActive);
      if (newActive) saveActiveTemplateId(newActive.id);
    }
  };
  
  /**
   * 设置激活模板
   */
  const setActiveTemplateById = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setActiveTemplate(template);
      saveActiveTemplateId(id);
    }
  };
  
  // 上下文值
  const contextValue: PromptTemplateContextType = {
    templates,
    activeTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate: setActiveTemplateById
  };
  
  return (
    <PromptTemplateContext.Provider value={contextValue}>
      {children}
    </PromptTemplateContext.Provider>
  );
};

/**
 * 使用提示词模板上下文的Hook
 */
export const usePromptTemplates = (): PromptTemplateContextType => {
  const context = useContext(PromptTemplateContext);
  if (!context) {
    throw new Error('usePromptTemplates必须在PromptTemplateProvider内使用');
  }
  return context;
};
