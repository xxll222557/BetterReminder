import React, { useState } from 'react';
import { Task } from '../../services/storage/types';
import ActiveTasks from './ActiveTasks';
import CompletedTasks from './CompletedTasks';
import { Confetti } from '../feedback/Confetti';
import { Language } from '../../hooks/useLanguage';

interface TaskListProps {
  tasks: Task[];
  showCompleted?: boolean;
  onToggleShowCompleted?: () => void;
  onToggleTask: (id: string) => void;
  onTaskDelete: (id: string) => void;
  type: 'active' | 'completed';
  t: any;
  language: Language;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks, 
  onToggleTask, 
  onTaskDelete, 
  type,
  t,
  language
}) => {
  // 庆祝动画状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 当从活动任务完成最后一个任务时触发庆祝效果
  React.useEffect(() => {
    if (type === 'active' && tasks.length === 0) {
      setShowCelebration(true);
      
      // 3秒后关闭庆祝效果
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [tasks.length, type]);

  return (
    <div className="transition-all duration-300">
      {/* 添加庆祝组件 */}
      <Confetti active={showCelebration} />
      
      {type === 'active' ? (
        <ActiveTasks
          tasks={tasks}
          onToggleTask={onToggleTask}
          onTaskDelete={onTaskDelete}
          language={language}
          t={t}
        />
      ) : (
        <CompletedTasks
          tasks={tasks}
          onToggleTask={onToggleTask}
          onTaskDelete={onTaskDelete}
          language={language}
          t={t}
        />
      )}
    </div>
  );
};

export default TaskList;