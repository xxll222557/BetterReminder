import React from 'react';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Task } from '../../services/storage/types';
import { Holiday } from '../../services/storage/holidays';

interface CalendarCellProps {
  day: Date;
  monthStart: Date;
  selectedDate: Date;
  tasks: Task[];
  holiday?: Holiday | null;
  onClick: (day: Date, event: React.MouseEvent) => void;
  language: 'zh' | 'en';
  t: any;
}

const CalendarCell: React.FC<CalendarCellProps> = ({
  day,
  monthStart,
  selectedDate,
  tasks,
  holiday,
  onClick,
  language,
  t
}) => {
  // 找出最高优先级任务
  let highestPriority = '';
  if (tasks.length > 0) {
    if (tasks.some(t => t.priority === 'High')) highestPriority = 'High';
    else if (tasks.some(t => t.priority === 'Medium')) highestPriority = 'Medium';
    else highestPriority = 'Low';
  }

  // 为不同优先级设置不同颜色的提示点
  const priorityDot = tasks.length > 0 ? (
    <div className={`w-2 h-2 rounded-full absolute top-1 right-1
      ${highestPriority === 'High' ? 'bg-red-500' : 
        highestPriority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
  ) : null;

  return (
    <div
      className={`relative border border-gray-200 dark:border-gray-700 min-h-[80px] p-2 transition-all duration-200 calendar-day
        ${isSameMonth(day, monthStart) ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/80 text-gray-400 dark:text-gray-400'}
        ${isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        ${isToday(day) ? 'font-bold border-blue-200 dark:border-blue-700 calendar-today-highlight' : ''}
        ${holiday?.isPublicHoliday ? 'bg-pink-50 dark:bg-pink-900/20' : ''}
        hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer`}
      onClick={(e) => onClick(day, e)}
    >
      {priorityDot}
      <div className="flex justify-between items-start">
        <span className={`
          text-sm font-medium calendar-day-number
          ${isToday(day) 
            ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full w-6 h-6 flex items-center justify-center shadow-sm' 
            : isSameMonth(day, monthStart)
              ? 'text-gray-900 dark:text-white' // 提高对比度
              : 'text-gray-500 dark:text-gray-400'  // 非当月日期
          }
        `}>
          {format(day, 'd')}
        </span>
        {tasks.length > 0 && (
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-medium rounded-full px-1.5 py-0.5 shadow-sm">
            {tasks.length}
          </span>
        )}
      </div>
      
      {/* 节假日信息显示 */}
      {holiday && (
        <div className={`text-xs mt-1 truncate ${
          holiday.isPublicHoliday 
            ? 'text-red-600 dark:text-red-300 font-medium' 
            : 'text-orange-600 dark:text-orange-300'
        }`}>
          {holiday.name}
        </div>
      )}
      
      {/* 任务列表预览 - 最多显示2个 */}
      <div className={`mt-1 space-y-1 overflow-hidden ${holiday ? 'max-h-[30px]' : 'max-h-[50px]'}`}>
        {tasks.slice(0, holiday ? 1 : 2).map((task, idx) => (
          <div 
            key={idx} 
            className={`text-xs truncate px-1 py-0.5 rounded
              ${task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-200' : 
                task.priority === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200' : 
                'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'}
              ${task.completed ? 'line-through opacity-60' : ''}`}
          >
            {task.description}
          </div>
        ))}
        {tasks.length > (holiday ? 1 : 2) && (
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            +{tasks.length - (holiday ? 1 : 2)} {t.more || '更多'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarCell;