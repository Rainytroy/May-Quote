import React, { useState, useEffect } from 'react';
import { 
  UserInputs, 
  AdminInputs, 
  PromptBlock, 
  ExecutionStatus,
  SN43History,
  SN43ConfigFile
} from './types';
import ConfigPanel from './ConfigPanel';
import UserInterface from './UserInterface';
import HistoryPanel from './HistoryPanel';
import { sn43API } from './api';

/**
 * SN43Demo主视图组件
 * 负责整体布局、状态管理和Tab切换
 */
const SN43DemoView: React.FC = () => {
  // 激活的标签页
  const [activeTab, setActiveTab] = useState('user');
  
  // 状态定义
  const [isEditing, setIsEditing] = useState(false);
  const [inputCounter, setInputCounter] = useState(0);
  const [userInputs, setUserInputs] = useState<UserInputs>({});
  const [adminInputs, setAdminInputs] = useState<AdminInputs>({});
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([]);
  const [outputResult, setOutputResult] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [isConfigModified, setIsConfigModified] = useState(false);
  const [selectedJsonFile, setSelectedJsonFile] = useState('');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  
  // 初始化
  useEffect(() => {
    // 初始化一个空的提示词块
    if (promptBlocks.length === 0) {
      setPromptBlocks([{ text: '' }]);
    }
    
    // 加载配置
    loadSettings();
  }, []);
  
  // 加载配置
  const loadSettings = async () => {
    try {
      console.log('正在加载设置...');
      
      // 如果有选择的JSON文件，加载这个文件的配置
      if (selectedJsonFile) {
        const response = await sn43API.loadConfigFile(selectedJsonFile);
        if (response.success && response.data) {
          setUserInputs(response.data.userInputs);
          setAdminInputs(response.data.adminInputs);
          setPromptBlocks(response.data.promptBlocks);
          return;
        }
      }
      
      // 如果没有选择的文件或加载失败，使用默认配置
      setUserInputs({});
      setAdminInputs({});
      setPromptBlocks([{ text: '' }]);
      
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };
  
  // 保存配置
  const saveSettings = async () => {
    try {
      console.log('正在保存设置...');
      
      // 如果没有选择的文件，提示用户
      if (!selectedJsonFile) {
        alert('请先选择一个配置文件或创建新的配置文件');
        return;
      }
      
      // 创建配置对象
      const config: SN43ConfigFile = {
        name: selectedJsonFile.replace('.json', ''),
        description: `${selectedJsonFile}的配置`,
        language: 'zh',
        userInputs,
        adminInputs,
        promptBlocks,
        version: '1.0.0'
      };
      
      // 使用API保存配置
      const response = await sn43API.saveConfigFile(selectedJsonFile, config);
      
      if (response.success) {
        alert('配置已成功保存！');
        setIsConfigModified(false);
      } else {
        throw new Error(response.error || '保存配置失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 更新函数
  const handleUserInputsChange = (inputs: UserInputs) => {
    setUserInputs(inputs);
    setIsConfigModified(true);
  };
  
  const handleAdminInputsChange = (inputs: AdminInputs) => {
    setAdminInputs(inputs);
    setIsConfigModified(true);
  };
  
  const handlePromptBlocksChange = (blocks: PromptBlock[]) => {
    setPromptBlocks(blocks);
    setIsConfigModified(true);
  };
  
  const handleInputCounterChange = (value: number) => {
    setInputCounter(value);
  };
  
  const handlePreviewTextChange = (value: string) => {
    setPreviewText(value);
  };
  
  const handleIsPreviewLoadingChange = (value: boolean) => {
    setIsPreviewLoading(value);
  };
  
  const handleSelectedJsonFileChange = (value: string) => {
    setSelectedJsonFile(value);
  };
  
  // 处理配置修改
  const handleConfigModified = () => {
    setIsConfigModified(true);
  };
  
  // 执行完成处理
  const handleExecutionComplete = (result: string) => {
    setOutputResult(result);
    setExecutionStatus(ExecutionStatus.COMPLETED);
    setIsEditing(true);
    
    // TODO: 更新历史记录
  };
  
  // 选择历史记录
  const handleSelectHistory = (history: SN43History) => {
    // 设置状态
    setUserInputs(history.userInputs);
    setAdminInputs(history.adminInputs);
    setPromptBlocks(history.promptBlocks);
    setOutputResult(history.result || '');
    setSelectedJsonFile(history.selectedJsonFile || '');
    setIsEditing(true);
    setIsConfigModified(false);
    
    console.log('已加载历史记录:', history.id);
  };
  
  // 开启新对话
  const startNewChat = () => {
    console.log('开始新对话');
    
    // 重置编辑状态
    setIsEditing(false);
    
    // 清空所有状态
    setUserInputs({});
    setAdminInputs({});
    setPromptBlocks([{ text: '' }]);
    setOutputResult('');
    setPreviewText('');
    setInputCounter(0);
    setSelectedJsonFile('');
    
    // 重置配置修改状态
    setIsConfigModified(false);
    
    alert('已创建新对话');
  };
  
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
          神谕 SN43
        </div>
        <button
          onClick={saveSettings}
          className="save-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            backgroundColor: 'transparent',
            color: 'var(--text-light-gray)',
            border: 'none',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--brand-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-light-gray)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          保存配置
        </button>
      </nav>
      
      {/* 主内容区 */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* 历史记录面板 */}
        <HistoryPanel 
          storageKey="sn43-history"
          onSelect={handleSelectHistory}
          onNewChat={startNewChat}
        />
        
        {/* 内容区域 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-md)',
          overflowY: 'auto'
        }}>
          {/* 标签页选择器 */}
          <div className="tabs" style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 'var(--space-md)'
          }}>
            <button
              onClick={() => setActiveTab('user')}
              className={`tab ${activeTab === 'user' ? 'active' : ''}`}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: activeTab === 'user' ? 'var(--secondary-bg)' : 'transparent',
                color: activeTab === 'user' ? 'var(--brand-color)' : 'var(--text-light-gray)',
                border: 'none',
                borderBottom: activeTab === 'user' ? '2px solid var(--brand-color)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'user' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              用户界面
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: activeTab === 'admin' ? 'var(--secondary-bg)' : 'transparent',
                color: activeTab === 'admin' ? 'var(--brand-color)' : 'var(--text-light-gray)',
                border: 'none',
                borderBottom: activeTab === 'admin' ? '2px solid var(--brand-color)' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'admin' ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              配置面板
            </button>
          </div>
          
          {/* 标签页内容 */}
          <div className="tab-content" style={{ flex: 1 }}>
            {activeTab === 'user' ? (
              <UserInterface
                userInputs={userInputs}
                adminInputs={adminInputs}
                promptBlocks={promptBlocks}
                isEditing={isEditing}
                outputResult={outputResult}
                inputCounter={inputCounter}
                isConfigModified={isConfigModified}
                selectedJsonFile={selectedJsonFile}
                onUpdateUserInputs={handleUserInputsChange}
                onUpdateAdminInputs={handleAdminInputsChange}
                onUpdatePromptBlocks={handlePromptBlocksChange}
                onUpdateInputCounter={handleInputCounterChange}
                onUpdateSelectedJsonFile={handleSelectedJsonFileChange}
                onExecutionComplete={handleExecutionComplete}
              />
            ) : (
              <ConfigPanel
                adminInputs={adminInputs}
                userInputs={userInputs}
                promptBlocks={promptBlocks}
                inputCounter={inputCounter}
                previewText={previewText}
                isPreviewLoading={isPreviewLoading}
                onUpdateAdminInputs={handleAdminInputsChange}
                onUpdateUserInputs={handleUserInputsChange}
                onUpdatePromptBlocks={handlePromptBlocksChange}
                onUpdateInputCounter={handleInputCounterChange}
                onUpdatePreviewText={handlePreviewTextChange}
                onUpdateIsPreviewLoading={handleIsPreviewLoadingChange}
                onConfigModified={handleConfigModified}
              />
            )}
          </div>
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
          状态: {isConfigModified ? '配置已修改' : '已保存'}
        </div>
        <div>
          SN43Demo v0.1.0
        </div>
      </div>
    </div>
  );
};

export default SN43DemoView;
