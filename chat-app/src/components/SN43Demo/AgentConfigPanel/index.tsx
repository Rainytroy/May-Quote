import React, { useState } from 'react';
import { ControlDefinition } from '../Controls/DynamicControl';
import AgentPromptEditor from '../AgentPromptEditor';
import AgentGenerator from '../AgentGenerator';
import ControlsContainer from '../Controls/ControlsContainer';

interface AgentConfigPanelProps {
  onControlsGenerated?: (controls: ControlDefinition[]) => void;
}

/**
 * Agent配置面板
 * 
 * 集成Agent生成器和Agent提示词编辑器
 * 负责：
 * 1. 提供AI生成控件的提示词编辑
 * 2. 根据用户需求，生成控件配置
 * 3. 预览生成的控件
 */
const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  onControlsGenerated
}) => {
  // 状态
  const [activeTab, setActiveTab] = useState<'prompt' | 'generator' | 'preview'>('generator');
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [generatedControls, setGeneratedControls] = useState<ControlDefinition[]>([]);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  
  // 保存提示词
  const handleSavePrompt = (prompt: string) => {
    setAgentPrompt(prompt);
  };
  
  // 处理控件生成
  const handleControlsGenerated = (controls: ControlDefinition[]) => {
    setGeneratedControls(controls);
    
    // 切换到预览选项卡
    setActiveTab('preview');
    
    // 通知父组件
    if (onControlsGenerated) {
      onControlsGenerated(controls);
    }
  };
  
  // 处理控件值变化
  const handleControlValuesChange = (values: Record<string, any>) => {
    setControlValues(values);
  };
  
  return (
    <div className="agent-config-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      {/* 标题和选项卡 */}
      <div>
        <h2 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>
          Agent配置面板
        </h2>
        
        {/* 选项卡 */}
        <div className="tabs" style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 'var(--space-md)'
        }}>
          <button
            onClick={() => setActiveTab('generator')}
            className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: activeTab === 'generator' ? 'var(--secondary-bg)' : 'transparent',
              color: activeTab === 'generator' ? 'var(--brand-color)' : 'var(--text-light-gray)',
              border: 'none',
              borderBottom: activeTab === 'generator' ? '2px solid var(--brand-color)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'generator' ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            Agent生成器
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: activeTab === 'preview' ? 'var(--secondary-bg)' : 'transparent',
              color: activeTab === 'preview' ? 'var(--brand-color)' : 'var(--text-light-gray)',
              border: 'none',
              borderBottom: activeTab === 'preview' ? '2px solid var(--brand-color)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'preview' ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            控件预览
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`tab ${activeTab === 'prompt' ? 'active' : ''}`}
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: activeTab === 'prompt' ? 'var(--secondary-bg)' : 'transparent',
              color: activeTab === 'prompt' ? 'var(--brand-color)' : 'var(--text-light-gray)',
              border: 'none',
              borderBottom: activeTab === 'prompt' ? '2px solid var(--brand-color)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'prompt' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              marginLeft: 'auto' // 将提示词编辑器标签放到最右边
            }}
          >
            提示词编辑器
          </button>
        </div>
      </div>
      
      {/* 标签页内容区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'generator' && (
          <AgentGenerator 
            agentPrompt={agentPrompt}
            onControlsGenerated={handleControlsGenerated}
          />
        )}
        
        {activeTab === 'preview' && (
          <div style={{ height: '100%' }}>
            <h3 style={{ color: 'var(--text-white)', marginBottom: 'var(--space-md)' }}>
              控件预览
            </h3>
            <div style={{
              backgroundColor: 'var(--card-bg)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              height: 'calc(100% - 40px)' // 减去标题高度
            }}>
              {generatedControls.length > 0 ? (
                <ControlsContainer
                  userInputs={{}}
                  adminInputs={{}}
                  promptBlocks={[]}
                  onControlValuesChange={handleControlValuesChange}
                  presetControls={generatedControls}
                />
              ) : (
                <div style={{ 
                  color: 'var(--text-light-gray)', 
                  textAlign: 'center',
                  padding: 'var(--space-xl)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <p>还没有生成控件</p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    style={{
                      backgroundColor: 'var(--secondary-bg)',
                      color: 'var(--text-white)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-xs) var(--space-sm)',
                      cursor: 'pointer',
                      marginTop: 'var(--space-md)'
                    }}
                  >
                    前往生成控件
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'prompt' && (
          <AgentPromptEditor
            defaultPrompt={agentPrompt}
            onSavePrompt={handleSavePrompt}
          />
        )}
      </div>
    </div>
  );
};

export default AgentConfigPanel;
