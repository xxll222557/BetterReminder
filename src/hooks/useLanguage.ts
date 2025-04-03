import { useState } from 'react';
import { translations } from '../locales/translations';

export type Language = 'zh' | 'en';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'zh'
  );
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setIsLangMenuOpen(false);
  };

  const toggleLangMenu = () => setIsLangMenuOpen(!isLangMenuOpen);
  const closeLangMenu = () => setIsLangMenuOpen(false);
  
  const t = translations[language];

  return { 
    language, 
    t, 
    isLangMenuOpen, 
    switchLanguage, 
    toggleLangMenu, 
    closeLangMenu 
  };
};