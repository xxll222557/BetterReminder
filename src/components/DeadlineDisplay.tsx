import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Language } from '../hooks/useLanguage';
import { sendAppNotification } from '../services/notificationService';

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
  }, [deadline, taskId, completed]);

  // 检查截止时间并在特定时间点发送通知
  const checkDeadlineAndNotify = async () => {
    // 如果任务已完成，不发送通知
    if (completed) return;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const minutesUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);
    
    // 通知发送的关键节点（分钟）
    const notificationPoints = {
      expired: -1,      // 刚过期
      immediate: 0,     // 正好到期
      fiveMin: 5,       // 还有5分钟
      fifteenMin: 15,   // 还有15分钟
      oneHour: 60,      // 还有1小时
      oneDay: 1440      // 还有1天
    };
    
    // 检查通知类型并发送
    const checkAndSend = async (type: keyof typeof notificationPoints, condition: boolean) => {
      const notificationKey = `${taskId}-${type}`;
      if (condition && !sentNotifications.current[notificationKey]) {
        let title = '';
        let body = '';
        
        switch (type) {
          case 'expired':
            title = t.notifications?.taskExpired || '任务已过期';
            body = `${taskTitle} ${t.notifications?.hasExpired || '已经过期'}`;
            break;
          case 'immediate':
            title = t.notifications?.taskDueNow || '任务已到期';
            body = `${taskTitle} ${t.notifications?.dueNow || '已经到期'}`;
            break;
          case 'fiveMin':
            title = t.notifications?.taskDueSoon || '任务即将到期';
            body = `${taskTitle} ${t.notifications?.dueIn5Min || '将在5分钟内到期'}`;
            break;
          case 'fifteenMin':
            title = t.notifications?.taskDueSoon || '任务即将到期';
            body = `${taskTitle} ${t.notifications?.dueIn15Min || '将在15分钟内到期'}`;
            break;
          case 'oneHour':
            title = t.notifications?.taskDueSoon || '任务即将到期';
            body = `${taskTitle} ${t.notifications?.dueIn1Hour || '将在1小时内到期'}`;
            break;
          case 'oneDay':
            title = t.notifications?.taskDueSoon || '任务即将到期';
            body = `${taskTitle} ${t.notifications?.dueIn24Hours || '将在24小时内到期'}`;
            break;
        }
        
        const success = await sendAppNotification(title, body);
        if (success) {
          sentNotifications.current[notificationKey] = true;
        }
      }
    };
    
    // 从最紧急到最不紧急的顺序检查各个通知点
    await checkAndSend('expired', minutesUntil < 0 && minutesUntil > -10); // 刚过期10分钟内
    await checkAndSend('immediate', minutesUntil >= 0 && minutesUntil < 1);
    await checkAndSend('fiveMin', minutesUntil >= 4 && minutesUntil < 6);
    await checkAndSend('fifteenMin', minutesUntil >= 14 && minutesUntil < 16);
    await checkAndSend('oneHour', minutesUntil >= 59 && minutesUntil < 61);
    await checkAndSend('oneDay', minutesUntil >= 1439 && minutesUntil < 1441);
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

  // 显示格式化的时间（原有功能保持不变）
  const getFormattedTime = () => {
    // 原有的格式化时间代码保持不变
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
      const formattedTime = deadlineTime.toLocaleTimeString(
        language === 'zh' ? 'zh-CN' : 'en-US'
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