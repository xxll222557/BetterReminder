import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ResponsiveContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLargeScreen: boolean;
  isMobile: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始状态根据窗口大小设置
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isLarge = width > 768;
      const mobile = width < 1024;
      
      setIsLargeScreen(isLarge);
      setIsMobile(mobile);
      
      // 在切换到移动模式时，自动关闭侧边栏
      // 在切换到桌面模式时，自动打开侧边栏
      if (mobile !== isMobile) {
        setSidebarOpen(!mobile);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

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