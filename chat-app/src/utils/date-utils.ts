/**
 * 日期工具函数
 */

/**
 * 格式化日期为智能时间显示
 * - 当天显示为"HH:MM"
 * - 昨天显示为"昨天 HH:MM"
 * - 本年内显示为"M月D日 HH:MM"
 * - 其他显示为"YYYY年M月D日 HH:MM"
 */
export function formatSmartTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // 获取小时和分钟并补零
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // 检查是否是今天
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return timeStr;
  }
  
  // 检查是否是昨天
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `昨天 ${timeStr}`;
  }
  
  // 检查是否是本年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
  }
  
  // 其他情况显示完整日期
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
}
