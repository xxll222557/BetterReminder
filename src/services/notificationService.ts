import { Task } from '../types';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  createChannel,
  Importance,
  Visibility
} from '@tauri-apps/plugin-notification';

class TauriNotificationService {
  private static instance: TauriNotificationService;
  private checkInterval: NodeJS.Timer | null = null;
  private notifiedTasks: Set<string> = new Set();
  private hasInitialized = false;

  private constructor() {}

  static getInstance(): TauriNotificationService {
    if (!this.instance) {
      this.instance = new TauriNotificationService();
    }
    return this.instance;
  }

  // 初始化函数 - 创建通知通道
  async initialize(): Promise<void> {
    if (this.hasInitialized) return;
    
    // 直接标记为已初始化，不尝试创建通道
    this.hasInitialized = true;
    console.log('✅ 通知系统初始化 (使用基本通知，无通道)');
    
    // 不再调用 createChannel
  }

  // 检查通知权限
  async checkPermissions(): Promise<boolean> {
    try {
      // 检查是否已有权限
      let permissionGranted = await isPermissionGranted();
      
      // 如果没有权限，请求权限
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      return permissionGranted;
    } catch (error) {
      console.error('❌ 检查通知权限失败:', error);
      return false;
    }
  }

  // 修改 safeSendNotification 方法以处理通道不可用的情况
  private async safeSendNotification(options: {
    title: string;
    body: string;
  }): Promise<boolean> {
    try {
      // 检查权限但不初始化通道
      let permissionGranted = await isPermissionGranted();
      
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      if (!permissionGranted) {
        console.warn('⚠️ 无通知权限');
        return false;
      }

      // 使用最少的参数发送通知
      await sendNotification({
        title: options.title,
        body: options.body,
      });
      
      return true;
    } catch (error) {
      console.error('❌ 发送通知失败:', error);
      return false;
    }
  }

  // 发送任务截止日期通知
  async scheduleDeadlineNotification(
    taskId: string,
    taskTitle: string, 
    deadline: string, 
    timeframe: string
  ): Promise<boolean> {
    const notificationKey = `${taskId}-${timeframe}`;
    
    // 避免重复通知
    if (this.notifiedTasks.has(notificationKey)) {
      return false;
    }

    // 格式化时间
    const deadlineTime = new Date(deadline);
    const formattedTime = deadlineTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    console.log(`⏰ 发送截止提醒:`, {
      任务: taskTitle,
      截止时间: deadlineTime.toLocaleString(),
      提前: timeframe,
      通知ID: notificationKey
    });

    const success = await this.safeSendNotification({
      title: `${timeframe}后截止: ${taskTitle}`,
      body: `任务将在 ${formattedTime} 截止`,
      channelId: 'deadlines',
    });

    if (success) {
      this.notifiedTasks.add(notificationKey);
    }
    
    return success;
  }

  // 发送测试通知
  async sendTestNotification(): Promise<boolean> {
    return this.safeSendNotification({
      title: '通知系统测试',
      body: '如果您看到此消息，说明通知系统运行正常',
      channelId: 'task-updates',
    });
  }

  // 发送自定义通知
  async sendCustomNotification(
    title: string, 
    body: string, 
    options: { urgent?: boolean } = {}
  ): Promise<boolean> {
    return this.safeSendNotification({
      title,
      body,
      channelId: options.urgent ? 'deadlines' : 'task-updates',
    });
  }

  // 开始定期检查任务截止日期
  startDeadlineCheck(tasks: Task[]): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const checkTasks = () => {
      try {
        tasks.forEach(task => {
          if (!task.completed && task.deadline) {
            this.checkTaskDeadline(task);
          }
        });
      } catch (error) {
        console.error('❌ 检查任务出错:', error);
      }
    };

    this.checkInterval = setInterval(checkTasks, 30000); // 每30秒检查一次
    checkTasks(); // 立即检查一次
  }

  // 停止检查
  stopDeadlineCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // 检查单个任务
  private checkTaskDeadline(task: Task): void {
    if (!task.deadline) return;

    const now = new Date();
    const deadline = new Date(task.deadline);
    const minutesUntil = (deadline.getTime() - now.getTime()) / (1000 * 60);

    // 截止时间阈值（分钟）
    const thresholds = [
      { minutes: 5, label: '5分钟' },
      { minutes: 15, label: '15分钟' },
      { minutes: 30, label: '30分钟' },
      { minutes: 60, label: '1小时' },
      { minutes: 120, label: '2小时' }
    ];

    thresholds.forEach(({ minutes, label }) => {
      // 如果时间差在阈值的1分钟内，发送通知
      if (minutesUntil > minutes - 1 && minutesUntil <= minutes + 1) {
        this.scheduleDeadlineNotification(
          task.id,
          task.description,
          task.deadline,
          label
        );
      }
    });
  }
}

// 导出单例实例
export const tauriNotificationService = TauriNotificationService.getInstance();