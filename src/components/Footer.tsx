import React, { useState, useEffect } from 'react';
import { Heart, Clock, Calendar } from 'lucide-react';

interface FooterProps {
  t: any;
  language?: string; // 添加语言属性
}

const Footer: React.FC<FooterProps> = ({ t, language = 'zh' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // 清除定时器
    return () => clearInterval(timer);
  }, []);
  
  // 根据当前选择的语言确定区域设置
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  
  // 格式化时间，使用当前选择的语言
  const formattedTime = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: language === 'en'
  });
  
  // 格式化日期，使用当前选择的语言
  const formattedDate = currentTime.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <footer 
      className="w-full py-4 mt-auto bg-white dark:bg-gray-900 
      text-center text-sm 
      text-gray-500 dark:text-gray-400 
      border-t border-gray-200 dark:border-gray-800 
      transition-colors duration-500 shadow-sm"
    >
      <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between">
        <div className="mb-2 sm:mb-0">
          <span className="flex items-center justify-center sm:justify-start gap-1.5">
            {t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}
            <Heart className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          </span>
        </div>
        
        {/* 日期和时钟显示区域 */}
        <div className="mb-2 sm:mb-0 order-first sm:order-none flex flex-col sm:flex-row items-center gap-2">
          {/* 日期显示 */}
          <span className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors duration-500">
            <Calendar className="w-3.5 h-3.5 text-green-400" />
            <span>{formattedDate}</span>
          </span>
          
          {/* 时间显示 */}
          <span className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors duration-500">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{formattedTime}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <a href="https://liuu.org" target="_blank" rel="noopener noreferrer"
             className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:underline">
            {t.footer.about}
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a href="https://github.com/xxll222557/BetterReminder" target="_blank" rel="noopener noreferrer"
             className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:underline">
            {t.footer.github}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;