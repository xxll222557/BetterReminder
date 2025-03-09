export interface Task {
  id: string;
  description: string;
  summary: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  deadline?: string; // Optional deadline
}

export interface ApiResponse {
  summary: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string; // Optional deadline
}