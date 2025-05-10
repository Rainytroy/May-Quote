import React from 'react';
import AgentConfigPanel from './AgentConfigPanel';

/**
 * SN43Demo主视图组件
 */
const SN43DemoView: React.FC = () => {
  return (
    <div className="app-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      color: 'var(--text-white)',
      backgroundColor: 'var(--main-bg)'
    }}>
      {/* 顶部导航 */}
      <nav className="navbar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
        height: 'var(--nav-height)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="logo" style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'bold',
          color: 'var(--brand-color)'
        }}>
          神谕 Agent生成器
        </div>
      </nav>
      
      {/* 主内容区 */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Agent生成器面板 */}
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
      </div>
      
      {/* 底部状态栏 */}
      <div className="status-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-sm) var(--space-md)',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-light-gray)',
        fontSize: 'var(--font-xs)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div>
          神谕 Agent生成器
        </div>
        <div>
          SN43Demo v0.1.0
        </div>
      </div>
    </div>
  );
};

export default SN43DemoView;
