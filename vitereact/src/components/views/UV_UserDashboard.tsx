import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Zod schema derived TypeScript interfaces
interface Booking {
  booking_id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_price: number;
  service_fee: number;
  special_requests: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const UV_UserDashboard: React.FC = () => {
  // URL params for tab selection
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'default';
  
  // Local state
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const notificationCount = useAppStore(state => state.notification_count.unread_count);
  
  // Determine default tab based on user role
  useEffect(() => {
    if (activeTab === 'default' && currentUser?.role) {
      if (currentUser.role === 'host') {
        setActiveTab('host');
      } else if (currentUser.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('traveler');
      }
    }
  }, [activeTab, currentUser?.role]);
  
  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'default') {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);
  
  // Fetch user bookings for activity summary
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['userBookings', currentUser?.user_id, activeTab],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return null;
      
      const status = currentUser.role === 'traveler' ? 'confirmed' : 'pending';
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.user_id}/bookings`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { status }
        }
      );
      return response.data as Booking[];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Fetch recent notifications
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['userNotifications', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { limit: 5, is_read: false }
        }
      );
      return response.data as Notification[];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Calculate activity summary based on user role
  const upcomingBookingsCount = bookingsLoading 
    ? 0 
    : currentUser?.role === 'traveler' 
      ? bookingsData?.filter((b: Booking) => 
          b.status === 'confirmed' && new Date(b.check_in) > new Date()
        ).length || 0
      : 0;
      
  const pendingRequestsCount = bookingsLoading 
    ? 0 
    : currentUser?.role === 'host' 
      ? bookingsData?.filter((b: Booking) => b.status === 'pending').length || 0
      : 0;
  
  // Calculate profile completeness (simplified)
  const calculateProfileCompleteness = () => {
    if (!currentUser) return 0;
    
    let completedFields = 0;
    const totalFields = 5; // name, email, phone, bio, profile_picture_url
    
    if (currentUser.name) completedFields++;
    if (currentUser.email) completedFields++;
    if (currentUser.phone_number) completedFields++;
    if (currentUser.bio) completedFields++;
    if (currentUser.profile_picture_url) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };
  
  const profileCompleteness = calculateProfileCompleteness();
  
  // Check emergency contact status
  const emergencyContactVerified = !!currentUser?.emergency_contact_name && !!currentUser?.emergency_contact_phone;
  
  // Render role-specific tabs
  const renderTabs = () => {
    const tabs: JSX.Element[] = [];
    
    if (currentUser?.role === 'traveler' || currentUser?.role === 'both') {
      tabs.push(
        <button
          key="traveler"
          className={`px-4 py-2 font-medium text-sm rounded-md ${
            activeTab === 'traveler'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('traveler')}
        >
          Traveler Dashboard
        </button>
      );
    }
    
    if (currentUser?.role === 'host' || currentUser?.role === 'both') {
      tabs.push(
        <button
          key="host"
          className={`px-4 py-2 font-medium text-sm rounded-md ${
            activeTab === 'host'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('host')}
        >
          Host Dashboard
        </button>
      );
    }
    
    if (currentUser?.role === 'admin') {
      tabs.push(
        <button
          key="admin"
          className={`px-4 py-2 font-medium text-sm rounded-md ${
            activeTab === 'admin'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          Admin Panel
        </button>
      );
    }
    
    return tabs;
  };
  
  // Render quick actions based on user role
  const renderQuickActions = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentUser?.role === 'traveler' && (
            <Link
              to="/search"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Search Stays</span>
            </Link>
          )}
          
          {(currentUser?.role === 'host' || currentUser?.role === 'both') && (
            <Link
              to="/listings/create"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Create Listing</span>
            </Link>
          )}
          
          <Link
            to="/messages"
            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="bg-purple-100 p-3 rounded-full mb-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Messages</span>
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Link>
          
          <Link
            to="/settings"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-gray-100 p-3 rounded-full mb-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </Link>
        </div>
      </div>
    );
  };
  
  // Render activity summary based on user role
  const renderActivitySummary = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">
                  {currentUser?.role === 'traveler' ? 'Upcoming Bookings' : 'Pending Requests'}
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentUser?.role === 'traveler' ? upcomingBookingsCount : pendingRequestsCount}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Unread Messages</h3>
                <p className="text-2xl font-semibold text-gray-900">{notificationCount}</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Profile Completeness</h3>
                <p className="text-2xl font-semibold text-gray-900">{profileCompleteness}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render recent notifications
  const renderRecentNotifications = () => {
    if (notificationsLoading) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h2>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="bg-gray-200 rounded-full h-10 w-10"></div>
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Notifications</h2>
          <Link to="/messages" className="text-sm text-blue-600 hover:text-blue-800">
            View all
          </Link>
        </div>
        
        {notificationsData && notificationsData.length > 0 ? (
          <div className="space-y-4">
            {notificationsData.slice(0, 5).map((notification) => (
              <div 
                key={notification.notification_id} 
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render profile completeness section
  const renderProfileCompleteness = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Completeness</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-medium text-gray-700">{profileCompleteness}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${profileCompleteness}%` }}
              ></div>
            </div>
          </div>
          
          {profileCompleteness < 100 && (
            <div className="text-sm text-gray-600">
              <p>Complete your profile to build trust with other users:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {!currentUser?.bio && <li>Add a bio</li>}
                {!currentUser?.profile_picture_url && <li>Upload a profile picture</li>}
              </ul>
              <Link 
                to="/settings" 
                className="mt-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Complete Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render emergency contact verification
  const renderEmergencyContact = () => {
    if (emergencyContactVerified) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Emergency Contact Verified</h3>
              <div className="mt-1 text-sm text-green-700">
                <p>Your emergency contact information is up to date.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Emergency Contact Required</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>Please add your emergency contact information for safety purposes.</p>
              <Link to="/settings" className="font-medium text-yellow-800 underline hover:text-yellow-900">
                Add emergency contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render recent activity feed
  const renderRecentActivity = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    New booking request
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    You have a new booking request for your property
                  </p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  2h ago
                </div>
              </div>
            </li>
            
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Profile updated
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    You updated your profile information
                  </p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  1d ago
                </div>
              </div>
            </li>
            
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    New message
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                  You received a new message from a guest
                </p>
              </div>
              <div className="text-sm text-gray-500 whitespace-nowrap">
                2d ago
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

if (!currentUser) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

return (
  <>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {currentUser.name}!
          </p>
        </div>
        
        {/* Role-based navigation tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {renderTabs()}
          </nav>
        </div>
        
        {/* Emergency contact verification */}
        <div className="mb-6">
          {renderEmergencyContact()}
        </div>
        
        {/* Quick actions */}
        <div className="mb-6">
          {renderQuickActions()}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity summary and profile completeness */}
          <div className="lg:col-span-2 space-y-6">
            {renderActivitySummary()}
            {renderProfileCompleteness()}
            {renderRecentActivity()}
          </div>
          
          {/* Recent notifications */}
          <div>
            {renderRecentNotifications()}
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default UV_UserDashboard;