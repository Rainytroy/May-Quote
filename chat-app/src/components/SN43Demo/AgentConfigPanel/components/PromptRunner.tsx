import { usePromptRunner } from '../hooks/usePromptRunner';

// 重新导出usePromptRunner hook，以便从components目录中导入
export { usePromptRunner };

// 导出Message类型
export type { Message } from '../hooks/usePromptRunner';

// 保持组件API与hook兼容
export interface PromptRunnerProps {
  chatInterfaceRef: React.RefObject<any>;
  agentName: string;
  promptBlocks: any[];
  controlValues: Record<string, any>;
  userMessages: any[];
}

/**
 * 提示词运行器空组件
 * 只是为了向后兼容，新代码应该使用usePromptRunner hook
 */
const PromptRunner: React.FC<PromptRunnerProps> = () => null;

export default PromptRunner;
