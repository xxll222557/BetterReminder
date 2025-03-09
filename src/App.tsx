import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AiOutlineInstagram, AiOutlineGithub, AiOutlineLink } from 'react-icons/ai';
import { analyzeTask } from './mockApi';
import { dbService } from './services/dbService';
import { Task } from './types';
import Cookies from 'js-cookie';
import { notificationService } from './services/notificationService';
import { TaskList } from './components/TaskList';
import { MoonIcon, SunIcon } from 'lucide-react';

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

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-all duration-500">
      <div className="max-w-4xl mx-auto p-6 pb-16 transition-theme duration-theme ease-theme">
        <div className="flex justify-between items-center mb-8 transition-theme duration-theme ease-theme">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-theme duration-theme ease-theme">
            Task Analyzer
          </h1>
          <div className="flex items-center gap-4">
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
            <a
              href="https://github.com/xxll222557/project/tree/liu-test"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 dark:text-gray-400 
                       hover:text-gray-900 dark:hover:text-gray-200 
                       transition-theme duration-theme ease-theme 
                       rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Visit our website"
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
        
        <form onSubmit={handleSubmit} className="mb-8 animate-fade-in">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={newTask}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Enter your tasks... (Press Shift + Enter for new line)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 
                          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-500 
                          transition-theme duration-theme ease-theme 
                          hover:border-blue-400 
                          min-h-[48px] max-h-[300px] 
                          resize-none overflow-hidden
                          text-gray-700 dark:text-gray-200 leading-relaxed"
                disabled={isLoading}
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '48px'
                }}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                Press Shift + Enter for new line
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
                  Analyzing...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm animate-fade-in">{error}</p>
          )}
        </form>

        <div className="space-y-6 transition-theme duration-theme ease-theme">
          <TaskList
            tasks={activeTasks}
            type="active"
            onToggleTask={toggleTask}
          />
          <TaskList
            tasks={completedTasks}
            type="completed"
            showCompleted={showCompleted}
            onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
            onToggleTask={toggleTask}
          />
        </div>
      </div>
      
      {/* 更新的 Footer */}
      <footer 
        className={`
          fixed bottom-0 left-0 w-full
          transform transition-all duration-500 ease-in-out
          ${showFooter ? 'translate-y-0' : 'translate-y-full'}
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
          py-3 text-center text-sm text-gray-500 dark:text-gray-400
          border-t border-gray-200/50 dark:border-gray-800/50
          transition-theme duration-theme ease-theme
        `}
      >
        <div className="max-w-4xl mx-auto px-6">
          © {new Date().getFullYear()} Task Analyzer · 
          <a
            href="https://liuu.org"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            About
          </a>
          ·
          <a
            href="https://github.com/xxll222557/project/tree/liu-test"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;