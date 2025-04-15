import React, { useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task } from '../../services/storage/types';
import TimeSlot from './TimeSlot';

interface TimelineViewProps {
  date: Date;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
  isToday: () => boolean;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  onToggleTask,
  language,
  t,
  isToday
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hourHeight, setHourHeight] = useState(64); // 默认高度
  
  // 检查是否有安排在凌晨和早上的任务
  const getTaskHour = (task: Task): number => {
    if (!task.deadline) return 9; // 默认上午9点
    
    try {
      const deadlineDate = new Date(task.deadline);
      if (deadlineDate instanceof Date && !isNaN(deadlineDate.getTime())) {
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
  
  // 确定实际需要显示的时间范围
  const hasEarlyTasks = timeSlots.slice(0, 7).some(hour => tasksByHour[hour]?.length > 0);
  const hasLateTasks = timeSlots.slice(20, 24).some(hour => tasksByHour[hour]?.length > 0);
  const startHour = hasEarlyTasks ? 0 : 7; // 如果有早起任务则从0点开始显示，否则从7点
  const endHour = hasLateTasks ? 24 : 21; // 如果有晚上任务则显示到24点，否则21点
  
  // 在组件挂载和任务变化时动态计算hourHeight
  useEffect(() => {
    if (timelineRef.current) {
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
  }, [tasks.length]);

  // 添加一个实时更新当前时间指示器的效果
  useEffect(() => {
    if (!isToday()) return;
    
    // 每分钟更新一次时间指示器位置
    const timer = setInterval(() => {
      // 强制重新渲染以更新时间指示器
      setHourHeight(prev => prev + 0.001); // 微小变化触发重渲染
    }, 60000);
    
    return () => clearInterval(timer);
  }, [isToday]);
  
  // 渲染当前时间指示器
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
  
  // 自动滚动到当前时间
  useEffect(() => {
    if (isToday() && timelineRef.current) {
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
  }, [isToday, startHour, endHour]);
  
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
            <TimeSlot
              key={hour}
              hour={hour}
              hourFormatted={hourFormatted}
              tasks={tasksInHour}
              onToggleTask={onToggleTask}
              isCurrentHour={isCurrentHour}
              language={language}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;