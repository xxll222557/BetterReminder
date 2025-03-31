import { Task } from '../types';

type NotificationTimes = 0.5 | 1 | 2;

class NotificationService {
  private static instance: NotificationService;
  private checkInterval: NodeJS.Timer | null = null;
  private notifiedTasks: Set<string> = new Set();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('❌ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notifications already permitted');
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  private createNotificationKey(taskId: string, minutes: NotificationTimes): string {
    return `task-${taskId}-${minutes}`;
  }

  private shouldNotify(taskId: string, minutes: NotificationTimes): boolean {
    const key = this.createNotificationKey(taskId, minutes);
    if (this.notifiedTasks.has(key)) {
      return false;
    }
    this.notifiedTasks.add(key);
    return true;
  }

  private cleanupOldNotifications(tasks: Task[]): void {
    const activeTaskIds = new Set(tasks.map(task => task.id));
    Array.from(this.notifiedTasks).forEach(key => {
      const [_, taskId] = key.split('-');
      if (!activeTaskIds.has(taskId)) {
        this.notifiedTasks.delete(key);
      }
    });
  }

  private async sendNotification(title: string, options: NotificationOptions): Promise<boolean> {
    try {
      // Try to create a notification with sound
      const notification = new Notification(title, {
        ...options,
        silent: false, // Enable sound
        renotify: true, // Allow duplicate notifications
        requireInteraction: true, // Keep notification visible
        vibrate: [200, 100, 200] // Vibration pattern
      });

      notification.onclick = () => {
        console.log('🖱️ Notification clicked');
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return false;
    }
  }

  private checkDeadline(task: Task): void {
    if (task.completed || !task.deadline) return;

    const now = new Date();
    const deadline = new Date(task.deadline);
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeUntilDeadline / (1000 * 60));

    // Log for debugging
    console.log(`📝 Checking deadline for "${task.description}":`, {
      deadline: deadline.toLocaleString(),
      minutesUntil: minutesUntil.toFixed(1),
      status: task.completed ? 'completed' : 'active'
    });

    // Notification thresholds in minutes
    const thresholds: { time: number, label: string }[] = [
      { time: 120, label: '2 hours' },
      { time: 60, label: '1 hour' },
      { time: 30, label: '30 minutes' },
      { time: 15, label: '15 minutes' },
      { time: 5, label: '5 minutes' }
    ];

    thresholds.forEach(({ time, label }) => {
      if (minutesUntil > 0 && minutesUntil <= time) {
        const notificationKey = `${task.id}-${time}`;
        
        if (!this.notifiedTasks.has(notificationKey)) {
          this.sendNotification(
            `Task Due Soon: ${task.description}`,
            {
              body: `Due in ${label} (${deadline.toLocaleTimeString()})`,
              icon: '/favicon.ico',
              tag: notificationKey,
              requireInteraction: true,
              silent: false,
              vibrate: [200, 100, 200]
            }
          );
          this.notifiedTasks.add(notificationKey);
        }
      }
    });
  }

  startNotificationCheck(tasks: Task[]): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const checkTasks = () => {
      tasks.forEach(task => this.checkDeadline(task));
    };

    this.checkInterval = setInterval(checkTasks, 30000); // Check every 30 seconds
    checkTasks(); // Initial check
  }

  stopNotificationCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  scheduleNotification(taskId: string, deadline: string, timeframe: string) {
    const notificationKey = `${taskId}-${timeframe}`;
    
    // Check if notification was already sent
    if (this.notifiedTasks.has(notificationKey)) {
      return;
    }
  
    const deadlineTime = new Date(deadline);
    const now = new Date();
    
    // Format deadline time
    const formattedTime = deadlineTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  
    this.sendNotification(
      `Task deadline in ${timeframe}`,
      {
        body: `You have a task due at ${formattedTime}`,
        icon: '/favicon.ico',
        tag: notificationKey,
        requireInteraction: true
      }
    );
  
    this.notifiedTasks.add(notificationKey);
  }
}

export const notificationService = NotificationService.getInstance();