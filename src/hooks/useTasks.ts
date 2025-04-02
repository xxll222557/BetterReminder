import { useState, useEffect } from 'react';
import { Task } from '../types';
import { dbService } from '../services/dbService';
import { notificationService } from '../services/notificationService';
import { analyzeTask } from '../mockApi';
import { useToast } from '../contexts/ToastContext';
import Cookies from 'js-cookie';

export const useTasks = (t: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { addToast } = useToast();

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

  // 通知设置
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        notificationService.startNotificationCheck(tasks);
      }
    };

    setupNotifications();
    return () => notificationService.stopNotificationCheck();
  }, [tasks]);

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

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // 筛选任务
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return {
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
    deleteTask
  };
};