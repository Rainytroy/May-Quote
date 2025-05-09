import React, { useState } from 'react';
import { ControlDefinition } from '../Controls/DynamicControl';

interface AgentGeneratorProps {
  agentPrompt: string;
  onControlsGenerated: (controls: ControlDefinition[]) => void;
}

/**
 * Agent生成器组件
 * 
 * 负责：
 * 1. 接收用户输入的需求
 * 2. 使用AI生成控件配置
 * 3. 预览并应用生成的控件
 */
const AgentGenerator: React.FC<AgentGeneratorProps> = ({
  agentPrompt,
  onControlsGenerated
}) => {
  // 状态
  const [requirement, setRequirement] = useState<string>('');
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 生成控件配置
  const generateControls = async () => {
    if (!requirement.trim()) {
      setError('请输入需求描述');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // API请求，发送需求和Agent生成提示词
      const response = await fetch('/api/generate-controls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requirement,
          prompt: agentPrompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`生成失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 假设API返回的是JSON字符串
      const jsonStr = JSON.stringify(data.controls, null, 2);
      setGeneratedJson(jsonStr);
      
      // 向父组件传递生成的控件
      if (data.controls && Array.isArray(data.controls)) {
        onControlsGenerated(data.controls);
      }
    } catch (error) {
      console.error('生成控件失败:', error);
      setError(error instanceof Error ? error.message : '生成控件失败');
      
      // 模拟生成 - 在实际API不可用时使用
      simulateGeneration();
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 模拟生成控件
  const simulateGeneration = () => {
    // 基于需求生成一些示例控件
    const requirementLower = requirement.toLowerCase();
    let mockJson: ControlDefinition[] = [];
    
    if (requirementLower.includes('用户信息') || requirementLower.includes('个人信息')) {
      mockJson = [
        {
          type: "text",
          id: "name",
          label: "姓名",
          required: true,
          placeholder: "请输入您的姓名"
        },
        {
          type: "text",
          id: "email",
          label: "邮箱",
          required: true,
          placeholder: "请输入您的邮箱地址"
        },
        {
          type: "select",
          id: "gender",
          label: "性别",
          required: false,
          options: [
            { value: "male", label: "男" },
            { value: "female", label: "女" },
            { value: "other", label: "其他" }
          ]
        }
      ];
    } else if (requirementLower.includes('调查') || requirementLower.includes('问卷')) {
      mockJson = [
        {
          type: "text",
          id: "age",
          label: "年龄",
          required: true,
          placeholder: "请输入您的年龄"
        },
        {
          type: "radio",
          id: "education",
          label: "最高学历",
          required: true,
          options: [
            { value: "high_school", label: "高中" },
            { value: "college", label: "大学" },
            { value: "master", label: "硕士" },
            { value: "phd", label: "博士" }
          ]
        },
        {
          type: "textarea",
          id: "feedback",
          label: "反馈意见",
          required: false,
          placeholder: "请输入您的反馈意见"
        }
      ];
    } else if (requirementLower.includes('产品') || requirementLower.includes('商品')) {
      mockJson = [
        {
          type: "text",
          id: "product_name",
          label: "产品名称",
          required: true,
          placeholder: "请输入产品名称"
        },
        {
          type: "number",
          id: "price",
          label: "价格",
          required: true,
          placeholder: "请输入产品价格"
        },
        {
          type: "select",
          id: "category",
          label: "产品类别",
          required: true,
          options: [
            { value: "electronics", label: "电子产品" },
            { value: "clothing", label: "服装" },
            { value: "food", label: "食品" },
            { value: "other", label: "其他" }
          ]
        },
        {
          type: "checkbox",
          id: "in_stock",
          label: "是否有货",
          required: false
        }
      ];
    } else {
      // 默认控件集
      mockJson = [
        {
          type: "text",
          id: "input1",
          label: "输入1",
          required: true,
          placeholder: "请输入"
        },
        {
          type: "textarea",
          id: "input2",
          label: "多行输入",
          required: false,
          placeholder: "请输入详细信息"
        }
      ];
    }
    
    // 设置生成的JSON
    setGeneratedJson(JSON.stringify(mockJson, null, 2));
    
    // 通知父组件
    onControlsGenerated(mockJson);
  };
  
  // 应用JSON
  const applyJson = () => {
    try {
      // 尝试解析JSON
      const controls = JSON.parse(generatedJson);
      
      // 验证是否是数组
      if (!Array.isArray(controls)) {
        throw new Error('JSON必须是数组格式');
      }
      
      // 通知父组件
      onControlsGenerated(controls);
      setError(null);
    } catch (error) {
      console.error('应用JSON失败:', error);
      setError('无效的JSON格式: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  return (
    <div className="agent-generator" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      height: '100%'
    }}>
      <h2 style={{ color: 'var(--text-white)' }}>Agent生成器</h2>
      
      {/* 说明文本 */}
      <div style={{
        backgroundColor: 'var(--secondary-bg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <p style={{ color: 'var(--text-white)', marginBottom: 'var(--space-sm)' }}>
          根据您的需求描述，自动生成表单控件配置。
        </p>
        <p style={{ color: 'var(--text-light-gray)' }}>
          例如：需要收集用户的个人信息，包括姓名、年龄、性别和教育背景。
        </p>
      </div>
      
      {/* 需求输入 */}
      <div>
        <label
          htmlFor="requirement"
          style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            color: 'var(--text-white)',
            fontSize: 'var(--font-md)'
          }}
        >
          需求描述
        </label>
        <textarea
          id="requirement"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder="请描述您需要哪些表单控件，例如：我需要一个收集用户基本信息的表单，包括姓名、邮箱和电话号码..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--main-bg)',
            color: 'var(--text-white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            resize: 'vertical',
            marginBottom: 'var(--space-md)'
          }}
        />
        <button
          onClick={generateControls}
          disabled={isGenerating || !requirement.trim()}
          style={{
            backgroundColor: 'var(--brand-color)',
            color: 'var(--text-dark)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            cursor: isGenerating || !requirement.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isGenerating || !requirement.trim() ? 0.7 : 1,
            width: '100%'
          }}
        >
          {isGenerating ? '生成中...' : '生成AI智能体'}
        </button>
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ 
          color: 'var(--error-color)', 
          padding: 'var(--space-md)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--error-color)'
        }}>
          {error}
        </div>
      )}
      
      {/* 生成的JSON */}
      {generatedJson && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-sm)'
          }}>
            <h3 style={{ color: 'var(--text-white)', margin: 0 }}>生成的控件配置</h3>
            <button
              onClick={applyJson}
              style={{
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                cursor: 'pointer'
              }}
            >
              应用修改
            </button>
          </div>
          <label htmlFor="generated-json" className="sr-only" style={{ display: 'none' }}>
            生成的JSON配置
          </label>
          <textarea
            id="generated-json"
            value={generatedJson}
            onChange={(e) => setGeneratedJson(e.target.value)}
            aria-label="生成的JSON配置"
            title="生成的JSON配置编辑器"
            placeholder="生成的控件JSON配置将显示在这里"
            style={{
              flex: 1,
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
          />
          <div style={{
            marginTop: 'var(--space-sm)',
            color: 'var(--text-light-gray)',
            fontSize: 'var(--font-xs)',
            textAlign: 'right'
          }}>
            您可以直接编辑上面的JSON，然后点击"应用修改"按钮更新控件。
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentGenerator;
