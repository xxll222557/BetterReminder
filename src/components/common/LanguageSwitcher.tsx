import React from 'react';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  language: string;
  isLangMenuOpen: boolean;
  toggleLangMenu: () => void;
  closeLangMenu: () => void;
  switchLanguage: (lang: 'zh' | 'en') => void;
  isSidebarOpen: boolean;
  t: any;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  isLangMenuOpen,
  toggleLangMenu,
  closeLangMenu,
  switchLanguage,
  isSidebarOpen,
}) => {
  return (
    <div className={`relative ${isSidebarOpen ? 'z-10' : 'z-[100]'}`}>
      <button
        onClick={toggleLangMenu}
        onBlur={() => setTimeout(closeLangMenu, 200)}
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                  transition-theme duration-theme ease-theme transform hover:scale-105"
        aria-label="Select language"
      >
        <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      {isLangMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20
                      border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => switchLanguage('zh')}
              className={`w-full px-4 py-2 text-left ${
                language === 'zh' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              中文 (Chinese)
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`w-full px-4 py-2 text-left ${
                language === 'en' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              English
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;