import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { tauriNotificationService } from '../services/notificationService';
import { Language } from '../hooks/useLanguage';

interface DeadlineDisplayProps {
  deadline: string;
  completed?: boolean;
  taskId: string;
  taskTitle: string;
  language: Language;
  t: any;
}

export const DeadlineDisplay: React.FC<DeadlineDisplayProps> = ({ 
  deadline, 
  completed = false,
  taskId,
  taskTitle,
  language,
  t
}) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const lastNotificationTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      checkDeadline();
    }, 60000); // 每分钟检查一次
    
    // 初始检查
    checkDeadline();
    
    return () => clearInterval(timer);
  }, [deadline, taskId, taskTitle, completed]);

  // 防止短时间内重复发送通知
  const shouldSendNotification = (timeframe: string): boolean => {
    const now = Date.now();
    const lastTime = lastNotificationTimes.current[timeframe] || 0;
    
    // 5分钟内不重复发送
    if (now - lastTime < 5 * 60 * 1000) {
      return false;
    }
    
    lastNotificationTimes.current[timeframe] = now;
    return true;
  };

  const checkDeadline = () => {
    if (completed) return;
    
    try {
      const deadlineTime = new Date(deadline);
      const now = new Date();
      const minutesUntil = (deadlineTime.getTime() - now.getTime()) / (1000 * 60);
      
      // 设置通知阈值
      if (minutesUntil <= 120 && minutesUntil > 115 && shouldSendNotification('2小时')) {
        tauriNotificationService.scheduleDeadlineNotification(taskId, taskTitle, deadline, '2小时');
      }
      if (minutesUntil <= 60 && minutesUntil > 55 && shouldSendNotification('1小时')) {
        tauriNotificationService.scheduleDeadlineNotification(taskId, taskTitle, deadline, '1小时');
      }
      if (minutesUntil <= 30 && minutesUntil > 25 && shouldSendNotification('30分钟')) {
        tauriNotificationService.scheduleDeadlineNotification(taskId, taskTitle, deadline, '30分钟');
      }
      if (minutesUntil <= 15 && minutesUntil > 10 && shouldSendNotification('15分钟')) {
        tauriNotificationService.scheduleDeadlineNotification(taskId, taskTitle, deadline, '15分钟');
      }
      if (minutesUntil <= 5 && minutesUntil > 0 && shouldSendNotification('5分钟')) {
        tauriNotificationService.scheduleDeadlineNotification(taskId, taskTitle, deadline, '5分钟');
      }
    } catch (error) {
      console.error('检查截止时间出错:', error);
    }
  };

  // 计算剩余时间
  const deadlineTime = new Date(deadline);
  const timeRemaining = deadlineTime.getTime() - currentTime.getTime();
  const isPast = timeRemaining < 0;
  const isClose = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000; // 1小时内
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  
  // 判断是否是明天的任务
  const isNextDay = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      deadlineTime.getDate() === tomorrow.getDate() &&
      deadlineTime.getMonth() === tomorrow.getMonth() &&
      deadlineTime.getFullYear() === tomorrow.getFullYear()
    );
  };

  // 显示格式化的时间
  const getFormattedTime = () => {
    if (completed) {
      return t.deadline.completed;
    }

    if (isPast) {
      // 已过期，显示过期时长
      const daysElapsed = Math.floor(Math.abs(timeRemaining) / (1000 * 60 * 60 * 24));
      const hoursElapsed = Math.floor((Math.abs(timeRemaining) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesElapsed = Math.floor((Math.abs(timeRemaining) % (1000 * 60 * 60)) / (1000 * 60));
      
      if (daysElapsed > 0) {
        return `${t.deadline.expired} ${daysElapsed}${t.deadline.days}${hoursElapsed}${t.deadline.hours}`;
      } else if (hoursElapsed > 0) {
        return `${t.deadline.expired} ${hoursElapsed}${t.deadline.hours}${minutesElapsed}${t.deadline.minutes}`;
      } else {
        return `${t.deadline.expired} ${minutesElapsed}${t.deadline.minutes}`;
      }
    }

    // 实现新的逻辑：如果超过12小时且明天到期，则显示"明天HH:MM"
    if (hoursRemaining > 12 && isNextDay()) {
      const timeFormat = language === 'zh' ? 
        { hour: '2-digit', minute: '2-digit', hour12: false } : 
        { hour: 'numeric', minute: '2-digit', hour12: true };
      
      const formattedTime = deadlineTime.toLocaleTimeString(
        language === 'zh' ? 'zh-CN' : 'en-US', 
        timeFormat
      );
      
      return `${t.deadline.tomorrow} ${formattedTime}`;
    }

    // 常规剩余时间显示
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemainder = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemainder = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (daysRemaining > 0) {
      return `${t.deadline.remaining} ${daysRemaining}${t.deadline.days}${hoursRemainder}${t.deadline.hours}`;
    } else if (hoursRemainder > 0) {
      return `${t.deadline.remaining} ${hoursRemainder}${t.deadline.hours}${minutesRemainder}${t.deadline.minutes}`;
    } else {
      return `${t.deadline.remaining} ${minutesRemainder}${t.deadline.minutes}`;
    }
  };

  return (
    <div className={`inline-flex items-center text-sm rounded-full px-2 py-1 ${
      completed 
        ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' 
        : isPast 
        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
        : isClose
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
    }`}>
      <Clock size={14} className="mr-1" />
      <span>{getFormattedTime()}</span>
    </div>
  );
};