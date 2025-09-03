import React from 'react';
import { useAppStore } from '@/store/main';

const GV_NotificationsPanel: React.FC = () => {
  const notificationCount = useAppStore(state => state.notification_count);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <div className="text-sm text-gray-600">
        You have {notificationCount.unread_count} unread notifications
      </div>
    </div>
  );
};

export default GV_NotificationsPanel;