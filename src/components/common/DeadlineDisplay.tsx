import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Language } from '../../hooks/useLanguage';
import { sendAppNotification } from '../../services/utils/notificationService';

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
  // 使用 ref 记录已发送的通知，避免重复发送
  const sentNotifications = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // 每次更新时间时检查截止时间
      checkDeadlineAndNotify();
    }, 60000); // 每分钟更新一次时间
    
    // 初始运行一次
    checkDeadlineAndNotify();
    
    return () => clearInterval(timer);
  }, []);

  // 检查截止时间并发送通知
  const checkDeadlineAndNotify = () => {
    if (completed || !deadline) return;
    
    try {
      const deadlineTime = new Date(deadline).getTime();
      const now = new Date().getTime();
      const timeRemaining = deadlineTime - now;
      
      // 任务已经过期
      if (timeRemaining <= 0) {
        // 过期不超过5分钟且未发送过通知
        if (timeRemaining > -300000 && !sentNotifications.current[`${taskId}-expired`]) {
          sendNotification('expired');
        }
        return;
      }
      
      // 任务即将到期（1小时内）
      if (timeRemaining <= 3600000 && !sentNotifications.current[`${taskId}-imminent`]) {
        sendNotification('imminent');
      }
      // 任务临近到期（24小时内）
      else if (timeRemaining <= 86400000 && !sentNotifications.current[`${taskId}-approaching`]) {
        sendNotification('approaching');
      }
    } catch (e) {
      console.error('检查截止时间出错:', e);
    }
  };

  // 发送通知
  const sendNotification = async (type: 'expired' | 'imminent' | 'approaching') => {
    try {
      const notificationKey = `${taskId}-${type}`;
      
      // 设置通知内容
      let title, body;
      const taskName = taskTitle || t.task;
      
      if (type === 'expired') {
        title = language === 'zh' ? '任务已过期' : 'Task Expired';
        body = language === 'zh' 
          ? `任务"${taskName}"已经过期` 
          : `Task "${taskName}" has expired`;
      } else if (type === 'imminent') {
        title = language === 'zh' ? '任务即将到期' : 'Task Due Soon';
        body = language === 'zh' 
          ? `任务"${taskName}"将在1小时内到期` 
          : `Task "${taskName}" is due within 1 hour`;
      } else {
        title = language === 'zh' ? '任务截止时间提醒' : 'Task Deadline Reminder';
        body = language === 'zh' 
          ? `任务"${taskName}"将在24小时内到期` 
          : `Task "${taskName}" is due within 24 hours`;
      }
      
      // 发送通知
      const sent = await sendAppNotification(title, body);
      if (sent) {
        sentNotifications.current[notificationKey] = true;
      }
    } catch (e) {
      console.error('发送通知出错:', e);
    }
  };

  // 格式化时间显示
  const getFormattedTime = () => {
    if (!deadline) return '';
    
    try {
      const deadlineTime = new Date(deadline).getTime();
      const now = currentTime.getTime();
      const timeRemaining = deadlineTime - now;
      
      // 如果任务已完成，显示"已完成"
      if (completed) {
        return t.deadline.completed;
      }
      
      // 判断是否已过期
      const isPast = timeRemaining < 0;
      if (isPast) {
        return t.deadline.expired;
      }
      
      // 判断是否是明天
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const deadlineDate = new Date(deadline);
      const isTomorrow = deadlineDate.getDate() === tomorrow.getDate() &&
                        deadlineDate.getMonth() === tomorrow.getMonth() &&
                        deadlineDate.getFullYear() === tomorrow.getFullYear();
      
      if (isTomorrow) {
        // 显示"明天 HH:MM"格式
        const formattedTime = new Date(deadline).toLocaleTimeString(
          language === 'zh' ? 'zh-CN' : 'en-US',
          { hour: '2-digit', minute: '2-digit', hour12: language === 'en' }
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
    } catch (e) {
      console.error('解析截止时间出错:', e);
      return '';
    }
  };

  const isPast = deadline ? new Date(deadline).getTime() < currentTime.getTime() : false;
  const isClose = !isPast && deadline ? 
    (new Date(deadline).getTime() - currentTime.getTime()) < 3600000 : false;

  return (
    <div className={`inline-flex items-center text-sm rounded-full px-2 py-1 ${
      completed 
        ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200' // 提高已完成状态可读性
        : isPast 
        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200'  // 增强过期状态对比度
        : isClose
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200' // 增强接近截止对比度
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' // 普通截止日期
    }`}>
      <Clock size={14} className="mr-1" />
      <span>{getFormattedTime()}</span>
    </div>
  );
};

export default DeadlineDisplay;