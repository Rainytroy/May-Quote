import React from 'react';
import PromptTemplateManager from '../components/Shenyu/ui/template/PromptTemplateManager';

/**
 * 提示词模板管理页面
 * 
 * 用于通过URL参数访问模板管理器
 */
const TemplateManagerPage: React.FC = () => {
  return (
    <div className="app-container">
      <PromptTemplateManager />
    </div>
  );
};

export default TemplateManagerPage;
