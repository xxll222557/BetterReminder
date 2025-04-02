import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: string;
  isLangMenuOpen: boolean;
  toggleLangMenu: () => void;
  closeLangMenu: () => void;
  switchLanguage: (lang: 'zh' | 'en') => void;
  isSidebarOpen: boolean;
  t: any;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  language,
  isLangMenuOpen,
  toggleLangMenu,
  closeLangMenu,
  switchLanguage,
  isSidebarOpen,
  t
}) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Task Analyzer
      </h1>
      
      <div className="flex items-center gap-4">
        <LanguageSwitcher
          language={language}
          isLangMenuOpen={isLangMenuOpen}
          toggleLangMenu={toggleLangMenu}
          closeLangMenu={closeLangMenu}
          switchLanguage={switchLanguage}
          isSidebarOpen={isSidebarOpen}
          t={t}
        />
        
        <ThemeToggle
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </div>
  );
};

export default Header;