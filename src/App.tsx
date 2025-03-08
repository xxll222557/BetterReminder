import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AiOutlineInstagram, AiOutlineGithub, AiOutlineLink } from 'react-icons/ai';
import { analyzeTask } from './mockApi';
import { dbService } from './services/dbService';
import { Task } from './types';
import Cookies from 'js-cookie';
import { notificationService } from './services/notificationService';
import { TaskList } from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

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
    <div className="relative min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 animate-fade-in">Task Analyzer</h1>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/xxll222557/project/tree/liu-test"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 rounded-full hover:bg-gray-100"
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
                          text-gray-700 leading-relaxed"
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
    </div>
  );
}

export default App;