import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  toggleTheme,
  isSidebarOpen
}) => {
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
        transition-theme duration-theme ease-theme transform hover:scale-110 ${isSidebarOpen ? 'z-10' : 'z-[100]'}`}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <SunIcon className="w-5 h-5 text-yellow-500 transition-theme duration-theme ease-theme" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-600 transition-theme duration-theme ease-theme" />
      )}
    </button>
  );
};

export default ThemeToggle;