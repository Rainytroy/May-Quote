import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 根据模型ID确定应该使用的API基础URL
const getBaseUrlForModel = (model: string): string => {
  // 官方DeepSeek模型使用官方API
  if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
    return 'https://api.deepseek.com';
  }
  // 默认使用火山引擎API
  return 'https://ark.cn-beijing.volces.com/api/v3';
};

// 创建API客户端实例
export const createApiClient = (apiKey: string, model: string) => {
  const baseURL = getBaseUrlForModel(model);
  
  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true // 允许在浏览器中使用
  });
};

// 发送消息并获取响应（标准方式）
export const sendMessage = async (
  apiKey: string,
  messages: ChatCompletionMessageParam[],
  model: string = 'deepseek-r1-250120'
) => {
  try {
    const client = createApiClient(apiKey, model);
    
    const completion = await client.chat.completions.create({
      messages,
      model,
    });
    
    return {
      content: completion.choices[0]?.message?.content || '',
      error: null
    };
  } catch (error: any) {
    console.error('AI API错误:', error);
    return {
      content: '',
      error: error.message || '发送消息时出错'
    };
  }
};

// 发送消息并获取流式响应
export const sendMessageStream = async (
  apiKey: string,
  messages: ChatCompletionMessageParam[],
  model: string = 'deepseek-r1-250120',
  onProgress: (text: string) => void,
  onError: (error: string) => void,
  options: { isShenyuJson?: boolean } = {} // 新增参数对象，包含是否为神谕JSON请求的标志
) => {
  try {
    const client = createApiClient(apiKey, model);
    
    // 对于神谕JSON请求，使用非流式处理
    if (options.isShenyuJson) {
      console.log('[ai-service] 神谕JSON请求使用非流式处理');
      
      // 非流式请求
      const response = await client.chat.completions.create({
        messages,
        model,
        stream: false,
      });
      
      const responseText = response.choices[0]?.message?.content || '';
      console.log('[ai-service] 非流式神谕JSON响应完成. Length:', responseText.length, 'Content sample:', responseText.substring(0, 50) + "...", responseText.substring(responseText.length - 50));
      
      // 仍然调用一次 onProgress 以便更新UI状态
      onProgress(responseText);
      
      return responseText;
    }
    
    // 其他所有类型的请求使用流式处理
    const stream = await client.chat.completions.create({
      messages,
      model,
      stream: true,
    });
    
    let fullText = '';
    
    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || '';
      fullText += content;
      onProgress(fullText);
    }
    
    console.log('[ai-service] 流式响应完成. Length:', fullText.length, 'Content sample:', fullText.substring(0, 50) + "...", fullText.substring(fullText.length - 50));
    return fullText;
  } catch (error: any) {
    console.error('AI API流式响应错误:', error);
    onError(error.message || '获取流式响应时出错');
    return '';
  }
};
