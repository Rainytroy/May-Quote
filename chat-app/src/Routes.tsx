import React from 'react';
import App from './App';
import PluginDemo from './components/Plugin/PluginDemo';
import SN43DemoView from './components/SN43Demo/SN43DemoView';
import TemplateManagerPage from './pages/TemplateManagerPage';

/**
 * 简单的路由组件，根据URL参数决定显示主应用还是演示页面
 * 访问方式：
 * - 插件演示页面: ?demo=plugin (通过键盘快捷键：fn+A+P+I)
 * - Shenyu演示页面: ?demo=shenyu
 * - 提示词模板管理页面: ?template-manager
 */
const Routes: React.FC = () => {
  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const demoType = urlParams.get('demo');
  const hasTemplateManager = urlParams.has('template-manager');

  // 根据参数显示不同的组件
  if (demoType === 'plugin') {
    return <PluginDemo />;
  } else if (demoType === 'shenyu') {
    return <SN43DemoView />;
  } else if (hasTemplateManager) {
    return <TemplateManagerPage />;
  } else {
    return <App />;
  }
};

export default Routes;
