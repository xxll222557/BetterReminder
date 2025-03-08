import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface DeadlineDisplayProps {
  deadline: string;  // From ApiResponse.deadline
  completed?: boolean;
}

export const DeadlineDisplay: React.FC<DeadlineDisplayProps> = ({ 
  deadline,
  completed = false 
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getDeadlineColor = (): string => {
    if (completed) return 'text-gray-500 dark:text-gray-400';
    
    const deadlineTime = new Date(deadline).getTime();
    const hoursUntil = (deadlineTime - currentTime) / (1000 * 3600);
    
    if (hoursUntil < 0) return 'text-red-600 dark:text-red-400 font-semibold';
    if (hoursUntil <= 1) return 'text-red-500 dark:text-red-400';
    if (hoursUntil <= 24) return 'text-orange-500 dark:text-orange-400';
    if (hoursUntil <= 72) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  // Simply display the deadline time from API response
  const formatDeadline = (): string => {
    try {
      const date = new Date(deadline);
      // Keep time format consistent with API response
      console.log('Deadline:', deadline);
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return deadline;
    }
  };

  const isPastDeadline = new Date(deadline).getTime() < currentTime;

  return (
    <div className={`flex items-center gap-2 transition-colors duration-300 ${getDeadlineColor()}`}>
      <Clock className="w-4 h-4" />
      <span className="whitespace-nowrap font-medium">
        {isPastDeadline && !completed ? 'Past due: ' : ''}
        {formatDeadline()}
      </span>
    </div>
  );
};