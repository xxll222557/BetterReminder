import { format } from 'date-fns';
import { getHolidaysForTimeZone, Holiday } from '../storage/holidays';

// 获取用户当前时区
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    // 如果无法获取时区，默认返回中国时区
    return 'Asia/Shanghai';
  }
}

// 检查指定日期是否是节假日
export function getHolidayForDate(date: Date): Holiday | null {
  const timeZone = getUserTimeZone();
  const holidays = getHolidaysForTimeZone(timeZone);
  
  const year = date.getFullYear().toString();
  const monthDay = format(date, 'MM-dd');
  
  if (holidays[year] && holidays[year][monthDay]) {
    return holidays[year][monthDay];
  }
  
  return null;
}