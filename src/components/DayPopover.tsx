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
  position: { 
    top: number; 
    left: number;
    elementRef?: HTMLElement; // 可选的元素引用
  };
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
  
  // 在DayPopover组件中添加状态来跟踪时间线容器高度
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hourHeight, setHourHeight] = useState(64); // 默认高度

  // 添加关闭状态跟踪
  const [isClosing, setIsClosing] = useState(false);

  // 点击外部关闭弹出层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !isClosing) {
        handleClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isClosing]);
  
  // 格式化日期显示
  const dateFormat = language === 'zh' ? 'yyyy年M月d日 EEEE' : 'EEEE, MMMM d, yyyy';
  
  // 调整弹出层位置，避免溢出屏幕并保持在点击元素附近
  const adjustPosition = () => {
    if (!popoverRef.current) return position;
    
    const popover = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverRect = popover.getBoundingClientRect();
    
    // 使用客户端坐标（相对于视口）
    let adjustedTop = position.top;
    let adjustedLeft = position.left;
    
    // 检查右边界
    if (adjustedLeft + popoverRect.width > viewportWidth) {
      // 如果弹出窗口宽度超出右边界，将它向左移动
      adjustedLeft = Math.max(10, viewportWidth - popoverRect.width - 10);
    }
    
    // 检查下边界
    if (adjustedTop + popoverRect.height > viewportHeight) {
      // 如果有引用元素，将弹窗放在元素上方
      if (position.elementRef) {
        const elementRect = position.elementRef.getBoundingClientRect();
        adjustedTop = elementRect.top - popoverRect.height - 5;
      } else {
        // 没有元素引用时，确保至少在视口内
        adjustedTop = Math.max(10, viewportHeight - popoverRect.height - 10);
      }
    }
    
    // 确保不会超出顶部边界
    if (adjustedTop < 10) {
      adjustedTop = 10;
    }
    
    return {
      top: adjustedTop,
      left: adjustedLeft,
      elementRef: position.elementRef
    };
  };
  
  // 使用状态保存调整后的位置并在位置变化时更新
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  // 当位置变化或窗口大小改变时平滑过渡
  useEffect(() => {
    const updatePosition = () => {
      const newPosition = adjustPosition();
      
      // 使用CSS transition实现平滑移动
      if (popoverRef.current) {
        popoverRef.current.style.transition = 'top 0.2s, left 0.2s';
        setTimeout(() => {
          if (popoverRef.current) popoverRef.current.style.transition = '';
        }, 200);
      }
      
      setAdjustedPosition(newPosition);
    };
    
    // 初始计算
    const timer = setTimeout(updatePosition, 10);
    
    // 监听窗口大小变化和滚动事件
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
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

  // 在组件挂载和视图模式变化时动态计算hourHeight
  useEffect(() => {
    if (viewMode === 'timeline' && timelineRef.current) {
      // 给视图切换一点时间来渲染
      const timer = setTimeout(() => {
        const firstHourEl = timelineRef.current?.querySelector('.time-slot');
        if (firstHourEl) {
          // 使用实际测量的高度
          setHourHeight(firstHourEl.clientHeight);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, tasks.length]);

  // 添加一个实时更新当前时间指示器的效果
  useEffect(() => {
    if (viewMode !== 'timeline' || !isToday()) return;
    
    // 每分钟更新一次时间指示器位置
    const timer = setInterval(() => {
      // 强制重新渲染以更新时间指示器
      setHourHeight(prev => prev + 0.001); // 微小变化触发重渲染
    }, 60000);
    
    return () => clearInterval(timer);
  }, [viewMode, isToday]);

  // 修改渲染当前时间指示器函数
  const renderCurrentTimeIndicator = () => {
    if (!isToday()) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 如果当前时间不在显示范围内，不渲染指示器
    if (currentHour < startHour || currentHour >= endHour) return null;
    
    // 计算位置：当前小时的位置 + 分钟比例
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

  // 修改renderTimelineView函数，添加ref
  const renderTimelineView = () => {
    return (
      <div className="timeline-view relative" ref={timelineRef}>
        {renderCurrentTimeIndicator()}
        <div className="space-y-1 px-1">
          {timeSlots.slice(startHour, endHour).map(hour => {
            const tasksInHour = tasksByHour[hour] || [];
            const hourFormatted = 
              language === 'zh' 
                ? `${hour}:00` 
                : `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            
            const now = new Date();
            const isCurrentHour = isToday() && hour === now.getHours();
            
            return (
              <div 
                key={hour} 
                className={`time-slot group relative ${isCurrentHour ? 'current-hour' : ''}`}
              >
                {/* 时间指示 */}
                <div className="flex items-center mb-1">
                  <div className="time-label text-xs font-semibold text-gray-500 dark:text-gray-300 w-14">
                    {hourFormatted}
                  </div>
                  <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>
                
                {/* 改进时间线任务项的渲染 */}
                <div className="ml-14 space-y-1.5">
                  {tasksInHour.map((task) => (
                    <div 
                      key={task.id} 
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
                          
                          <TaskDetails task={task} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

  // 在DayPopover.tsx中添加自动滚动到当前时间的功能
  useEffect(() => {
    if (viewMode === 'timeline' && isToday() && timelineRef.current) {
      // 等待视图渲染
      const timer = setTimeout(() => {
        const now = new Date();
        const currentHour = now.getHours();
        
        // 只有当当前小时在显示范围内时滚动
        if (currentHour >= startHour && currentHour < endHour && timelineRef.current) {
          // 找到当前小时的元素
          const currentHourElement = timelineRef.current.querySelector(
            `.time-slot:nth-child(${currentHour - startHour + 1})`
          );
          
          if (currentHourElement && timelineRef.current) {
            // 滚动到当前时间的位置，并留出一些上方空间
            timelineRef.current.parentElement?.scrollTo({
              top: (currentHourElement as HTMLElement).offsetTop - 100,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [viewMode, isToday, startHour, endHour]);

  // 修改关闭按钮处理函数
  const handleClose = () => {
    setIsClosing(true);
    // 动画完成后真正关闭
    setTimeout(() => {
      onClose();
    }, 250); // 与动画持续时间匹配
  };

  return (
    <div 
      ref={popoverRef}
      className={`fixed z-50 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${isClosing ? 'popover-close' : 'popover-animation'}`}
      style={{
        position: 'fixed',
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`
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
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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