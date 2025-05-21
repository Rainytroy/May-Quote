/**
 * uuid模块的类型声明文件
 * 这个文件用于解决TypeScript对uuid模块的类型检查问题
 */

declare module 'uuid' {
  /**
   * 生成一个v4格式的UUID
   * @returns 生成的UUID字符串
   */
  export function v4(): string;
  
  /**
   * 生成一个v1格式的UUID
   * @returns 生成的UUID字符串
   */
  export function v1(): string;
  
  /**
   * 验证一个字符串是否为有效的UUID
   * @param str 要验证的字符串
   * @returns 是否为有效的UUID
   */
  export function validate(str: string): boolean;
  
  /**
   * 解析一个UUID字符串
   * @param str 要解析的UUID字符串
   * @returns 解析后的UUID数组
   */
  export function parse(str: string): number[];
}
