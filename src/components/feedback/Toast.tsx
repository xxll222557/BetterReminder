import React, { useEffect, useState, useRef } from 'react';
import { X, AlertOctagon, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 5000, // 默认5秒后关闭
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 入场动画
  useEffect(() => {
    // 设置短暂延迟后移除入场动画状态
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 300);
    
    return () => clearTimeout(enterTimer);
  }, []);

  // 设置自动关闭
  useEffect(() => {
    if (isPaused || isExiting) return;

    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, isPaused, isExiting]);

  // 鼠标悬停暂停计时
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // 鼠标离开恢复计时
  const handleMouseLeave = () => {
    setIsPaused(false);
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);
  };

  // 关闭处理
  const handleClose = () => {
    setIsExiting(true);
    
    // 动画完成后调用实际的关闭函数
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 根据类型设置样式和图标
  let bgColor = '';
  let borderColor = '';
  let progressColor = '';
  let icon = null;

  switch (type) {
    case 'error':
      bgColor = 'bg-red-500 dark:bg-red-600';
      borderColor = 'border-red-400 dark:border-red-700';
      progressColor = 'bg-red-400 dark:bg-red-500';
      icon = <AlertOctagon className="w-5 h-5 text-white" />;
      break;
    case 'success':
      bgColor = 'bg-green-500 dark:bg-green-600';
      borderColor = 'border-green-400 dark:border-green-700';
      progressColor = 'bg-green-400 dark:bg-green-500';
      icon = <CheckCircle className="w-5 h-5 text-white" />;
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-500 dark:bg-blue-600';
      borderColor = 'border-blue-400 dark:border-blue-700';
      progressColor = 'bg-blue-400 dark:bg-blue-500';
      icon = <Info className="w-5 h-5 text-white" />;
      break;
  }

  return (
    <div 
      className={`max-w-sm w-full pointer-events-auto ${isEntering ? 'toast-enter' : ''} ${isExiting ? 'toast-exit' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border ${borderColor}`}>
        {/* 顶部内容区域 */}
        <div className="flex w-full">
          {/* 图标区域 */}
          <div className={`${bgColor} p-4 flex items-center justify-center flex-shrink-0 h-full`}>
            <div className="p-1 rounded-full bg-white/20">
              {icon}
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="p-4 flex-grow">
            <p className="text-gray-800 dark:text-gray-200">{message}</p>
          </div>
          
          {/* 关闭按钮 */}
          <button 
            onClick={handleClose}
            className="p-2 m-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 底部进度条 */}
        {!isPaused && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
            <div 
              className={`h-full ${progressColor} absolute left-0 top-0`}
              style={{
                width: '100%',
                animation: `shrinkWidth ${duration / 1000}s linear forwards`,
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            />
          </div>
        )}
        {isPaused && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
            <div className={`h-full ${progressColor} animate-pulse`} style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{id: string; message: string; type: ToastType}>; 
  removeToast: (id: string) => void
}> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};