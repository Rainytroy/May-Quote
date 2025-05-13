import { UserInputs, AdminInputs, PromptBlock } from '../types';

export interface MayApiConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface ShenyuInput {
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  id: string;
  label: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface ShenyuPrompt {
  text: string;
  template?: string;
}

export interface ShenyuGenerateControlsParams {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  controlsTemplate?: string;
}

export interface ShenyuExecuteParams {
  userInputs: UserInputs;
  adminInputs: AdminInputs;
  promptBlocks: PromptBlock[];
  controls?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  finishReason?: string;
}

export class MayAPI {
  public getApiConfig(): {
    baseUrl: string, 
    apiKey?: string, 
    initialized: boolean,
    modelId?: string,
    modelName?: string
  };
  
  constructor(config: MayApiConfig);
  
  initializeFromMayConfig(): Promise<void>;
  
  generateControls(params: ShenyuGenerateControlsParams): Promise<ShenyuInput[]>;
  
  readControlValues(controlIds: string[]): Promise<Record<string, any>>;
  
  executeShenyuRequest(params: ShenyuExecuteParams): Promise<{ result: string }>;
  
  sendChatMessage(params: ChatParams): Promise<ChatResponse>;
}

export const mayApi: MayAPI;
