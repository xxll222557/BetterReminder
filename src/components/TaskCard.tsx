import { memo } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { DeadlineDisplay } from './DeadlineDisplay';
import { Task } from '../types';
import { Language } from '../hooks/useLanguage';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  language: Language;
  t: any; // 添加翻译对象
}

// 添加一个函数处理时间单位的翻译
const formatEstimatedTime = (estimatedTime: string, t: any): string => {
  // 替换"小时"为翻译后的文本
  let formatted = estimatedTime
    .replace(/小时/g, t.timeEstimate.hours)
    .replace(/分钟/g, t.timeEstimate.minutes);
  
  return formatted;
};

const getPriorityColor = (priority: string, isDark = false) => {
  switch (priority) {
    case 'High':
      return isDark ? 'text-red-400' : 'text-red-700';
    case 'Medium':
      return isDark ? 'text-yellow-300' : 'text-yellow-700';
    case 'Low':
      return isDark ? 'text-green-400' : 'text-green-700';
    default:
      return isDark ? 'text-blue-400' : 'text-blue-700';
  }
};

export const TaskCard = memo(({ task, onToggle, language, t }: TaskCardProps) => (
  <div
    className={`task-enter bg-white dark:bg-gray-800 rounded-lg shadow-sm 
                border border-gray-200 dark:border-gray-700
                transform transition-all duration-300 ease-in-out 
                hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/30 
                ${task.completed ? 'task-complete dark:opacity-75 opacity-85' : ''}`}
  >
    <div className="flex items-start justify-between p-6">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => onToggle(task.id)}
            className="text-gray-600 dark:text-gray-300 
                     hover:text-gray-800 dark:hover:text-gray-100 
                     transition-colors duration-200"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 
                                    transform transition-transform duration-200 
                                    hover:scale-110" />
            ) : (
              <Circle className="w-6 h-6 transform transition-transform 
                               duration-200 hover:scale-110" />
            )}
          </button>
          <h3 className={`text-lg font-semibold transition-all duration-300 
                         ${task.completed 
                           ? 'line-through text-gray-500 dark:text-gray-400' 
                           : 'text-gray-800 dark:text-gray-100'}`}>
            {task.description}
          </h3>
        </div>
        <p className="text-gray-700 dark:text-gray-200 ml-9 
                     transition-colors duration-200">
          {task.creative_idea}
        </p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <span className="text-gray-700 dark:text-gray-200">
            {/* 使用翻译的预计时间标签和翻译后的时间 */}
            {t.timeEstimate.label} {formatEstimatedTime(task.estimatedTime, t)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className={`w-4 h-4 
            ${task.completed 
              ? 'text-gray-500 dark:text-gray-400' 
              : getPriorityColor(task.priority, true)}`} 
          />
          <span className={`font-medium ${task.completed 
            ? 'text-gray-500 dark:text-gray-400' 
            : getPriorityColor(task.priority, true)}`}>
            {/* 使用翻译的优先级 */}
            {t.priority[task.priority]}
          </span>
        </div>
        {task.deadline && (
          <DeadlineDisplay 
            deadline={task.deadline}
            completed={task.completed}
            taskId={task.id}
            taskTitle={task.description}
            language={language}  // 传递语言
            t={t}  // 传递翻译对象
          />
        )}
      </div>
    </div>
  </div>
), (prevProps, nextProps) => {
  return prevProps.task.completed === nextProps.task.completed &&
         prevProps.task.deadline === nextProps.task.deadline &&
         prevProps.language === nextProps.language;  // 添加语言比较
});

TaskCard.displayName = 'TaskCard';