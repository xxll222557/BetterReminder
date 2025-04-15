import React from 'react';
import { Task } from '../../services/storage/types';
import TaskCard from './TaskCard';
import { Language } from '../../hooks/useLanguage';

interface ActiveTasksProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onTaskDelete: (id: string) => void;
  language: Language;
  t: any;
}

const ActiveTasks: React.FC<ActiveTasksProps> = ({
  tasks,
  onToggleTask,
  language,
  t
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {t.activeTasks} ({tasks.length})
      </h2>
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 
                      animate-fade-in bg-white dark:bg-gray-800 
                      rounded-lg shadow dark:shadow-gray-900/30">
          {t.noActiveTasks}
        </div>
      ) : (
        <div className="space-y-4 transition-all duration-500">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggle={onToggleTask} 
              language={language} 
              t={t} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveTasks;