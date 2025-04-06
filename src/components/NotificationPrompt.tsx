import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { tauriNotificationService } from '../services/notificationService';

interface NotificationPromptProps {
  onPermissionChange?: (granted: boolean) => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ 
  onPermissionChange 
}) => {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 检查是否需要显示通知提示
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const granted = await tauriNotificationService.checkPermissions();
        setIsVisible(!granted);
        if (onPermissionChange) onPermissionChange(granted);
      } catch (error) {
        console.error('检查通知权限失败:', error);
        setIsVisible(true);
      }
    };
    
    checkPermission();
  }, [onPermissionChange]);

  const handleRequestPermission = async () => {
    setLoading(true);
    
    try {
      const granted = await tauriNotificationService.checkPermissions();
      
      if (granted) {
        setIsVisible(false);
        // 发送测试通知确认权限正常
        await tauriNotificationService.sendTestNotification();
      }
      
      if (onPermissionChange) onPermissionChange(granted);
    } catch (error) {
      console.error('请求通知权限失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-xs bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">启用通知</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            允许任务提醒以避免错过重要截止日期
          </p>
        </div>
        
        <div className="ml-auto">
          <button 
            onClick={handleRequestPermission}
            disabled={loading}
            className={`px-3 py-1.5 text-sm rounded font-medium ${
              loading 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? '请求中...' : '允许'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;