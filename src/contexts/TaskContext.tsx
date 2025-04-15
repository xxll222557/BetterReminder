import React, { createContext, useState, useEffect, useContext } from 'react';
import { Task } from '../services/storage/types';
import { dbServiceTauri as dbService } from '../services/storage/dbServiceTauri';
import { analyzeTask } from '../services/api/mockApi';
import { useToast } from './ToastContext';
import Cookies from 'js-cookie';
import { useLanguage } from './LanguageContext';

interface TaskContextType {
  tasks: Task[];
  newTask: string;
  setNewTask: (task: string) => void;
  isLoading: boolean;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  activeTasks: Task[];
  completedTasks: Task[];
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => Promise<void>;
  showCelebration: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  // 筛选任务 - 确保这些变量在使用前定义
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // 监测所有活动任务是否清空 - 现在可以安全使用 activeTasks
  useEffect(() => {
    // 检查是否有活动任务，且数量从有到无
    if (activeTasks.length === 0 && completedTasks.length > 0) {
      setShowCelebration(true);
      
      // 3秒后关闭庆祝效果
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [activeTasks.length, completedTasks.length]);

  // 加载任务
  useEffect(() => {
    const loadSavedTasks = async () => {
      try {
        const userId = Cookies.get('taskAnalyzerUserId');
        if (!userId) return;

        const savedTasks = await dbService.loadTasks();
        if (savedTasks?.length > 0) {
          setTasks(savedTasks);
        }
      } catch (err) {
        addToast(t.errors.loadFailed, 'error');
      }
    };

    loadSavedTasks();
  }, [t.errors.loadFailed, addToast]);

  // 保存任务
  useEffect(() => {
    if (!tasks.length) return;
    
    const saveTasks = async () => {
      try {
        await dbService.saveTasks(tasks);
      } catch (err) {
        addToast(t.errors.saveFailed, 'error');
      }
    };

    saveTasks();
  }, [tasks, t.errors.saveFailed, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsLoading(true);

    try {
      const results = await analyzeTask(newTask);
      
      const newTasks = results.map((result) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: result.description,
        creative_idea: result.creative_idea,
        estimatedTime: result.estimatedTime,
        priority: result.priority,
        completed: false,
        deadline: result.deadline
      }));

      setTasks(prevTasks => [...newTasks, ...prevTasks]);
      setNewTask('');
      // 使用确定存在的成功消息
      addToast(t.success.taskAnalyzed, 'success');
    } catch (err) {
      console.error('Task analysis failed:', err);
      addToast(t.errors.analyzeFailed, 'error');
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

  // 删除任务
  const deleteTask = async (id: string) => {
    try {
      // 先在前端状态中移除
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // 然后在数据库中删除
      await dbService.deleteTask(id);
    } catch (err) {
      // 检查错误类型
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // 如果是"未找到任务"错误，这是正常情况，因为任务可能已经被删除
      if (errorMessage.includes('未找到任务')) {
        console.log(`任务 ${id} 在数据库中已不存在，跳过错误提示`);
        return; // 不显示错误提示，因为从用户角度看任务已经被删除了
      }
      
      // 其他类型的错误才显示错误提示
      console.error('Delete task failed:', err);
      addToast(t.errors.deleteFailed, 'error');
      
      // 重新加载任务以恢复正确状态
      try {
        const savedTasks = await dbService.loadTasks();
        if (savedTasks?.length > 0) {
          setTasks(savedTasks);
        }
      } catch (loadErr) {
        // 如果重新加载也失败了，那么记录错误但不再显示另一个错误提示
        console.error('Failed to reload tasks after delete error:', loadErr);
      }
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      newTask,
      setNewTask,
      isLoading,
      showCompleted,
      setShowCompleted,
      activeTasks,
      completedTasks,
      handleSubmit,
      toggleTask,
      deleteTask,
      showCelebration
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};