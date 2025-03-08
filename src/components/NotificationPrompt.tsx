import React from 'react';

interface NotificationPromptProps {
  onRequestPermission: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onRequestPermission }) => {
  if (Notification.permission === 'granted' || !('Notification' in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm animate-fade-in">
      <div className="flex items-start gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            Get reminded about upcoming task deadlines
          </p>
        </div>
        <button
          onClick={onRequestPermission}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
};