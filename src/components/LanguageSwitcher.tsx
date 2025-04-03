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
  t
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
      
      <div className={`absolute right-0 mt-2 py-2 w-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
        rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-200 ease-out
        ${isSidebarOpen ? 'z-10' : 'z-[100]'} ${isLangMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'}`}>
        {['zh', 'en'].map(lang => (
          <button
            key={lang}
            onClick={() => switchLanguage(lang as 'zh' | 'en')}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-150 flex items-center justify-between
              ${language === lang ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {lang === 'zh' ? '简体中文' : 'English'}
            {language === lang && <span className="text-blue-500 dark:text-blue-400">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;