import React, { useState } from 'react';
import { Loader2, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeTask } from './mockApi';
import { Task } from './types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeTask(newTask);
      const task: Task = {
        id: Date.now().toString(),
        description: newTask,
        ...result,
        completed: false,
      };
      setTasks(prev => [task, ...prev]);
      setNewTask('');
    } catch (err) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Task Analyzer</h1>
        
        <form onSubmit={handleSubmit} className="mb-8 animate-fade-in">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter your task description..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out hover:border-blue-400"
              disabled={isLoading}
            />
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
    </div>
  );
}

export default App;