import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Menu, MoonIcon, SunIcon, ListTodo, CheckSquare, Settings, ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import { AiOutlineInstagram, AiOutlineGithub, AiOutlineLink } from 'react-icons/ai';
import { analyzeTask } from './mockApi';
import { dbService } from './services/dbService';
import { Task } from './types';
import Cookies from 'js-cookie';
import { notificationService } from './services/notificationService';
import { TaskList } from './components/TaskList';
import { translations } from './locales/translations';
import { AnimatedText } from './components/AnimatedText';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [showFooter, setShowFooter] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 768);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const switchLanguage = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setIsLangMenuOpen(false);
  };

  // Load tasks from IndexedDB on component mount
  useEffect(() => {
    const loadSavedTasks = async () => {
      try {
        const userId = Cookies.get('taskAnalyzerUserId');
        if (!userId) {
          console.log('No saved user session found');
          return;
        }

        const savedTasks = await dbService.loadTasks();
        if (savedTasks && savedTasks.length > 0) {
          setTasks(savedTasks);
          console.log(`Loaded ${savedTasks.length} tasks for user ${userId}`);
        }
      } catch (err) {
        console.error('Failed to load saved tasks:', err);
        // Optional: Show error message to user
        setError('Failed to load your saved tasks. Please refresh the page.');
      }
    };

    loadSavedTasks();
  }, []);

  // Save tasks to IndexedDB whenever they change
  useEffect(() => {
    const saveTasks = async () => {
      const userId = Cookies.get('taskAnalyzerUserId');
      if (!userId || tasks.length === 0) return;

      try {
        await dbService.saveTasks(tasks);
        console.log(`Saved ${tasks.length} tasks for user ${userId}`);
      } catch (err) {
        console.error('Failed to save tasks:', err);
        setError('Failed to save your changes. Please try again.');
      }
    };

    saveTasks();
  }, [tasks]);

  // Add this effect after your existing useEffects
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        notificationService.startNotificationCheck(tasks);
      }
    };

    setupNotifications();

    return () => {
      notificationService.stopNotificationCheck();
    };
  }, [tasks]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollPosition = window.innerHeight + currentScrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const isScrollingUp = currentScrollY < lastScrollY;
      
      if (isScrollingUp) {
        // 向上滚动时隐藏 footer
        setShowFooter(false);
      } else {
        // 向下滚动且接近底部时显示 footer
        setShowFooter(documentHeight - scrollPosition < 100);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]); // 添加 lastScrollY 作为依赖

  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth > 768;
      setIsLargeScreen(isLarge);
      
      // 只在首次加载时自动展开侧边栏
      if (!isLarge) {
        setSidebarOpen(false);
      }
    };

    // 初始化时执行一次
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Only adjust sidebar visibility on screen size change
      if (mobile !== isMobile) {
        setSidebarOpen(!mobile);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]); // Add isMobile as a dependency

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Update the handleSubmit function to include deadline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await analyzeTask(newTask);
      
      const newTasks = results.map((result) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: result.description,
        creative_idea: result.creative_idea,
        estimatedTime: result.estimatedTime,
        priority: result.priority,
        completed: false,
        deadline: result.deadline ? result.deadline : undefined // 直接使用API返回的时间字符串
      }));

      setTasks(prevTasks => [...newTasks, ...prevTasks]);
      setNewTask('');
    } catch (err) {
      console.error('Error in handleSubmit:', err); // Better error logging
      setError('Failed to analyze task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewTask(textarea.value);
    
    // Reset height to auto to properly calculate scroll height
    textarea.style.height = 'auto';
    // Set new height based on scroll height
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Add this new function to handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    }
  };

  // 获取当前语言的翻译
  const t = translations[language];

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-all duration-500">
      {/* Mobile sidebar toggle button - always visible on mobile */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 
                   shadow-md dark:shadow-gray-900/30
                   hover:bg-gray-100 dark:hover:bg-gray-700
                   transition-all duration-200 lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Overlay - only shows on mobile when sidebar is open */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300
                    ${isSidebarOpen && isMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''} ${isLargeScreen ? '' : isSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                      transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <span className={`sidebar-text ml-3 font-semibold text-gray-900 dark:text-white`}>
            <AnimatedText text={t.taskList} duration={300} />
          </span>
        </div>

        <div className="sidebar-content p-3">
          {/* Sidebar Navigation */}
          <nav className="space-y-1">
            <div 
              className={`sidebar-item ${!showCompleted ? 'bg-gray-100 dark:bg-gray-700/50' : ''}`}
              onClick={() => setShowCompleted(false)}
              title={!isSidebarOpen ? t.activeTasks : undefined}
            >
              <ListTodo className="sidebar-icon" />
              <span className="sidebar-text">
                <AnimatedText 
                  text={`${t.activeTasks} (${activeTasks.length})`} 
                  duration={300}
                />
              </span>
            </div>
            <div 
              className={`sidebar-item ${showCompleted ? 'bg-gray-100 dark:bg-gray-700/50' : ''}`}
              onClick={() => setShowCompleted(true)}
              title={!isSidebarOpen ? t.completedTasks : undefined}
            >
              <CheckSquare className="sidebar-icon" />
              <span className="sidebar-text">
                <AnimatedText 
                  text={`${t.completedTasks} (${completedTasks.length})`}
                  duration={300}
                />
              </span>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto space-y-1">
            <div 
              className="sidebar-item" 
              onClick={toggleTheme}
              title={!isSidebarOpen ? t.toggleTheme : undefined}
            >
              {isDarkMode ? (
                <SunIcon className="sidebar-icon text-yellow-500" />
              ) : (
                <MoonIcon className="sidebar-icon" />
              )}
              <span className="sidebar-text">
                <AnimatedText text={t.toggleTheme} duration={300} />
              </span>
            </div>
            <div 
              className="sidebar-item"
              title={!isSidebarOpen ? t.settings : undefined}
            >
              <Settings className="sidebar-icon" />
              <span className="sidebar-text">
                <AnimatedText text={t.settings} duration={300} />
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main 
        ref={mainContentRef}
        className={`transition-all duration-300 ease-in-out ml-0 lg:ml-64`}
        style={{ 
          marginLeft: isSidebarOpen && !isMobile ? '16rem' : '0'
        }}
      >
        {/* Content container */}
        <div className={`mx-auto p-6 pb-16 transition-all duration-300
                        ${maxWidth ? 'max-w-full px-4' : 'max-w-4xl'}`}>
          {/* Header with mobile menu toggle */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Task Analyzer
              </h1>
            </div>
            
            {/* 现有的主题切换和社交链接 */}
            <div className="flex items-center gap-4">
              {/* 语言切换按钮 */}
              <div className="relative z-50"> {/* 添加 z-50 确保下拉菜单在最上层 */}
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  onBlur={() => setTimeout(() => setIsLangMenuOpen(false), 200)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 
                           hover:bg-gray-200 dark:hover:bg-gray-700 
                           transition-theme duration-theme ease-theme 
                           transform hover:scale-105 relative"
                  aria-label="Select language"
                >
                  <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {/* 语言选择下拉菜单 */}
                <div className={`
                  absolute right-0 mt-2 py-2 w-40
                  bg-white dark:bg-gray-800 
                  rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                  transform transition-all duration-200 ease-out
                  z-50 /* 添加 z-50 */
                  ${isLangMenuOpen 
                    ? 'opacity-100 translate-y-0 visible' 
                    : 'opacity-0 -translate-y-2 invisible'}
                `}>
                  <button
                    onClick={() => switchLanguage('zh')}
                    className={`
                      w-full px-4 py-2 text-left text-sm
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors duration-150
                      flex items-center justify-between
                      ${language === 'zh' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    简体中文
                    {language === 'zh' && (
                      <span className="text-blue-500 dark:text-blue-400">✓</span>
                    )}
                  </button>
                  <button
                    onClick={() => switchLanguage('en')}
                    className={`
                      w-full px-4 py-2 text-left text-sm
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors duration-150
                      flex items-center justify-between
                      ${language === 'en' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    English
                    {language === 'en' && (
                      <span className="text-blue-500 dark:text-blue-400">✓</span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* 现有的主题切换按钮 */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 
                         hover:bg-gray-200 dark:hover:bg-gray-700 
                         transition-theme duration-theme ease-theme 
                         transform hover:scale-110"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-500 transition-theme duration-theme ease-theme" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600 transition-theme duration-theme ease-theme" />
                )}
              </button>
              <button
                onClick={() => setMaxWidth(!maxWidth)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 
                         hover:bg-gray-200 dark:hover:bg-gray-700 
                         transition-theme duration-theme ease-theme"
                aria-label="Toggle max width"
              >
                {maxWidth ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
              <a
                href="https://github.com/xxll222557/project/tree/liu-test"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 
                         hover:text-gray-900 dark:hover:text-gray-200 
                         transition-theme duration-theme ease-theme 
                         rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={t.socialLinks.github}
              >
                <AiOutlineGithub className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com/kennethhhliu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 
                         hover:text-gray-900 dark:hover:text-gray-200 
                         transition-theme duration-theme ease-theme 
                         rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Follow us on Instagram"
              >
                <AiOutlineInstagram className="w-6 h-6" />
              </a>
              <a
                href="https://liuu.org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 
                         hover:text-gray-900 dark:hover:text-gray-200 
                         transition-theme duration-theme ease-theme 
                         rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="View source on GitHub"
              >
                <AiOutlineLink className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* 任务输入表单 */}
          <form onSubmit={handleSubmit} className="mb-8 animate-fade-in">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={newTask}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={t.inputPlaceholder}
                  className={`w-full px-4 py-3 rounded-lg border border-gray-300 
                            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                            transition-theme duration-theme ease-theme 
                            hover:border-blue-400 
                            min-h-[48px] max-h-[300px] 
                            resize-none overflow-hidden
                            text-gray-700 dark:text-gray-200 leading-relaxed ${isLangMenuOpen ? 'placeholder-fade-out' : 'placeholder-fade-in'}`}
                  disabled={isLoading}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '48px'
                  }}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                  {t.newLine}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !newTask.trim()}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                          hover:bg-blue-700 dark:hover:bg-blue-600 
                          disabled:opacity-50 disabled:cursor-not-allowed 
                          transition-theme duration-theme ease-theme
                          transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <AnimatedText text={t.analyzing} duration={600} />
                  </>
                ) : (
                  <AnimatedText text={t.generate} duration={600} />
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-600 text-sm animate-fade-in">{error}</p>
            )}
          </form>

          {/* 活动任务列表 */}
          <div className="transition-theme duration-theme ease-theme space-y-8">
            {!showCompleted && (
              <TaskList
                tasks={activeTasks}
                type="active"
                onToggleTask={toggleTask}
                onTaskDelete={deleteTask}
              />
            )}
            {showCompleted && (
              <TaskList
                tasks={completedTasks}
                type="completed"
                showCompleted={true}
                onToggleShowCompleted={() => setShowCompleted(false)}
                onToggleTask={toggleTask}
                onTaskDelete={deleteTask}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className={`
          fixed bottom-0 w-full
          transform transition-all duration-500 ease-in-out
          ${showFooter ? 'translate-y-0' : 'translate-y-full'}
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
          py-3 text-center text-sm text-gray-500 dark:text-gray-400
          border-t border-gray-200/50 dark:border-gray-800/50
          transition-theme duration-theme ease-theme
          left-0
        `}
        style={{ 
          marginLeft: (isSidebarOpen && !isMobile) ? '256px' : '0',
          width: (isSidebarOpen && !isMobile) ? 'calc(100% - 256px)' : '100%'
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          {t.footer.copyright.replace('{year}', new Date().getFullYear().toString())} · 
          <a
            href="https://liuu.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t.footer.about}
          </a>
          ·
          <a
            href="https://github.com/xxll222557/project/tree/liu-test"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {t.footer.github}
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;