import React, { memo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  showCompleted?: boolean;
  onToggleShowCompleted?: () => void;
  onToggleTask: (id: string) => void;
  type: 'active' | 'completed';
}

export const TaskList = memo(({ 
  tasks, 
  showCompleted, 
  onToggleShowCompleted, 
  onToggleTask, 
  type 
}: TaskListProps) => {
  if (type === 'active') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Active Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 animate-fade-in bg-white rounded-lg shadow">
            No active tasks. Start by adding a task above!
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return tasks.length > 0 ? (
    <div className="space-y-4">
      <button
        onClick={onToggleShowCompleted}
        className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors duration-200"
      >
        <h2>Completed Tasks ({tasks.length})</h2>
        {showCompleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {showCompleted && (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
          ))}
        </div>
      )}
    </div>
  ) : null;
});

TaskList.displayName = 'TaskList';