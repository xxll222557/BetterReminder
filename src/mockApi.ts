import { ApiResponse } from './types';

const API_URL = 'http://localhost:3000/api';

// Mock API function to simulate DeepSeek API response
export async function analyzeTask(description: string): Promise<ApiResponse[]> {
  try {
    const response = await fetch(`${API_URL}/analyze-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    // Validate response structure
    if (!Array.isArray(result.tasks)) {
      throw new Error('Invalid response format from API');
    }

    return result.tasks.map((task: any) => ({
      summary: task.summary,
      estimatedTime: task.estimated_time,
      priority: task.priority as 'High' | 'Medium' | 'Low'
    }));
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Failed to analyze task');
  }
}