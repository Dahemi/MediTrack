import React from 'react';
import { format } from 'date-fns';

interface NotificationPanelProps {
  notifications: any[];
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose }) => {
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                notification.status === 'unread' ? 'bg-blue-50' : ''
              }`}
              onClick={() => markAsRead(notification._id)}
            >
              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;