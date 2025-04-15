export interface Holiday {
  name: string;
  type: 'public' | 'memorial' | 'traditional';
  isPublicHoliday?: boolean;
}

export type HolidayData = {
  [year: string]: {
    [date: string]: Holiday;
  }
};

// 中国节假日数据 (2024-2025举例)
export const chineseHolidays: HolidayData = {
  "2024": {
    "01-01": { name: "元旦", type: "public", isPublicHoliday: true },
    "02-10": { name: "除夕", type: "traditional", isPublicHoliday: true },
    "02-11": { name: "春节", type: "public", isPublicHoliday: true },
    "02-12": { name: "春节假期", type: "public", isPublicHoliday: true },
    "02-13": { name: "春节假期", type: "public", isPublicHoliday: true },
    "02-14": { name: "情人节", type: "memorial" },
    "04-04": { name: "清明节", type: "public", isPublicHoliday: true },
    "04-05": { name: "清明节假期", type: "public", isPublicHoliday: true },
    "04-06": { name: "清明节假期", type: "public", isPublicHoliday: true },
    "05-01": { name: "劳动节", type: "public", isPublicHoliday: true },
    "05-02": { name: "劳动节假期", type: "public", isPublicHoliday: true },
    "05-03": { name: "劳动节假期", type: "public", isPublicHoliday: true },
    "05-04": { name: "青年节", type: "memorial" },
    "06-08": { name: "端午节", type: "public", isPublicHoliday: true },
    "06-09": { name: "端午节假期", type: "public", isPublicHoliday: true },
    "06-10": { name: "端午节假期", type: "public", isPublicHoliday: true },
    "08-10": { name: "七夕", type: "traditional" },
    "09-15": { name: "中秋节", type: "public", isPublicHoliday: true },
    "09-16": { name: "中秋节假期", type: "public", isPublicHoliday: true },
    "09-17": { name: "中秋节假期", type: "public", isPublicHoliday: true },
    "10-01": { name: "国庆节", type: "public", isPublicHoliday: true },
    "10-02": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-03": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-04": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-05": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-06": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-07": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "12-24": { name: "平安夜", type: "memorial" },
    "12-25": { name: "圣诞节", type: "memorial" }
  },
  "2025": {
    "01-01": { name: "元旦", type: "public", isPublicHoliday: true },
    "01-29": { name: "除夕", type: "traditional", isPublicHoliday: true },
    "01-30": { name: "春节", type: "public", isPublicHoliday: true },
    "01-31": { name: "春节假期", type: "public", isPublicHoliday: true },
    "02-01": { name: "春节假期", type: "public", isPublicHoliday: true },
    "02-02": { name: "春节假期", type: "public", isPublicHoliday: true },
    "02-14": { name: "情人节", type: "memorial" },
    "04-05": { name: "清明节", type: "public", isPublicHoliday: true },
    "04-06": { name: "清明节假期", type: "public", isPublicHoliday: true },
    "04-07": { name: "清明节假期", type: "public", isPublicHoliday: true },
    "05-01": { name: "劳动节", type: "public", isPublicHoliday: true },
    "05-02": { name: "劳动节假期", type: "public", isPublicHoliday: true },
    "05-03": { name: "劳动节假期", type: "public", isPublicHoliday: true },
    "05-04": { name: "青年节", type: "memorial" },
    "06-28": { name: "端午节", type: "public", isPublicHoliday: true },
    "06-29": { name: "端午节假期", type: "public", isPublicHoliday: true },
    "06-30": { name: "端午节假期", type: "public", isPublicHoliday: true },
    "09-06": { name: "中秋节", type: "public", isPublicHoliday: true },
    "09-07": { name: "中秋节假期", type: "public", isPublicHoliday: true },
    "09-08": { name: "中秋节假期", type: "public", isPublicHoliday: true },
    "10-01": { name: "国庆节", type: "public", isPublicHoliday: true },
    "10-02": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-03": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-04": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-05": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-06": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "10-07": { name: "国庆节假期", type: "public", isPublicHoliday: true },
    "12-24": { name: "平安夜", type: "memorial" },
    "12-25": { name: "圣诞节", type: "memorial" }
  }
};

// 美国节假日数据 (为其他时区准备)
export const usHolidays: HolidayData = {
  "2024": {
    "01-01": { name: "New Year's Day", type: "public", isPublicHoliday: true },
    "01-15": { name: "Martin Luther King Jr. Day", type: "public", isPublicHoliday: true },
    "02-14": { name: "Valentine's Day", type: "memorial" },
    "02-19": { name: "Presidents' Day", type: "public", isPublicHoliday: true },
    "05-27": { name: "Memorial Day", type: "public", isPublicHoliday: true },
    "06-19": { name: "Juneteenth", type: "public", isPublicHoliday: true },
    "07-04": { name: "Independence Day", type: "public", isPublicHoliday: true },
    "09-02": { name: "Labor Day", type: "public", isPublicHoliday: true },
    "10-14": { name: "Columbus Day", type: "public", isPublicHoliday: true },
    "10-31": { name: "Halloween", type: "traditional" },
    "11-11": { name: "Veterans Day", type: "public", isPublicHoliday: true },
    "11-28": { name: "Thanksgiving", type: "public", isPublicHoliday: true },
    "12-25": { name: "Christmas", type: "public", isPublicHoliday: true }
  },
  "2025": {
    "01-01": { name: "New Year's Day", type: "public", isPublicHoliday: true },
    // ... 更多2025年美国节假日
  }
};

// 根据时区获取节假日数据
export function getHolidaysForTimeZone(timeZone: string): HolidayData {
  // 基于时区识别返回相应的节假日数据
  if (timeZone.startsWith('Asia/Shanghai') || 
      timeZone.includes('China') || 
      timeZone.includes('+08:00') ||
      timeZone.includes('+8')) {
    return chineseHolidays;
  } else if (timeZone.includes('America/') || timeZone.includes('US/')) {
    return usHolidays;
  }
  
  // 默认返回中国节假日
  return chineseHolidays;
}