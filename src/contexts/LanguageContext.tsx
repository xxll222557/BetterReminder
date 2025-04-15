import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { translations } from '../services/storage/translations';

export type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  t: typeof translations.zh | typeof translations.en;
  isLangMenuOpen: boolean;
  switchLanguage: (lang: Language) => void;
  toggleLangMenu: () => void;
  closeLangMenu: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 检查浏览器语言和本地存储设置
  const getInitialLanguage = (): Language => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      return savedLanguage;
    }
    
    // 检查浏览器语言
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'zh' ? 'zh' : 'en';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  // 切换语言
  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setIsLangMenuOpen(false);
  };

  // 切换菜单状态
  const toggleLangMenu = () => {
    setIsLangMenuOpen(prev => !prev);
  };

  // 关闭菜单
  const closeLangMenu = () => {
    setIsLangMenuOpen(false);
  };

  // 基于当前语言获取翻译
  const t = language === 'zh' ? translations.zh : translations.en;

  // 点击外部关闭语言菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const langMenu = document.getElementById('lang-menu');
      const langButton = document.getElementById('lang-button');
      
      if (
        isLangMenuOpen && 
        langMenu && 
        langButton && 
        !langMenu.contains(event.target as Node) && 
        !langButton.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        t, 
        isLangMenuOpen, 
        switchLanguage, 
        toggleLangMenu, 
        closeLangMenu 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};