import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastContainer, ToastType } from '../components/feedback/Toast';

interface ToastContextType {
  addToast: (message: string | undefined, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: ToastType;
    createdAt: number;
  }>>([]);

  const addToast = useCallback((message: string | undefined, type: ToastType) => {
    // 如果消息未定义，提供默认消息
    const displayMessage = message || 
      (type === 'error' ? '发生错误' : 
       type === 'success' ? '操作成功' : '提示信息');
    
    console.log("Adding toast:", displayMessage, type);
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message: displayMessage, type, createdAt: Date.now() }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 调试用 - 跟踪toasts状态变化
  useEffect(() => {
    console.log("Current toasts:", toasts);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer 
        toasts={toasts.map(({ id, message, type }) => ({ id, message, type }))} 
        removeToast={removeToast} 
      />
    </ToastContext.Provider>
  );
};