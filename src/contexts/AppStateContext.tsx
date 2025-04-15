import React, { createContext, useState, useContext } from 'react';

interface AppStateContextType {
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  handleCreateNewTask: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  // 创建新任务处理函数 - 用于日历视图中的快速添加
  const handleCreateNewTask = () => {
    setShowCalendar(false);
    
    // 可选：聚焦到任务输入框
    setTimeout(() => {
      const taskInput = document.getElementById('task-input');
      if (taskInput) taskInput.focus();
    }, 100);
  };

  return (
    <AppStateContext.Provider value={{
      showCalendar,
      setShowCalendar,
      handleCreateNewTask
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};