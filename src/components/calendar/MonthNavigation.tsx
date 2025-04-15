import React from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { AnimatedText } from '../common/AnimatedText';

interface MonthNavigationProps {
  currentMonth: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  onCreateNew?: () => void;
  dateFormat: string;
  yearFormat: string;
  locale: Locale;
  t: any;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  currentMonth,
  prevMonth,
  nextMonth,
  goToToday,
  onCreateNew,
  dateFormat,
  yearFormat,
  locale,
  t
}) => {
  return (
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
  );
};

export default MonthNavigation;