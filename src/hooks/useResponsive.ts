import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isLarge = width > 1024;
      const mobile = width < 1024;
      
      setIsLargeScreen(isLarge);
      setIsMobile(mobile);
      
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return { isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile };
};