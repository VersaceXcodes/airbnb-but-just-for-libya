import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Notification } from '@/store/main'; // Using the interface from store

// Define TypeScript interfaces
interface FetchNotificationsResponse extends Array<Notification> {}

interface UpdateNotificationPayload {
  is_read: boolean;
}

const GV_NotificationsPanel: React.FC = () => {
  // Global state
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const globalUnreadCount = useAppStore(state => state.notification_count.unread_count);
  const updateNotificationCount = useAppStore(state => state.update_notification_count);
  
  // Local state
  const [panelOpen, setPanelOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Query client for invalidating queries
  const queryClient = useQueryClient();
  
  // API functions
  const fetchNotifications = async (): Promise<FetchNotificationsResponse> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 20, offset: 0 }
      }
    );
    return response.data;
  };
  
  const updateNotification = async (notificationId: string, payload: UpdateNotificationPayload) => {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications/${notificationId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    return response.data;
  };
  
  // Queries and mutations
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: isAuthenticated && !!authToken && panelOpen,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  const updateNotificationMutation = useMutation({
    mutationFn: ({ notificationId, payload }: { notificationId: string; payload: UpdateNotificationPayload }) => 
      updateNotification(notificationId, payload),
    onSuccess: (updatedNotification) => {
      // Update local notifications
      setLocalNotifications(prev => 
        prev.map(notification => 
          notification.notification_id === updatedNotification.notification_id 
            ? updatedNotification 
            : notification
        )
      );
      
      // Update unread count
      if (updatedNotification.is_read) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        updateNotificationCount(newUnreadCount);
      }
      
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Handle panel open/close
  const togglePanel = () => {
    if (!isAuthenticated) return;
    
    const newOpenState = !panelOpen;
    setPanelOpen(newOpenState);
    
    if (newOpenState) {
      refetch();
    }
  };
  
  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    updateNotificationMutation.mutate({
      notificationId,
      payload: { is_read: true }
    });
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    localNotifications
      .filter(notification => !notification.is_read)
      .forEach(notification => {
        updateNotificationMutation.mutate({
          notificationId: notification.notification_id,
          payload: { is_read: true }
        });
      });
  };
  
  // Update local notifications when data changes
  useEffect(() => {
    if (notificationsData) {
      setLocalNotifications(notificationsData);
      const unread = notificationsData.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      updateNotificationCount(unread);
    }
  }, [notificationsData, updateNotificationCount]);
  
  // Synchronize with global unread count
  useEffect(() => {
    if (globalUnreadCount !== unreadCount) {
      setUnreadCount(globalUnreadCount);
    }
  }, [globalUnreadCount, unreadCount]);
  
  // Handle WebSocket events for real-time updates
  useEffect(() => {
    const websocketConnection = useAppStore.getState().websocket_connection;
    
    if (!websocketConnection || !isAuthenticated) return;
    
    const handleNotificationCreated = (data: Notification) => {
      setLocalNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => {
        const newCount = prev + 1;
        updateNotificationCount(newCount);
        return newCount;
      });
    };
    
    const handleNotificationUpdated = (data: Notification) => {
      setLocalNotifications(prev => 
        prev.map(notification => 
          notification.notification_id === data.notification_id 
            ? data 
            : notification
        )
      );
    };
    
    websocketConnection.on('notification/created', handleNotificationCreated);
    websocketConnection.on('notification/updated', handleNotificationUpdated);
    
    return () => {
      websocketConnection.off('notification/created', handleNotificationCreated);
      websocketConnection.off('notification/updated', handleNotificationUpdated);
    };
  }, [isAuthenticated, updateNotificationCount]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get icon based on notification type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking_request':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        );
      case 'booking_confirmed':
      case 'booking_declined':
      case 'booking_cancelled':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'message':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        );
      case 'review':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        );
    }
  };
  
  // Get link based on notification type and entity
  const getNotificationLink = (notification: Notification) => {
    if (!notification.related_entity_type || !notification.related_entity_id) {
      return '#';
    }
    
    switch (notification.related_entity_type) {
      case 'booking':
        if (notification.type === 'booking_request') {
          return '/dashboard/host-bookings';
        }
        return '/dashboard/bookings';
      case 'message':
        return '/messages';
      case 'review':
        return '/dashboard/bookings';
      default:
        return '/dashboard';
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={togglePanel}
          className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Notifications"
          aria-expanded={panelOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </button>
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      
      {/* Notifications Panel */}
      {panelOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200"
          style={{ top: '100%' }}
        >
          {/* Panel Header */}
          <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`text-sm ${unreadCount === 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Mark all as read
              </button>
              <button 
                onClick={() => setPanelOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {localNotifications.map((notification) => (
                  <li 
                    key={notification.notification_id} 
                    className={`p-4 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {getIconForType(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <Link 
                            to={getNotificationLink(notification)}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.notification_id);
                              }
                              setPanelOpen(false);
                            }}
                            className={`text-sm font-medium ${notification.is_read ? 'text-gray-900' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            {notification.title}
                          </Link>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </p>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.notification_id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Panel Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center">
            <Link 
              to="/settings" 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setPanelOpen(false)}
            >
              Notification preferences
            </Link>
            <span className="text-xs text-gray-500">
              {localNotifications.length} {localNotifications.length === 1 ? 'notification' : 'notifications'}
            </span>
          </div>
        </div>
      )}
      
      {/* Click outside to close panel */}
      {panelOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setPanelOpen(false)}
        ></div>
      )}
    </>
  );
};

export default GV_NotificationsPanel;