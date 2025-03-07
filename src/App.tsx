import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await analyzeTask(newTask);
      
      // Handle multiple tasks from API response
      results.forEach((result) => {
        const task: Task = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: result.summary, // Use the summary as description
          summary: result.summary,
          estimatedTime: result.estimatedTime,
          priority: result.priority,
          completed: false,
        };
        setTasks(prev => [task, ...prev]);
      });

      setNewTask('');
    } catch (err) {
      setError('Failed to analyze task. Please try again.');
      console.error(err);
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

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className={`task-enter bg-white rounded-lg shadow p-6 transform transition-all duration-300 ease-in-out hover:shadow-lg ${
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
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.description}
            </h3>
          </div>
          <p className="text-gray-600 ml-9 transition-opacity duration-300">{task.summary}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1 transition-all duration-200 hover:transform hover:scale-105">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{task.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1 transition-all duration-200 hover:transform hover:scale-105">
            <AlertCircle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
            <span className={getPriorityColor(task.priority)}>{task.priority}</span>
          </div>
        </div>
      </div>
    </div>
  );
  
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
                placeholder="Enter your tasks..."
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
                Press Enter for new line
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
            <h2 className="text-xl font-semibold text-gray-800">Active Tasks</h2>
            {activeTasks.length > 0 ? (
              activeTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-8 text-gray-500 animate-fade-in bg-white rounded-lg shadow">
                No active tasks. Start by adding a task above!
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors duration-200"
              >
                <h2>Completed Tasks ({completedTasks.length})</h2>
                {showCompleted ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              <div className={`space-y-4 transition-all duration-300 ease-in-out ${
                showCompleted ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'
              }`}>
                {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* All tasks completed message */}
    
    </div>
  );
}

export default App;