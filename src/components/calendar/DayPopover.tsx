import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { X, List, Clock, CheckCircle, Circle } from 'lucide-react';
import { Task } from '../../services/storage/types';
import TimelineView from '../timeline/TimelineView';
import { getHolidayForDate } from '../../services/utils/holidayService';
import { DeadlineDisplay } from '../common/DeadlineDisplay';


interface DayPopoverProps {
  date: Date;
  tasks: Task[];
  position: { 
    top: number; 
    left: number;
    elementRef?: HTMLElement; // 可选的元素引用
  };
  onClose: () => void;
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

// 视图模式类型
type ViewMode = 'list' | 'timeline';

const DayPopover: React.FC<DayPopoverProps> = ({
  date,
  tasks,
  position,
  onClose,
  onToggleTask,
  language,
  t
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const locale = language === 'zh' ? zhCN : enUS;
  
  // 添加视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // 追踪调整后的位置
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  // 添加关闭状态跟踪
  const [isClosing, setIsClosing] = useState(false);

  // 点击外部关闭弹出层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && !isClosing) {
        handleClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isClosing]);
  
  // 检查所选日期是否是今天
  const isToday = () => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // 调整弹出层位置，避免溢出屏幕并保持在点击元素附近
  const adjustPosition = () => {
    if (!popoverRef.current) return position;
    
    const popover = popoverRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverRect = popover.getBoundingClientRect();
    
    // 使用客户端坐标（相对于视口）
    let adjustedTop = position.top;
    let adjustedLeft = position.left;
    
    // 检查右边界
    if (adjustedLeft + popoverRect.width > viewportWidth) {
      // 如果弹出窗口宽度超出右边界，将它向左移动
      adjustedLeft = Math.max(10, viewportWidth - popoverRect.width - 10);
    }
    
    // 检查下边界
    if (adjustedTop + popoverRect.height > viewportHeight) {
      // 如果有引用元素，将弹窗放在元素上方
      if (position.elementRef) {
        const elementRect = position.elementRef.getBoundingClientRect();
        adjustedTop = elementRect.top - popoverRect.height - 5;
      } else {
        // 没有元素引用时，确保至少在视口内
        adjustedTop = Math.max(10, viewportHeight - popoverRect.height - 10);
      }
    }
    
    // 确保不会超出顶部边界
    if (adjustedTop < 10) {
      // 如果弹出窗口高度超出上边界，将它向下移动
      adjustedTop = position.elementRef 
        ? position.elementRef.getBoundingClientRect().bottom + 5
        : 10;
    }
    
    return { top: adjustedTop, left: adjustedLeft };
  };
  
  // 处理窗口滚动和大小调整时更新位置
  useEffect(() => {
    const updatePosition = () => {
      const newPosition = adjustPosition();
      
      // 使用CSS transition实现平滑移动
      if (popoverRef.current) {
        popoverRef.current.style.transition = 'top 0.2s, left 0.2s';
        setTimeout(() => {
          if (popoverRef.current) popoverRef.current.style.transition = '';
        }, 200);
      }
      
      setAdjustedPosition(newPosition);
    };
    
    // 初始计算
    const timer = setTimeout(updatePosition, 10);
    
    // 监听窗口大小变化和滚动事件
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [position]);
  
  // 获取节假日信息
  const holiday = getHolidayForDate(date);
  
  // 按时间排序任务
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  
  // 视图切换按钮
  const ViewToggleButton = () => (
    <div className="flex justify-center mt-2 mb-4">
      <div className="inline-flex rounded-lg shadow-sm">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4 inline-block mr-1" />
          {language === 'zh' ? '列表视图' : 'List View'}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            viewMode === 'timeline'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setViewMode('timeline')}
        >
          <Clock className="w-4 h-4 inline-block mr-1" />
          {language === 'zh' ? '时间线视图' : 'Timeline View'}
        </button>
      </div>
    </div>
  );
  
  // 修改关闭按钮处理函数
  const handleClose = () => {
    setIsClosing(true);
    // 动画完成后真正关闭
    setTimeout(() => {
      onClose();
    }, 250); // 与动画持续时间匹配
  };

  // 格式化日期显示
  const dateFormat = language === 'zh' ? 'yyyy年M月d日 EEEE' : 'EEEE, MMMM d, yyyy';

  return (
    <div 
      ref={popoverRef}
      className={`fixed z-50 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${isClosing ? 'popover-close' : 'popover-animation'}`}
      style={{
        position: 'fixed',
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`
      }}
    >
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
        <div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {format(date, dateFormat, { locale })}
          </div>
          {/* 显示节假日信息 */}
          {holiday && (
            <div className={`text-sm mt-1 ${
              holiday.isPublicHoliday 
                ? 'text-red-600 dark:text-red-300 font-medium'
                : 'text-orange-600 dark:text-orange-300'
            }`}>
              {holiday.name} {holiday.isPublicHoliday && (language === 'zh' ? '(法定假日)' : '(Public Holiday)')}
            </div>
          )}
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      {tasks.length > 0 && <ViewToggleButton />}
      
      <div className="p-4 max-h-[65vh] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            {t.noTasksForThisDay || '这一天没有任务'}
          </div>
        ) : (
          viewMode === 'list' ? (
            <TaskListView 
              tasks={sortedTasks}
              onToggleTask={onToggleTask}
              language={language}
              t={t}
            />
          ) : (
            <TimelineView 
              date={date}
              tasks={tasks}
              onToggleTask={onToggleTask}
              language={language}
              t={t}
              isToday={isToday}
            />
          )
        )}
      </div>
    </div>
  );
};

// 列表视图组件
interface TaskListViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onToggleTask,
  language,
  t
}) => {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id}
          task={task}
          onToggleTask={onToggleTask}
          language={language}
          t={t}
        />
      ))}
    </div>
  );
};

// 任务卡片组件
interface TaskCardProps {
  task: Task;
  onToggleTask: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleTask,
  language,
  t
}) => {
  const [] = useState(false);
  
  return (
    <div 
      className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 
        ${task.completed ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggleTask(task.id)}
          className="mt-1 flex-shrink-0 transition-colors duration-200"
        >
          {task.completed ? (
            <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
          ) : (
            <Circle size={18} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" />
          )}
        </button>
        
        <div className={`flex-grow ${task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : ''}`}>
          <div className="font-medium text-gray-900 dark:text-white">
            {task.description}
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-200">
            {task.creative_idea}
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {task.deadline && (
              <DeadlineDisplay
                deadline={task.deadline}
                completed={task.completed}
                taskId={task.id}
                taskTitle={task.description}
                language={language}
                t={t}
              />
            )}
            
            <span className={`inline-flex items-center text-xs rounded-full px-2 py-1
              ${task.priority === 'High' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                : task.priority === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {t.priority[task.priority]}
            </span>
            
            <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-2 py-1">
              {task.estimatedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayPopover;