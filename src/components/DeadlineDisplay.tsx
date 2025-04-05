import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface DeadlineDisplayProps {
  deadline: string;
  completed?: boolean;
  taskId: string; // Add taskId prop
}

export const DeadlineDisplay: React.FC<DeadlineDisplayProps> = ({ 
  deadline, 
  completed,
  taskId 
}) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      checkDeadline();
    }, 10000);
    return () => clearInterval(timer);
  }, [deadline, taskId]);

  const checkDeadline = () => {
    if (completed) return;
    
    const deadlineTime = new Date(deadline);
    const now = new Date();
    const minutesUntil = (deadlineTime.getTime() - now.getTime()) / (1000 * 60);

    // Check for specific time thresholds
    if (minutesUntil <= 120 && minutesUntil > 0) { // 2 hours
      notificationService.scheduleNotification(taskId, deadline, '2 hours');
    }
    if (minutesUntil <= 60 && minutesUntil > 0) { // 1 hour
      notificationService.scheduleNotification(taskId, deadline, '1 hour');
    }
    if (minutesUntil <= 30 && minutesUntil > 0) { // 30 minutes
      notificationService.scheduleNotification(taskId, deadline, '30 minutes');
    }
  };

  const getDeadlineColor = (): string => {
    if (completed) return 'text-gray-500 dark:text-gray-400';
    
    const deadlineTime = new Date(deadline);
    const diff = deadlineTime.getTime() - currentTime.getTime();
    const hoursUntil = diff / (1000 * 3600);
    
    if (hoursUntil < 0) return 'text-red-600 dark:text-red-400 font-semibold';
    if (hoursUntil <= 1) return 'text-red-500 dark:text-red-400';
    if (hoursUntil <= 24) return 'text-orange-500 dark:text-orange-400';
    if (hoursUntil <= 72) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  const formatDeadline = (): string => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    // 确保比较的是相同时区的时间
    const diffTime = deadlineDate.getTime() - now.getTime();
    
    // 计算天、小时、分钟
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    // 在计算时间部分添加时区考虑

    // 计算剩余时间
    const deadlineTime = new Date(deadline);
    const currentTime = new Date();
    const timeRemaining = deadlineTime.getTime() - currentTime.getTime();
    const isPast = timeRemaining < 0;
    const isClose = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000; // 1 hour

    console.log(`🕒 显示截止时间:`, {
      deadline: deadlineTime.toLocaleString(),
      当前时间: currentTime.toLocaleString(),
      时区: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // 格式化日期显示
    const formatDate = (date: Date) => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      const isTomorrow = date.getDate() === tomorrow.getDate() &&
                        date.getMonth() === tomorrow.getMonth() &&
                        date.getFullYear() === tomorrow.getFullYear();

      if (isToday) return '今天';
      if (isTomorrow) return '明天';
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    };

    // 时间格式化
    const formatTime = (date: Date) => {
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    };

    // 处理时间显示
    if (diffTime < 0) {
      if (Math.abs(diffHours) < 24) {
        return `已过期 ${Math.abs(diffHours)}小时${Math.abs(diffMinutes)}分钟 (${formatDate(deadlineDate)} ${formatTime(deadlineDate)})`;
      }
      return `已过期 ${Math.abs(diffDays)}天 (${formatDate(deadlineDate)} ${formatTime(deadlineDate)})`;
    }

    if (diffDays > 0) {
      return `${formatDate(deadlineDate)} ${formatTime(deadlineDate)} (${diffDays}天${diffHours}小时后)`;
    }
    if (diffHours > 0) {
      return `${formatDate(deadlineDate)} ${formatTime(deadlineDate)} (${diffHours}小时${diffMinutes}分钟后)`;
    }
    return `${formatDate(deadlineDate)} ${formatTime(deadlineDate)} (${diffMinutes}分钟后)`;
  };

  return (
    <div className={`flex items-center gap-1 transition-all duration-300 ${getDeadlineColor()}`}>
      <Clock className="w-4 h-4" />
      <span>{formatDeadline()}</span>
    </div>
  );
};