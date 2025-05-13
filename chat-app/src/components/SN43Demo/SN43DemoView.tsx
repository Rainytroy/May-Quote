import React, { useState } from 'react';
import AgentConfigPanel from './AgentConfigPanel';
import PromptTemplateEditor from './PromptTemplateEditor'; 
import { PromptTemplateProvider } from './contexts/PromptTemplateContext';
import ApiStatusIndicator from './AgentConfigPanel/components/ApiStatusIndicator';

type ActiveTab = 'generator' | 'templates';

/**
 * SN43Demo主视图组件
 */
const SN43DemoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

  return (
    <PromptTemplateProvider>
      <div className="app-container" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        color: 'var(--text-white)',
        backgroundColor: 'var(--main-bg)'
      }}>
        {/* 合并的VS Code风格顶部导航栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--secondary-bg)',
          borderBottom: '1px solid var(--border-color)',
          height: '40px'
        }}>
          {/* 面包屑式Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 'var(--space-lg)',
            paddingRight: 'var(--space-lg)',
            fontSize: 'var(--font-md)',
            color: 'var(--brand-color)',
            fontWeight: 'bold'
          }}>
            May <span style={{color: 'var(--text-light-gray)', padding: '0 4px'}}>/</span> 
            插件 <span style={{color: 'var(--text-light-gray)', padding: '0 4px'}}>/</span> 
            神谕Agent
          </div>
          
          {/* 版本信息 */}
          <div style={{ 
            marginLeft: 'auto',
            color: 'var(--text-light-gray)',
            fontSize: 'var(--font-xs)',
            paddingRight: 'var(--space-md)'
          }}>
            SN43Demo v0.1.1
          </div>
          
          {/* API状态指示器 */}
          <div style={{ paddingRight: 'var(--space-md)' }}>
            <ApiStatusIndicator />
          </div>
          
          {/* 标签页导航 */}
          <div 
            onClick={() => setActiveTab('generator')}
            style={{
              padding: '0 var(--space-lg)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              color: activeTab === 'generator' ? 'var(--text-white)' : 'var(--text-light-gray)',
              fontWeight: activeTab === 'generator' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'generator' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeTab === 'generator' ? 'var(--main-bg)' : 'transparent',
              transition: 'background-color 0.15s'
            }}
          >
            Agent生成器
          </div>
          <div 
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '0 var(--space-lg)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              color: activeTab === 'templates' ? 'var(--text-white)' : 'var(--text-light-gray)',
              fontWeight: activeTab === 'templates' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'templates' ? '2px solid var(--brand-color)' : 'none',
              backgroundColor: activeTab === 'templates' ? 'var(--main-bg)' : 'transparent',
              transition: 'background-color 0.15s'
            }}
          >
            提示词模板
          </div>
        </div>
        
        {/* 主内容区 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          width: '100%'
        }}>
          {activeTab === 'generator' && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              <AgentConfigPanel 
                onControlsGenerated={(controls) => {
                  console.log('Agent生成的控件:', controls);
                }}
              />
            </div>
          )}
          {activeTab === 'templates' && (
            <PromptTemplateEditor />
          )}
        </div>
        

      </div>
    </PromptTemplateProvider>
  );
};

export default SN43DemoView;
