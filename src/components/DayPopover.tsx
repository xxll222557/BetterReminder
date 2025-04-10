import React, { useEffect, useRef, useState } from 'react';
import { format, isValid } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { X, CheckCircle, Circle, List, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../types';
import { DeadlineDisplay } from './DeadlineDisplay';
import { getHolidayForDate } from '../services/holidayService';

interface DayPopoverProps {
  date: Date;
  tasks: Task[];
  position: { top: number; left: number };
  onClose: () => void;
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

// 视图模式类型
type ViewMode = 'list' | 'timeline';

const DayPopover: React.FC<DayPopoverProps> = ({
  date,
  tasks,
  position,
  onClose,
  onToggleTask,
  language,
  t
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const locale = language === 'zh' ? zhCN : enUS;
  
  // 添加视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // 点击外部关闭弹出层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // 格式化日期显示
  const dateFormat = language === 'zh' ? 'yyyy年M月d日 EEEE' : 'EEEE, MMMM d, yyyy';
  
  // 调整弹出层位置，避免溢出屏幕
  const adjustPosition = () => {
    if (!popoverRef.current) return position;
    
    const popover = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverRect = popover.getBoundingClientRect();
    
    // 考虑当前滚动位置
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    // 计算相对于视口的位置
    const viewportTop = position.top - scrollY;
    const viewportLeft = position.left - scrollX;
    
    let adjustedTop = position.top;
    let adjustedLeft = position.left;
    
    // 检查右边界
    if (viewportLeft + popoverRect.width > viewportWidth) {
      adjustedLeft = scrollX + viewportWidth - popoverRect.width - 10;
    }
    
    // 检查下边界
    if (viewportTop + popoverRect.height > viewportHeight) {
      // 将弹出窗口放在点击元素上方而不是下方
      adjustedTop = scrollY + viewportTop - popoverRect.height - 10;
    }
    
    return {
      top: adjustedTop,
      left: adjustedLeft
    };
  };
  
  // 当位置变化或组件挂载时重新计算
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);
  
  useEffect(() => {
    // 使用setTimeout确保popoverRef.current可用
    const timer = setTimeout(() => {
      setAdjustedPosition(adjustPosition());
    }, 10);
    
    return () => clearTimeout(timer);
  }, [position]);
  
  // 获取节假日信息
  const holiday = getHolidayForDate(date);
  
  // 获取任务的小时数，用于时间线定位
  const getTaskHour = (task: Task): number => {
    if (!task.deadline) return 9; // 默认上午9点
    
    try {
      const deadlineDate = new Date(task.deadline);
      if (isValid(deadlineDate)) {
        return deadlineDate.getHours();
      }
    } catch (e) {
      console.error('解析任务时间失败', e);
    }
    return 9; // 默认值
  };
  
  // 按时间排序任务
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  
  // 创建24小时时间数组
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  // 根据时间分组任务
  const tasksByHour = timeSlots.reduce((acc, hour) => {
    acc[hour] = sortedTasks.filter(task => getTaskHour(task) === hour);
    return acc;
  }, {} as Record<number, Task[]>);
  
  // 检查是否有安排在凌晨和早上的任务
  const hasEarlyTasks = timeSlots.slice(0, 7).some(hour => tasksByHour[hour]?.length > 0);
  // 检查是否有安排在晚上的任务
  const hasLateTasks = timeSlots.slice(20, 24).some(hour => tasksByHour[hour]?.length > 0);
  
  // 确定实际需要显示的时间范围
  const startHour = hasEarlyTasks ? 0 : 7; // 如果有早起任务则从0点开始显示，否则从7点
  const endHour = hasLateTasks ? 24 : 21; // 如果有晚上任务则显示到24点，否则21点
  
  // 视图切换按钮
  const ViewToggleButton = () => (
    <div className="flex justify-center mt-2 mb-4">
      <div className="inline-flex rounded-lg shadow-sm">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4 inline-block mr-1" />
          {language === 'zh' ? '列表视图' : 'List View'}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            viewMode === 'timeline'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setViewMode('timeline')}
        >
          <Clock className="w-4 h-4 inline-block mr-1" />
          {language === 'zh' ? '时间线视图' : 'Timeline View'}
        </button>
      </div>
    </div>
  );

  // 检查所选日期是否是今天
  const isToday = () => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  // 渲染当前时间指示器
  const renderCurrentTimeIndicator = () => {
    if (!isToday()) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 如果当前时间不在显示范围内，不渲染指示器
    if (currentHour < startHour || currentHour >= endHour) return null;
    
    const hourHeight = 64; // 每小时块的大致高度，根据实际情况调整
    const position = (currentHour - startHour) * hourHeight + (currentMinute / 60) * hourHeight;
    
    return (
      <div 
        className="current-time-indicator" 
        style={{ top: `${position}px` }}
      >
        <div className="current-time-label">
          {format(now, 'HH:mm')}
        </div>
      </div>
    );
  };

  // 渲染时间线视图
  const renderTimelineView = () => {
    return (
      <div className="timeline-view relative">
        {renderCurrentTimeIndicator()}
        <div className="space-y-1 px-1">
          {timeSlots.slice(startHour, endHour).map(hour => {
            const tasksInHour = tasksByHour[hour] || [];
            const hourFormatted = 
              language === 'zh' 
                ? `${hour}:00` 
                : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            
            return (
              <div key={hour} className={`time-slot group relative`}>
                {/* 时间指示 */}
                <div className="flex items-center mb-1">
                  <div className="time-label text-xs font-semibold text-gray-500 dark:text-gray-300 w-14">
                    {hourFormatted}
                  </div>
                  <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>
                
                {/* 任务项目 */}
                {tasksInHour.length > 0 ? (
                  <div className="ml-14 space-y-1">
                    {tasksInHour.map((task) => (
                      <div 
                        key={task.id} 
                        className={`py-1.5 px-2 rounded-md transition-all duration-200 border-l-4
                          ${task.priority === 'High' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : task.priority === 'Medium'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          }
                          ${task.completed ? 'opacity-60' : ''}
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
                            
                            <TaskDetails task={task} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-14 h-4"></div> // 空间位占位符，保持一致性
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 展开/收起任务详情的组件
  const TaskDetails = ({ task }: { task: Task }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
      <>
        {task.deadline && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
            {format(new Date(task.deadline), 'HH:mm', { locale })}
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
      </>
    );
  };

  return (
    <div 
      ref={popoverRef}
      className="fixed z-50 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in"
      style={{
        top: adjustedPosition.top + 'px',
        left: adjustedPosition.left + 'px'
      }}
    >
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
        <div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {format(date, dateFormat, { locale })}
          </div>
          {/* 显示节假日信息 */}
          {holiday && (
            <div className={`text-sm mt-1 ${
              holiday.isPublicHoliday 
                ? 'text-red-600 dark:text-red-300 font-medium'
                : 'text-orange-600 dark:text-orange-300'
            }`}>
              {holiday.name} {holiday.isPublicHoliday && (language === 'zh' ? '(法定假日)' : '(Public Holiday)')}
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
      
      {tasks.length > 0 && <ViewToggleButton />}
      
      <div className="p-4 max-h-[65vh] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            {t.noTasksForThisDay || '这一天没有任务'}
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className="space-y-3">
              {/* 原有的列表视图 */}
              {sortedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 
                    ${task.completed ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-1 flex-shrink-0 transition-colors duration-200"
                    >
                      {task.completed ? (
                        <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
                      ) : (
                        <Circle size={18} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" />
                      )}
                    </button>
                    
                    <div className={`flex-grow ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : ''}`}>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {task.description}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-200">
                        {task.creative_idea}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.deadline && (
                          <DeadlineDisplay
                            deadline={task.deadline}
                            completed={task.completed}
                            taskId={task.id}
                            taskTitle={task.description}
                            language={language}
                            t={t}
                          />
                        )}
                        
                        <span className={`inline-flex items-center text-xs rounded-full px-2 py-1
                          ${task.priority === 'High' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : task.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}
                        >
                          {t.priority[task.priority]}
                        </span>
                        
                        <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-2 py-1">
                          {task.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            renderTimelineView()
          )
        )}
      </div>
    </div>
  );
};

export default DayPopover;