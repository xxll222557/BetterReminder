import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';

interface LayoutProps {
  children: ReactNode;
  sidebarProps: {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    isLargeScreen: boolean;
    isMobile: boolean;
    activeTasks: number;
    completedTasks: number;
    showCompleted: boolean;
    setShowCompleted: (show: boolean) => void;
    showCalendar?: boolean;
    setShowCalendar: (show: boolean) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    t: any;
  };
  headerProps: {
    isDarkMode: boolean;
    toggleTheme: () => void;
    language: string;
    isLangMenuOpen: boolean;
    toggleLangMenu: () => void;
    closeLangMenu: () => void;
    switchLanguage: (lang: 'zh' | 'en') => void;
    isSidebarOpen: boolean;
    t: any;
  };
  footerProps: {
    t: any;
    language?: string;
  };
  showCelebration: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  sidebarProps,
  headerProps,
  footerProps,
}) => {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-all duration-500 flex flex-col">
      <TitleBar />
      <Sidebar {...sidebarProps} />
      <main className="transition-all duration-300 ease-in-out flex-grow">
        <div className="mx-auto p-6 pb-16 transition-all duration-300 max-w-4xl">
          <Header {...headerProps} />
          {children}
        </div>
      </main>
      <Footer {...footerProps} />
    </div>
  );
};

export default Layout;