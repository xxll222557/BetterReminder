import { ApiResponse } from './types';
import { invoke } from '@tauri-apps/api/core';

export const analyzeTask = async (taskDescription: string): Promise<ApiResponse[]> => {
  try {
    // 调用Rust函数
    const result = await invoke<{ tasks: ApiResponse[] }>('analyze_task', {
      description: taskDescription
    });

    return result.tasks.map((task: any) => ({
      description: task.description,
      creative_idea: task.creative_idea,
      estimatedTime: task.estimated_time,
      priority: task.priority,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : undefined
    }));
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw error;
  }
};