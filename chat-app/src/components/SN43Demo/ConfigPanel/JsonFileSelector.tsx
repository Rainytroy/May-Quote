import React, { useState, useEffect } from 'react';
import { SN43ConfigFile } from '../types';
import { sn43API } from '../api';

interface JsonFileSelectorProps {
  selectedFile: string;
  onSelectFile: (filename: string) => void;
  onLoadConfig: (config: SN43ConfigFile) => void;
}

/**
 * JSON文件选择器组件
 * 
 * 负责提供预设配置文件的选择，包括：
 * - 加载和显示可用配置文件列表
 * - 加载和解析选中的JSON配置
 * - 支持不同语言版本
 */
const JsonFileSelector: React.FC<JsonFileSelectorProps> = ({
  selectedFile,
  onSelectFile,
  onLoadConfig
}) => {
  // 本地状态
  const [jsonFiles, setJsonFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 初始化时加载文件列表
  useEffect(() => {
    loadJsonFiles();
  }, []);
  
  // 加载JSON文件列表
  const loadJsonFiles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用API加载文件列表
      const response = await sn43API.loadConfigFiles();
      
      if (response.success && response.data) {
        setJsonFiles(response.data);
        
        // 如果没有选中的文件但有文件列表，自动选中第一个
        if (!selectedFile && response.data.length > 0) {
          handleSelectFile(response.data[0]);
        }
      } else {
        throw new Error(response.error || '加载配置文件列表失败');
      }
    } catch (error) {
      console.error('加载JSON文件列表失败:', error);
      setError('加载配置文件列表失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 选择文件
  const handleSelectFile = async (filename: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 通知父组件选中的文件名
      onSelectFile(filename);
      
      // 使用API加载配置文件内容
      const response = await sn43API.loadConfigFile(filename);
      
      if (response.success && response.data) {
        // 通知父组件配置内容
        onLoadConfig(response.data);
      } else {
        throw new Error(response.error || `加载配置文件 ${filename} 失败`);
      }
    } catch (error) {
      console.error('加载JSON文件失败:', error);
      setError(error instanceof Error ? error.message : `加载配置文件 ${filename} 失败`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 是否需要显示加载中状态
  const showSpinner = isLoading;
  
  return (
    <div className="json-file-selector" style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-sm)'
      }}>
        <h3 style={{ color: 'var(--text-white)' }}>配置文件</h3>
        <button
          onClick={loadJsonFiles}
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--secondary-bg)',
            color: 'var(--text-light-gray)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 'var(--font-sm)'
          }}
        >
          刷新
        </button>
      </div>
      
      {/* 文件列表 */}
      <div className="file-list-container" style={{ 
        backgroundColor: 'var(--main-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {showSpinner ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-md)',
            color: 'var(--text-light-gray)'
          }}>
            加载中...
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-md)',
            color: 'var(--error-color)'
          }}>
            {error}
          </div>
        ) : jsonFiles.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-md)',
            color: 'var(--text-light-gray)'
          }}>
            没有可用的配置文件
          </div>
        ) : (
          <ul style={{ 
            listStyle: 'none', 
            margin: 0, 
            padding: 0 
          }}>
            {jsonFiles.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSelectFile(file)}
                  style={{
                    width: '100%',
                    backgroundColor: file === selectedFile ? 'var(--secondary-bg)' : 'transparent',
                    color: file === selectedFile ? 'var(--brand-color)' : 'var(--text-white)',
                    border: 'none',
                    borderBottom: index < jsonFiles.length - 1 ? '1px solid var(--border-color)' : 'none',
                    padding: 'var(--space-sm) var(--space-md)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: file === selectedFile ? 'bold' : 'normal'
                  }}
                >
                  {file}
                  {file === selectedFile && (
                    <span style={{ marginLeft: '8px', color: 'var(--brand-color)' }}>✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* 文件信息 */}
      {selectedFile && (
        <div style={{ 
          marginTop: 'var(--space-sm)',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-light-gray)'
        }}>
          当前选中: {selectedFile}
        </div>
      )}
    </div>
  );
};

export default JsonFileSelector;
