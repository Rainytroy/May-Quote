import React, { useState, useEffect } from 'react';

interface AgentPromptEditorProps {
  defaultPrompt?: string;
  onSavePrompt: (prompt: string) => void;
}

/**
 * Agent生成器提示词编辑器
 * 
 * 用于编辑生成AI智能体的提示词模板
 */
const AgentPromptEditor: React.FC<AgentPromptEditorProps> = ({
  defaultPrompt,
  onSavePrompt
}) => {
  // 默认的Agent生成提示词模板
  const DEFAULT_AGENT_PROMPT = `你是一个专业的表单设计助手。你的任务是根据用户的需求，生成可用于构建交互式表单的JSON配置。
  
请分析用户的需求，然后生成一个包含合适的输入控件配置的JSON数组。你可以创建的控件类型包括：

1. 文本框 (text)
2. 多行文本框 (textarea)
3. 数字输入框 (number)
4. 下拉选择框 (select)
5. 复选框 (checkbox)
6. 单选按钮 (radio)

每个控件配置需包含以下属性：
- type: 控件类型（必须是上述之一）
- id: 控件的唯一标识符
- label: 控件的显示标签
- required: 是否必填项（布尔值）
- placeholder: 占位文本（适用于text, textarea, number）
- defaultValue: 默认值（可选）
- options: 选项数组（仅适用于select和radio，每个选项包含value和label）

请确保生成的JSON格式正确，且与用户需求高度相关。回答应仅包含JSON数组，不要包含任何其他解释或说明。

JSON格式示例：
[
  {
    "type": "text",
    "id": "name",
    "label": "姓名",
    "required": true,
    "placeholder": "请输入您的姓名"
  },
  {
    "type": "select",
    "id": "city",
    "label": "城市",
    "required": true,
    "options": [
      { "value": "beijing", "label": "北京" },
      { "value": "shanghai", "label": "上海" },
      { "value": "guangzhou", "label": "广州" }
    ]
  }
]`;

  const [prompt, setPrompt] = useState(defaultPrompt || DEFAULT_AGENT_PROMPT);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 当默认提示词变化时更新
  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  // 保存提示词
  const handleSavePrompt = () => {
    onSavePrompt(prompt);
    setIsEditing(false);
    setIsSaved(true);
    
    // 3秒后重置保存状态
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  // 重置为默认提示词
  const handleResetPrompt = () => {
    setPrompt(DEFAULT_AGENT_PROMPT);
    setIsEditing(true);
    setIsSaved(false);
  };

  return (
    <div className="agent-prompt-editor" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ color: 'var(--text-white)' }}>Agent生成器提示词编辑器</h2>
        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)'
        }}>
          <button
            onClick={handleResetPrompt}
            style={{
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer'
            }}
          >
            重置为默认
          </button>
          <button
            onClick={handleSavePrompt}
            style={{
              backgroundColor: 'var(--brand-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            保存提示词
          </button>
        </div>
      </div>
      
      {/* 说明文本 */}
      <div style={{
        backgroundColor: 'var(--secondary-bg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <p style={{ color: 'var(--text-white)', marginBottom: 'var(--space-sm)' }}>
          这是用于生成控件JSON配置的AI提示词。您可以编辑此提示词来自定义AI生成的控件类型和结构。
        </p>
        <p style={{ color: 'var(--text-light-gray)' }}>
          提示词应详细描述所需的控件JSON格式，包括可用的控件类型和每个控件所需的属性。
        </p>
      </div>
      
      {/* 保存成功提示 */}
      {isSaved && (
        <div style={{
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          color: '#4caf50',
          padding: 'var(--space-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #4caf50',
          marginBottom: 'var(--space-sm)'
        }}>
          提示词已成功保存！
        </div>
      )}
      
      {/* 提示词编辑区 */}
      <div style={{ flex: 1 }}>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setIsEditing(true);
            setIsSaved(false);
          }}
          style={{
            width: '100%',
            height: 'calc(100% - 40px)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--main-bg)',
            color: 'var(--text-white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: 'var(--font-sm)',
            lineHeight: '1.5'
          }}
          placeholder="输入Agent生成器提示词..."
        />
        <div style={{
          marginTop: 'var(--space-sm)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{
            color: isEditing ? 'var(--brand-color)' : 'var(--text-light-gray)',
            fontSize: 'var(--font-xs)'
          }}>
            {isEditing ? '* 未保存的修改' : '无修改'}
          </span>
          <span style={{
            color: 'var(--text-light-gray)',
            fontSize: 'var(--font-xs)'
          }}>
            编辑此提示词以自定义AI生成的控件
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentPromptEditor;
