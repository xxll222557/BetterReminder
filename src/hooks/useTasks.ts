import { useState, useEffect } from 'react';
import { Task } from '../types';
import { dbServiceTauri as dbService } from '../services/dbServiceTauri';
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

  // 修改 deleteTask 方法
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
      addToast(t.errors.deleteFailed || '删除任务失败', 'error');
      
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