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
    <div className="transition-theme duration-theme ease-theme">
      {type === 'active' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 transition-theme duration-theme ease-theme">
            Active Tasks ({tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 
                           animate-fade-in bg-white dark:bg-gray-800 
                           rounded-lg shadow dark:shadow-gray-900/30
                           transition-theme duration-theme ease-theme">
              No active tasks. Start by adding a task above!
            </div>
          ) : (
            <div className="space-y-4 transition-theme duration-theme ease-theme">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={onToggleTask} />
              ))}
            </div>
          )}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4 transition-theme duration-theme ease-theme">
          <button
            onClick={onToggleShowCompleted}
            className="flex items-center gap-2 text-xl font-semibold 
                     text-gray-800 dark:text-gray-100 
                     hover:text-gray-600 dark:hover:text-gray-300 
                     transition-theme duration-theme ease-theme"
          >
            <h2 className="transition-theme duration-theme ease-theme">
              Completed Tasks ({tasks.length})
            </h2>
            {showCompleted ? (
              <ChevronUp className="w-5 h-5 transition-theme duration-theme ease-theme" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-theme duration-theme ease-theme" />
            )}
          </button>
          
          <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out
                          ${showCompleted ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {tasks.map(task => (
              <div key={task.id} className="transition-theme duration-theme ease-theme">
                <TaskCard task={task} onToggle={onToggleTask} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

TaskList.displayName = 'TaskList';