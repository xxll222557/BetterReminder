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

  startNotificationCheck(tasks: Task[]): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const checkAndNotify = async () => {
      if (Notification.permission !== 'granted') {
        console.log('⚠️ Notification permission not granted');
        await this.requestPermission(); // Try to request permission again
        return;
      }

      const now = new Date(); // Add this line to define 'now'
      console.log('🔍 Checking tasks for notifications...', now.toLocaleTimeString());

      tasks.forEach(task => {
        if (task.completed || !task.deadline) return;

        const deadline = new Date(task.deadline);
        const timeUntilDeadline = deadline.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntilDeadline / (1000 * 60));

        console.log(`📝 Task "${task.summary}":`, {
          deadline: deadline.toLocaleString(),
          minutesUntil: minutesUntil.toFixed(1),
          isCompleted: task.completed
        });

        const notificationTimes: NotificationTimes[] = [0.5, 1, 2];

        notificationTimes.forEach(async (time) => {
          if (
            minutesUntil > 0 && 
            minutesUntil <= time && 
            minutesUntil > time - 0.2 // Smaller window (12 seconds) for more precise timing
          ) {
            const shouldNotify = this.shouldNotify(task.id, time);
            console.log(`⏰ Time check for ${time} minutes:`, {
              shouldNotify,
              minutesUntil: minutesUntil.toFixed(2)
            });

            if (shouldNotify) {
              console.log(`🔔 Attempting to send notification for "${task.summary}" (${time} minutes)`);
              const success = await this.sendNotification(
                `Task Due in ${time} minutes`,
                {
                  body: `"${task.summary}" is due at ${new Date(task.deadline).toLocaleString()}`,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: this.createNotificationKey(task.id, time)
                }
              );

              if (success) {
                console.log('✅ Notification sent successfully');
              }
            }
          }
        });
      });
    };

    // Check more frequently for testing
    this.checkInterval = setInterval(() => {
      checkAndNotify().catch(console.error);
    }, 5000); // Every 5 seconds

    console.log('✅ Notification checker started');
    checkAndNotify().catch(console.error); // Initial check
  }

  stopNotificationCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notificationService = NotificationService.getInstance();