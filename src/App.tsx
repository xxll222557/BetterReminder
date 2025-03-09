import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import { AiOutlineInstagram, AiOutlineGithub, AiOutlineLink } from 'react-icons/ai';
import { analyzeTask } from './mockApi';
import { dbService } from './services/dbService';
import { Task } from './types';
import Cookies from 'js-cookie';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从 localStorage 中获取之前的主题设置
    return localStorage.getItem('darkMode') === 'true';
  });

  // Add this helper function at the top of the App component
  const formatDeadline = (deadline: string | undefined): string => {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const getDeadlineColor = (deadline: string | undefined): string => {
    if (!deadline) return 'text-gray-500';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 3600);
    
    if (hoursUntil < 0) return 'text-red-600';
    if (hoursUntil <= 24) return 'text-orange-500';
    if (hoursUntil <= 72) return 'text-yellow-500';
    return 'text-green-500';
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

  useEffect(() => {
    // 更新 HTML 的 class
    document.documentElement.classList.toggle('dark', isDarkMode);
    // 保存设置到 localStorage
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Update the handleSubmit function to include deadline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting task:', newTask); // Debug log
      const results = await analyzeTask(newTask);
      console.log('API Results:', results); // Debug log
      
      // Handle multiple tasks from API response
      const newTasks = results.map((result) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: result.summary,
        summary: result.summary,
        estimatedTime: result.estimatedTime,
        priority: result.priority,
        completed: false,
        deadline: result.deadline // Keep the full ISO timestamp
      }));

      console.log('New tasks to add:', newTasks); // Debug log
      setTasks(prevTasks => {
        const updatedTasks = [...newTasks, ...prevTasks];
        console.log('Updated tasks state:', updatedTasks); // Debug log
        return updatedTasks;
      });

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
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

  // Update the TaskCard component to include deadline
  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className={`task-enter bg-white dark:bg-gray-800 rounded-lg shadow p-6 transform transition-all duration-300 ease-in-out hover:shadow-lg ${
        task.completed ? 'task-complete opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => toggleTask(task.id)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              {task.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 transform transition-transform duration-200 hover:scale-110" />
              ) : (
                <Circle className="w-6 h-6 transform transition-transform duration-200 hover:scale-110" />
              )}
            </button>
            <h3 className={`text-lg font-semibold transition-all duration-300 ${
              task.completed 
                ? 'line-through text-gray-500 dark:text-gray-500' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {task.description}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-9 transition-opacity duration-300">
            {task.summary}
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1 transition-all duration-200 hover:transform hover:scale-105">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{task.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1 transition-all duration-200 hover:transform hover:scale-105">
            <AlertCircle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
            <span className={getPriorityColor(task.priority)}>{task.priority}</span>
          </div>
          {task.deadline && (
            <div className={`flex items-center gap-1 transition-all duration-200 hover:transform hover:scale-105 ${getDeadlineColor(task.deadline)}`}>
              <Clock className="w-4 h-4" />
              <span>{formatDeadline(task.deadline)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* 现有的主要内容部分 */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 animate-fade-in">
              Task Analyzer
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-6 h-6" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </button>
              <a
                href="https://github.com/xxll222557/project/tree/liu-test"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Visit our website"
              >
                <AiOutlineGithub className="w-6 h-6" />
              </a>
              <a
                href="https://instagram.com/kennethhhliu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 rounded-full hover:bg-gray-100"
                aria-label="Follow us on Instagram"
              >
                <AiOutlineInstagram className="w-6 h-6" />
              </a>
              <a
                href="https://liuu.org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 rounded-full hover:bg-gray-100"
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
                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                            transition-all duration-200 ease-in-out 
                            hover:border-blue-400 
                            min-h-[48px] max-h-[300px] 
                            resize-none overflow-hidden
                            text-gray-700 dark:text-gray-100
                            bg-white dark:bg-gray-800
                            dark:border-gray-600
                            dark:placeholder-gray-400
                            leading-relaxed"
                  disabled={isLoading}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '48px'
                  }}
                />
                <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                  Press Shift + Enter for new line
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !newTask.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
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

          <div className="space-y-6">
            {/* Active Tasks */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Active Tasks ({activeTasks.length})
              </h2>
              {activeTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 animate-fade-in bg-white dark:bg-gray-800 rounded-lg shadow">
                  No active tasks. Start by adding a task above!
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <h2>Completed Tasks ({completedTasks.length})</h2>
                  {showCompleted ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                
                {showCompleted && (
                  <div className="space-y-4">
                    {completedTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 简约底栏 */}
      <footer className="w-full py-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
          <span>© {new Date().getFullYear()} Better Reminders</span>
          <span className="hidden md:inline">•</span>
          <div className="flex items-center gap-3 text-gray-400">
            <a
              href="https://github.com/xxll222557/project/tree/liu-test"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Source
            </a>
            <span>•</span>
            <a
              href="https://liuu.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              About
            </a>
            <span>•</span>
            <a
              href="/privacy"
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;