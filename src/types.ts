export interface Task {
  id: string;
  description: string;
  summary: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
}

export interface ApiResponse {
  summary: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
}