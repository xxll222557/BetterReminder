import { ApiResponse } from '../storage/types';
import { invoke } from '@tauri-apps/api/core';

export const analyzeTask = async (taskDescription: string): Promise<ApiResponse[]> => {
  try {
    console.log("🔍 开始分析任务，当前时间:", new Date().toLocaleString());
    console.log("🌐 系统时区:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log("🌐 时区偏移:", -new Date().getTimezoneOffset() / 60, "小时");
    
    // 调用Rust函数
    const result = await invoke<{ tasks: ApiResponse[] }>('analyze_task', {
      description: taskDescription
    });

    // 输出时间相关信息
    console.log("📊 任务分析完成，当前时间:", new Date().toLocaleString());
    console.log("⏱️ 时间信息:", {
      当前ISO时间: new Date().toISOString(),
      当地时间: new Date().toLocaleTimeString(),
      时区: Intl.DateTimeFormat().resolvedOptions().timeZone,
      时区偏移: -new Date().getTimezoneOffset() / 60 + "小时"
    });

    return result.tasks.map((task: any) => {
      // 处理截止日期
      let deadline = task.deadline;
      if (deadline) {
        try {
          // 确保日期格式正确，保留原始时区信息
          const date = new Date(deadline);
          deadline = date.toISOString();
          console.log(`📅 任务 "${task.description}" 截止日期:`, {
            原始格式: task.deadline,
            ISO格式: deadline,
            本地显示: date.toLocaleString(),
            时区: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        } catch (err) {
          console.error(`❌ 日期解析错误 (${deadline}):`, err);
          deadline = undefined;
        }
      }

      return {
        description: task.description,
        creative_idea: task.creative_idea,
        estimatedTime: task.estimated_time,
        priority: task.priority,
        deadline
      };
    });
  } catch (error) {
    console.error('❌ 分析任务错误:', error);
    throw error;
  }
};