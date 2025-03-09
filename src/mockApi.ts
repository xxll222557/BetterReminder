import { ApiResponse } from './types';

const API_URL = 'http://localhost:3000/api';

// Mock API function to simulate DeepSeek API response
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
      summary: task.summary,
      estimatedTime: task.estimated_time,
      priority: task.priority,
      deadline: task.deadline // Make sure this is included
    }));
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw error;
  }
};