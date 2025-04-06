import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { tauriNotificationService } from '../services/notificationService';

interface NotificationTestButtonProps {
  variant?: 'primary' | 'subtle' | 'icon';
  label?: string;
}

const NotificationTestButton: React.FC<NotificationTestButtonProps> = ({
  variant = 'primary',
  label = '测试通知'
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const success = await tauriNotificationService.sendTestNotification();
      console.log(`通知测试${success ? '成功' : '失败'}`);
    } catch (error) {
      console.error('通知测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleTestNotification}
        disabled={loading}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="测试通知"
      >
        <Bell size={18} className={loading ? 'animate-pulse' : ''} />
      </button>
    );
  }
  
  return (
    <button
      onClick={handleTestNotification}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
        variant === 'primary'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Bell size={16} className={loading ? 'animate-pulse' : ''} />
      <span>{loading ? '发送中...' : label}</span>
    </button>
  );
};

export default NotificationTestButton;