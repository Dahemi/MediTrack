import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationPanel from './NotificationPanel';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (user?.id) {
      // Initialize WebSocket connection
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}/ws`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        websocket.send(JSON.stringify({ type: 'register', userId: user.id }));
      };

      websocket.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      setWs(websocket);

      // Fetch existing notifications
      fetchNotifications();

      return () => {
        websocket.close();
      };
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => n.status === 'unread').length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && <NotificationPanel notifications={notifications} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBell;