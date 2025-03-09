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

export const TaskList: React.FC<TaskListProps> = ({
  tasks, 
  showCompleted, 
  onToggleShowCompleted, 
  onToggleTask, 
  type 
}) => {
  return (
    <div>
      {type === 'active' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Active Tasks ({tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 
                           animate-fade-in bg-white dark:bg-gray-800 
                           rounded-lg shadow dark:shadow-gray-900/30
                           transition-all duration-500">
              No active tasks. Start by adding a task above!
            </div>
          ) : (
            <div className="space-y-4 transition-all duration-500">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
              ))}
            </div>
          )}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          <button
            onClick={onToggleShowCompleted}
            className="flex items-center gap-2 text-xl font-semibold w-full text-gray-800 dark:text-gray-100"
            aria-expanded={showCompleted}
          >
            <span className="transition-colors duration-300">
              Completed Tasks ({tasks.length})
            </span>
            {showCompleted ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          
          <div className={`space-y-4 overflow-hidden transition-all duration-300
                          ${showCompleted ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

TaskList.displayName = 'TaskList';