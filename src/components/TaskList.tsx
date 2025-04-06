import React, { useState, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { Task } from '../types';
import { dbServiceTauri } from '../services/dbServiceTauri';
import { Confetti } from './Confetti';
import { Language } from '../hooks/useLanguage';

interface TaskListProps {
  tasks: Task[];
  showCompleted?: boolean;
  onToggleShowCompleted?: () => void;
  onToggleTask: (id: string) => void;
  onTaskDelete: (id: string) => void;
  type: 'active' | 'completed';
  t: any; // 添加翻译对象
  language: Language;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks, 
  onToggleTask, 
  onTaskDelete, 
  type,
  t,
  language
}) => {
  const handleClearCompleted = async () => {
    try {
      const completedTaskIds = tasks.filter(task => task.completed).map(task => task.id);
      if (completedTaskIds.length === 0) return;
      
      // 批量删除所有已完成任务
      await dbServiceTauri.deleteTasks(completedTaskIds);
      
      // 对每个任务调用 onTaskDelete 来更新 UI
      completedTaskIds.forEach(id => onTaskDelete(id));
    } catch (err) {
      console.error('Failed to clear completed tasks:', err);
    }
  };

  // 添加状态来跟踪是否应该显示庆祝动画
  const [showCelebration, setShowCelebration] = useState(false);
  
  // 检测任务列表变化
  useEffect(() => {
    // 在"活动"列表上进行检测
    if (type === 'active') {
      // 当有任务且所有任务都完成时触发庆祝
      const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.completed);
      
      if (allTasksCompleted) {
        setShowCelebration(true);
        
        // 3秒后关闭庆祝效果
        const timer = setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [tasks, type]);

  return (
    <div className={type === 'completed' ? 'pb-4' : ''}>
      {/* 添加庆祝组件 */}
      <Confetti active={showCelebration} />
      
      {type === 'active' ? (
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
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t.completedTasks} ({tasks.length})
          </h2>
          <div className="space-y-4 transition-all duration-500">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 
                             animate-fade-in bg-white dark:bg-gray-800 
                             rounded-lg shadow dark:shadow-gray-900/30">
                {t.noCompletedTasks}
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={onToggleTask} 
                  language={language} 
                  t={t} 
                />
              ))
            )}
          </div>

          {/* 清除已完成任务按钮 */}
          {tasks.length > 0 && (
            <button 
              className="mt-4 w-full px-4 py-2 text-white bg-red-500 
                       hover:bg-red-600 rounded-lg transition-colors 
                       duration-200 focus:outline-none focus:ring-2 
                       focus:ring-red-500 focus:ring-opacity-50"
              onClick={handleClearCompleted}
            >
              {t.clearCompleted}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

TaskList.displayName = 'TaskList';

export default TaskList;