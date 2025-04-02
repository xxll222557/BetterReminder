import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastContainer, ToastType } from '../components/Toast';

interface ToastContextProps {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

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

  const addToast = useCallback((message: string, type: ToastType) => {
    console.log("Adding toast:", message, type); // 调试用
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type, createdAt: Date.now() }]);
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