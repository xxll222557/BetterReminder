import { invoke } from '@tauri-apps/api/core';
import { Task } from './types';

export class DbServiceTauri {
  private userId: string | null = null;
  private userIdPromise: Promise<string>;

  constructor() {
    this.userIdPromise = this.initUserId();
  }

  private async initUserId(): Promise<string> {
    try {
      const id = await invoke<string>('get_current_user_id');
      this.userId = id;
      return id;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      throw error;
    }
  }

  async getUserId(): Promise<string> {
    if (this.userId) {
      return this.userId;
    }
    return this.userIdPromise;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      // 确保userId已初始化
      await this.userIdPromise;
      
      // 调用Rust后端保存任务
      await invoke('save_tasks', { tasks });
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  async loadTasks(): Promise<Task[]> {
    try {
      // 确保userId已初始化
      await this.userIdPromise;
      
      // 调用Rust后端加载任务
      const tasks = await invoke<Task[]>('load_tasks');
      return tasks;
    } catch (error) {
      console.error('Failed to load tasks:', error);
      throw error;
    }
  }

  // 新增：删除单个任务
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.userIdPromise;
      await invoke('delete_task', { taskId });
    } catch (error) {
      // 判断是否为"未找到任务"错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('未找到任务')) {
        console.warn(`Task not found in database: ${taskId}`, error);
      } else {
        console.error(`Failed to delete task ${taskId}:`, error);
      }
      throw error; // 仍然抛出错误，让调用者决定如何处理
    }
  }

  // 新增：批量删除任务
  async deleteTasks(taskIds: string[]): Promise<void> {
    try {
      await this.userIdPromise;
      await invoke('delete_tasks', { taskIds });
    } catch (error) {
      console.error(`Failed to delete tasks:`, error);
      throw error;
    }
  }
}

// 创建单例实例
export const dbServiceTauri = new DbServiceTauri();