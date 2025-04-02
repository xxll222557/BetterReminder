import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MoonIcon, SunIcon, ChevronLeft, ChevronRight, Languages, AlertOctagon } from 'lucide-react';
import { AiOutlineInstagram, AiOutlineGithub, AiOutlineLink } from 'react-icons/ai';
import { analyzeTask } from './mockApi';
import { dbService } from './services/dbService';
import { Task } from './types';
import Cookies from 'js-cookie';
import { notificationService } from './services/notificationService';
import { TaskList } from './components/TaskList';
import { translations } from './locales/translations';
import { AnimatedText } from './components/AnimatedText';
import Sidebar from './components/Sidebar';
import { ToastProvider, useToast } from './contexts/ToastContext';

function AppContent() {
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
  const { addToast } = useToast();

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
        const errorMessage = 'Failed to load your saved tasks. Please refresh the page.';
        setError(errorMessage);
        addToast(errorMessage, 'error'); // 使用Toast显示错误
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
        const errorMessage = 'Failed to save your changes. Please try again.';
        setError(errorMessage);
        addToast(errorMessage, 'error'); // 使用Toast显示错误
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
      // 添加成功提示
      addToast('任务分析成功！', 'success');
    } catch (err) {
      console.error('Error in handleSubmit:', err); // Better error logging
      const errorMessage = t.errors.analyzeFailed || 'Failed to analyze task. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error'); // 使用Toast显示错误
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
      {/* 使用新的侧边栏组件 */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isLargeScreen={isLargeScreen}
        isMobile={isMobile}
        activeTasks={activeTasks.length}
        completedTasks={completedTasks.length}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        t={t}
      />

      {/* 主内容 */}
      <main 
        ref={mainContentRef}
        className="transition-all duration-300 ease-in-out"
      >
        {/* 其余内容保持不变 */}
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
              {/* 语言切换按钮 - 修改z-index使其低于侧边栏遮罩层 */}
              <div className={`relative ${isSidebarOpen ? 'z-10' : 'z-[100]'}`}>
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
                
                {/* 语言选择下拉菜单 - 保持与父容器相同的z-index */}
                <div class={`
                  absolute right-0 mt-2 py-2 w-40
                  bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                  rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                  transform transition-all duration-200 ease-out
                  ${isSidebarOpen ? 'z-10' : 'z-[100]'}
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
              
              {/* 主题切换按钮也应用相同的z-index控制 */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 
                           hover:bg-gray-200 dark:hover:bg-gray-700 
                           transition-theme duration-theme ease-theme 
                           transform hover:scale-110 ${isSidebarOpen ? 'z-10' : 'z-[100]'}`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-500 transition-theme duration-theme ease-theme" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600 transition-theme duration-theme ease-theme" />
                )}
              </button>
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

// 修改 App 组件，移除重复的 ToastProvider
function App() {
  return <AppContent />;
}

export default App;