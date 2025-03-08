import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface DeadlineDisplayProps {
  deadline: string;
}

export const DeadlineDisplay: React.FC<DeadlineDisplayProps> = ({ deadline }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(timer);
  }, []);

  const getDeadlineColor = (): string => {
    const deadlineTime = new Date(deadline).getTime();
    const hoursUntil = (deadlineTime - currentTime) / (1000 * 3600);
    
    if (hoursUntil < 0) return 'text-red-600 font-semibold';
    if (hoursUntil <= 1) return 'text-red-500';
    if (hoursUntil <= 24) return 'text-orange-500';
    if (hoursUntil <= 72) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatDeadline = (): string => {
    const date = new Date(deadline);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const isPastDeadline = new Date(deadline).getTime() < currentTime;

  return (
    <div className={`flex items-center gap-1 transition-colors duration-300 ${getDeadlineColor()}`}>
      <Clock className="w-4 h-4" />
      <span>
        {isPastDeadline ? 'Past due: ' : ''}
        {formatDeadline()}
      </span>
    </div>
  );
};