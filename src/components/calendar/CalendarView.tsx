import React, { useState, useEffect, useRef } from 'react';
import { 
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameDay, parseISO, addDays, format 
} from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Task } from '../../services/storage/types';
import DayPopover from './DayPopover';
import { getHolidayForDate } from '../../services/utils/holidayService';
import CalendarCell from './CalendarCell';
import MonthNavigation from './MonthNavigation';

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
  
  // 关闭弹出层
  const closePopover = () => {
    setIsPopoverOpen(false);
    clickedElementRef.current = null;
  };

  return (
    <div className="calendar-container animate-fade-in">
      <MonthNavigation 
        currentMonth={currentMonth}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        goToToday={goToToday}
        onCreateNew={onCreateNew}
        dateFormat={dateFormat}
        yearFormat={yearFormat}
        locale={locale}
        t={t}
      />
      
      {/* 日历头部 - 显示星期几 */}
      {weekDays()}
      
      {/* 日历主体 */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
        {days.map((day, index) => (
          <CalendarCell 
            key={index}
            day={day}
            monthStart={monthStart}
            selectedDate={selectedDate}
            tasks={getTasksForDate(day)}
            holiday={getHolidayForDate(day)}
            onClick={handleDateClick}
            language={language}
            t={t}
          />
        ))}
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