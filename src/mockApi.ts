import { ApiResponse } from './types';

const API_URL = 'http://localhost:3000/api';

// 修改 analyzeTask 函数中的时间处理逻辑
export const analyzeTask = async (taskDescription: string): Promise<ApiResponse[]> => {
  try {
    const response = await fetch(`${API_URL}/analyze-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: taskDescription }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.tasks.map((task: any) => ({
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