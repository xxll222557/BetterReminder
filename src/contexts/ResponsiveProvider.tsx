import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ResponsiveContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLargeScreen: boolean;
  isMobile: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始状态：侧栏关闭，屏幕尺寸基于当前窗口
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // 保持断点一致性，例如都用 1024
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // 使用一致的断点
      const isLarge = width > 1024;
      const mobile = width < 1024;

      setIsLargeScreen(isLarge);
      setIsMobile(mobile);

      // --- 移除了自动打开/关闭侧栏的逻辑 ---
      // if (mobile !== isMobile) {
      //   setSidebarOpen(!mobile);
      // }
      // --- 结束移除 ---
    };

    // 立即执行一次以确保初始状态正确
    handleResize();

    // 添加 resize 监听器
    window.addEventListener('resize', handleResize);

    // 组件卸载时移除监听器
    return () => window.removeEventListener('resize', handleResize);
  }, []); // <--- 将依赖数组改为空数组

  return (
    <ResponsiveContext.Provider value={{ isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};