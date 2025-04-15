import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../../services/storage/types';

interface TimeSlotProps {
  hour: number;
  hourFormatted: string;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  isCurrentHour: boolean;
  language: 'zh' | 'en';
  t: any;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  hourFormatted,
  tasks,
  onToggleTask,
  isCurrentHour,
  language,
  t
}) => {
  return (
    <div className={`time-slot group relative ${isCurrentHour ? 'current-hour' : ''}`}>
      {/* 时间指示 */}
      <div className="flex items-center mb-1">
        <div className="time-label text-xs font-semibold text-gray-500 dark:text-gray-300 w-14">
          {hourFormatted}
        </div>
        <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
      </div>
      
      {/* 任务项 */}
      <div className="ml-14 space-y-1.5">
        {tasks.map((task) => (
          <TimelineTask 
            key={task.id}
            task={task}
            onToggleTask={onToggleTask}
            language={language}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

// 时间线任务项组件
interface TimelineTaskProps {
  task: Task;
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

const TimelineTask: React.FC<TimelineTaskProps> = ({
  task,
  onToggleTask,
  language,  
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className={`py-2 px-3 rounded-md transition-all duration-200 border-l-4 shadow-sm
        ${task.priority === 'High' 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
          : task.priority === 'Medium'
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
          : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        }
        ${task.completed ? 'opacity-60' : ''}
        hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200
      `}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggleTask(task.id)}
          className="flex-shrink-0 transition-colors duration-200 mt-0.5"
        >
          {task.completed ? (
            <CheckCircle size={16} className="text-green-500 dark:text-green-400" />
          ) : (
            <Circle size={16} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" />
          )}
        </button>
        
        <div className={`flex-grow ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : ''}`}>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{task.description}</div>
          
          {task.deadline && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
              {format(new Date(task.deadline), 'HH:mm')}
            </div>
          )}
          
          {/* 展开/收起按钮 */}
          {task.creative_idea && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 flex items-center focus:outline-none"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span className="ml-1">{expanded ? (language === 'zh' ? '收起' : 'Hide') : (language === 'zh' ? '详情' : 'Details')}</span>
              </button>
              
              {expanded && (
                <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-200 pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                  {task.creative_idea}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeSlot;