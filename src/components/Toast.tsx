import React, { useEffect, useState, useRef } from 'react';
import { X, AlertOctagon, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number; // 显示时间，单位毫秒
  id: string;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 5000, // 默认5秒后关闭
  id
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
    if (isPaused) return;
    
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, isPaused]);

  // 处理关闭逻辑，添加退出动画
  const handleClose = () => {
    setIsExiting(true);
    // 等待退出动画完成后调用onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 鼠标悬浮时暂停计时器
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // 鼠标离开时恢复计时器
  const handleMouseLeave = () => {
    setIsPaused(false);
    timerRef.current = setTimeout(() => {
      handleClose();
    }, duration);
  };

  // 根据类型选择不同的样式和图标
  const getTypeStyles = () => {
    switch(type) {
      case 'error':
        return {
          icon: <AlertOctagon className="w-5 h-5 text-white" />,
          bgColor: 'bg-red-500',
          borderColor: 'border-red-600',
          progressColor: 'bg-red-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-white" />,
          bgColor: 'bg-green-500',
          borderColor: 'border-green-600',
          progressColor: 'bg-green-600'
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-600',
          progressColor: 'bg-blue-600'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-600',
          progressColor: 'bg-blue-600'
        };
    }
  };

  const { icon, bgColor, borderColor, progressColor } = getTypeStyles();

  return (
    <div 
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex flex-col min-w-[320px] max-w-md shadow-lg
                 border-l-4 ${borderColor} bg-white dark:bg-gray-800
                 rounded-r-lg overflow-hidden
                 transition-all duration-300 ease-in-out
                 ${isEntering 
                   ? 'translate-x-full opacity-0' 
                   : isExiting 
                     ? 'translate-x-full opacity-0' 
                     : 'translate-x-0 opacity-100'}`}
    >
      <div className="flex items-start">
        {/* 左侧彩色图标区域 - 改进样式 */}
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
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{id: string; message: string; type: ToastType}>; 
  removeToast: (id: string) => void
}> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};