import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, 
         endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Task } from '../types';
import { AnimatedText } from './AnimatedText';
import DayPopover from './DayPopover';
import { getHolidayForDate } from '../services/holidayService'; // 导入节假日服务

interface CalendarViewProps {
  tasks: Task[];
  language: 'zh' | 'en';
  t: any;
  onToggleTask: (id: string) => void;
  onCreateNew?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  tasks, 
  language, 
  t,
  onToggleTask,
  onCreateNew 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // 定义弹出层位置类型
  interface PopoverPosition {
    top: number;
    left: number;
    elementRef?: HTMLElement;
  }
  
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({ top: 0, left: 0 });
  
  // 引用存储被点击的元素
  const clickedElementRef = useRef<HTMLElement | null>(null);
  
  // 设置语言环境
  const locale = language === 'zh' ? zhCN : enUS;
  
  // 获取月份的所有日期
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale });
  const endDate = endOfWeek(monthEnd, { locale });
  
  const dateFormat = language === 'zh' ? 'M月' : 'MMMM';
  const yearFormat = language === 'zh' ? 'yyyy年' : 'yyyy';
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // 获取一周的日期标题
  const weekDays = () => {
    const dateFormat = language === 'zh' ? 'EEEEEE' : 'EEE';
    const days = [];
    let startDate = startOfWeek(new Date(), { locale });
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-medium text-sm text-center py-2 text-gray-800 dark:text-gray-50">
          {format(addDays(startDate, i), dateFormat, { locale })}
        </div>
      );
    }
    
    return <div className="grid grid-cols-7 mb-1 bg-gray-50 dark:bg-gray-800 rounded-t-lg shadow-sm">{days}</div>;
  };
  
  // 帮助函数：添加天数
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  // 切换到上个月
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // 切换到下个月
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // 切换到今天所在的月份
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };
  
  // 获取某一天的任务
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      try {
        const taskDate = parseISO(task.deadline);
        return isSameDay(taskDate, date);
      } catch (e) {
        return false;
      }
    });
  };
  
  // 处理日期单元格点击
  const handleDateClick = (day: Date, event: React.MouseEvent) => {
    setSelectedDate(day);
    // 存储被点击的元素
    const targetElement = event.currentTarget as HTMLElement;
    clickedElementRef.current = targetElement;
    
    updatePopoverPosition(targetElement);
    setIsPopoverOpen(true);
  };
  
  // 更新弹出层位置的函数
  const updatePopoverPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setPopoverPosition({
      // 使用 clientRect 坐标而不是加上滚动位置
      top: rect.bottom,
      left: rect.left,
      // 添加元素信息以便在滚动时能够重新计算
      elementRef: element
    });
  };
  
  // 添加滚动事件监听器
  useEffect(() => {
    const handleScroll = () => {
      if (isPopoverOpen && clickedElementRef.current) {
        updatePopoverPosition(clickedElementRef.current);
      }
    };
    
    // 添加事件监听
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isPopoverOpen]);
  
  // 渲染日历单元格
  const cells = days.map((day, index) => {
    const dayTasks = getTasksForDate(day);
    const holiday = getHolidayForDate(day); // 检查是否是节假日
    
    // 找出最高优先级任务
    let highestPriority = '';
    if (dayTasks.length > 0) {
      if (dayTasks.some(t => t.priority === 'High')) highestPriority = 'High';
      else if (dayTasks.some(t => t.priority === 'Medium')) highestPriority = 'Medium';
      else highestPriority = 'Low';
    }
    
    // 为不同优先级设置不同颜色
    const priorityDot = dayTasks.length > 0 ? (
      <div className={`w-2 h-2 rounded-full absolute top-1 right-1
        ${highestPriority === 'High' ? 'bg-red-500' : 
          highestPriority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
    ) : null;
    
    return (
      <div
        key={index}
        className={`relative border border-gray-200 dark:border-gray-700 min-h-[80px] p-2 transition-all duration-200 calendar-day
          ${isSameMonth(day, monthStart) ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/80 text-gray-400 dark:text-gray-400'}
          ${isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
          ${isToday(day) ? 'font-bold border-blue-200 dark:border-blue-700 calendar-today-highlight' : ''}
          ${holiday?.isPublicHoliday ? 'bg-pink-50 dark:bg-pink-900/20' : ''}
          hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer`}
        onClick={(e) => handleDateClick(day, e)}
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
          {dayTasks.length > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-medium rounded-full px-1.5 py-0.5 shadow-sm">
              {dayTasks.length}
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
          {dayTasks.slice(0, holiday ? 1 : 2).map((task, idx) => (
            <div 
              key={idx} 
              className={`text-xs truncate px-1 py-0.5 rounded
                ${task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-200' : // 增强红色文本亮度
                  task.priority === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200' : // 增强黄色文本亮度
                  'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'}  // 增强蓝色文本亮度
                ${task.completed ? 'line-through opacity-60' : ''}`}
            >
              {task.description}
            </div>
          ))}
          {dayTasks.length > (holiday ? 1 : 2) && (
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              +{dayTasks.length - (holiday ? 1 : 2)} {t.more || '更多'}
            </div>
          )}
        </div>
      </div>
    );
  });
  
    const closePopover = () => {
        setIsPopoverOpen(false);
        clickedElementRef.current = null;
    };

  return (
    <div className="calendar-container animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          <AnimatedText 
            text={`${format(currentMonth, dateFormat, { locale })} ${format(currentMonth, yearFormat, { locale })}`} 
          />
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {t.today || '今天'}
          </button>
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 shadow-sm"
            aria-label="上个月"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 shadow-sm"
            aria-label="下个月"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          {onCreateNew && (
            <button 
              onClick={onCreateNew}
              className="p-1.5 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors bg-white dark:bg-gray-800 shadow-sm"
              title={t.newTask || '新任务'}
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* 日历头部 - 显示星期几 */}
      {weekDays()}
      
      {/* 日历主体 */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
        {cells}
      </div>
      
      {/* 日期弹出层 */}
      {isPopoverOpen && (
        <DayPopover
          date={selectedDate}
          tasks={getTasksForDate(selectedDate)}
          position={popoverPosition}
          onClose={closePopover}
          onToggleTask={onToggleTask}
          language={language}
          t={t}
        />
      )}
    </div>
  );
};

export default CalendarView;