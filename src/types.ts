export interface Task {
  id: string;
  description: string;
  creative_idea: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean; // For App.tsx to track task completion
  deadline?: string; // Optional deadline
}

export interface ApiResponse {
  description: string;
  creative_idea: string;
  estimatedTime: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string; // Optional deadline

}

export interface TaskListProps {
  tasks: Task[];
  type: 'active' | 'completed';
  showCompleted?: boolean;
  onToggleTask: (id: string) => void;
  onTaskDelete: (id: string) => void;  // 添加这行
  onToggleShowCompleted?: () => void;
}