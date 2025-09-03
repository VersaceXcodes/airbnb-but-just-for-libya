import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

// TypeScript interfaces based on Zod schemas
interface User {
  user_id: string;
  email: string;
  phone_number: string;
  password_hash: string;
  name: string;
  profile_picture_url: string | null;
  bio: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  role: 'guest' | 'host' | 'admin';
  is_verified: boolean;
  verification_document_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Property {
  property_id: string;
  host_id: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  property_type: string;
  guest_capacity: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string | null;
  base_price_per_night: number;
  currency: string;
  has_power_backup: boolean;
  has_water_tank: boolean;
  house_rules: string | null;
  cancellation_policy: string;
  instant_book: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

interface Review {
  review_id: string;
  booking_id: string;
  property_id: string;
  reviewer_id: string;
  host_id: string;
  cleanliness_rating: number;
  accuracy_rating: number;
  communication_rating: number;
  location_rating: number;
  check_in_rating: number;
  value_rating: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface DashboardMetrics {
  total_users: number;
  total_properties: number;
  total_bookings: number;
  total_reviews: number;
  active_conversations: number;
  pending_moderation: number;
}

const UV_AdminPanel: React.FC = () => {
  // Auth state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  
  
  // Local state
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    total_users: 0,
    total_properties: 0,
    total_bookings: 0,
    total_reviews: 0,
    active_conversations: 0,
    pending_moderation: 0
  });
  
  const [managementTabs, setManagementTabs] = useState({
    users: true,
    listings: false,
    bookings: false,
    reviews: false
  });
  
  const [activeView, setActiveView] = useState('dashboard');
  
  const [filters, setFilters] = useState({
    user_query: '',
    user_role: '',
    user_verified: false,
    property_query: '',
    property_status: '',
    booking_status: '',
    review_query: ''
  });
  
  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      window.location.href = '/';
    }
  }, [currentUser]);
  
  // Load dashboard metrics
  const loadDashboardMetrics = async () => {
    try {
      // We'll simulate this since there's no dedicated endpoint
      // In a real implementation, we'd fetch from /api/admin/metrics
      const usersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 1 }
      });
      
      const propertiesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 1 }
      });
      
      const bookingsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 1 }
      });
      
      const reviewsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { limit: 1 }
      });
      
      return {
        total_users: usersRes.data.total_count || 0,
        total_properties: propertiesRes.data.total_count || 0,
        total_bookings: bookingsRes.data.total_count || 0,
        total_reviews: reviewsRes.data.total_count || 0,
        active_conversations: 0, // Would require separate endpoint
        pending_moderation: 0 // Would require separate endpoint
      };
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      throw error;
    }
  };
  
  const { data: metricsData, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: loadDashboardMetrics,
    enabled: !!authToken,
    staleTime: 60000, // 1 minute
    retry: 1
  });
  
  useEffect(() => {
    if (metricsData) {
      setDashboardMetrics(metricsData);
    }
  }, [metricsData]);
  
  // Search functions
  const searchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          query: filters.user_query,
          role: filters.user_role,
          is_verified: filters.user_verified,
          limit: 50,
          offset: 0
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  };
  
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', filters.user_query, filters.user_role, filters.user_verified],
    queryFn: searchUsers,
    enabled: !!authToken && activeView === 'users',
    staleTime: 60000,
    retry: 1
  });
  
  const searchProperties = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          query: filters.property_query,
          is_active: filters.property_status === 'active' ? true : filters.property_status === 'inactive' ? false : undefined,
          limit: 50,
          offset: 0
        }
      });
      return response.data.properties;
    } catch (error) {
      console.error('Failed to search properties:', error);
      throw error;
    }
  };
  
  const { data: propertiesData, isLoading: isLoadingProperties, refetch: refetchProperties } = useQuery({
    queryKey: ['properties', filters.property_query, filters.property_status],
    queryFn: searchProperties,
    enabled: !!authToken && activeView === 'listings',
    staleTime: 60000,
    retry: 1
  });
  
  const searchBookings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          status: filters.booking_status || undefined,
          limit: 50,
          offset: 0
        }
      });
      return response.data.bookings;
    } catch (error) {
      console.error('Failed to search bookings:', error);
      throw error;
    }
  };
  
  const { data: bookingsData, isLoading: isLoadingBookings, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings', filters.booking_status],
    queryFn: searchBookings,
    enabled: !!authToken && activeView === 'bookings',
    staleTime: 60000,
    retry: 1
  });
  
  const searchReviews = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          query: filters.review_query,
          limit: 50,
          offset: 0
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search reviews:', error);
      throw error;
    }
  };
  
  const { data: reviewsData, isLoading: isLoadingReviews, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', filters.review_query],
    queryFn: searchReviews,
    enabled: !!authToken && activeView === 'reviews',
    staleTime: 60000,
    retry: 1
  });
  
  // Mutation functions
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
        { is_verified: false },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchUsers();
      refetchMetrics();
    }
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchUsers();
      refetchMetrics();
    }
  });
  
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchProperties();
      refetchMetrics();
    }
  });
  
  const refundBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${bookingId}`,
        { status: 'refunded' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchBookings();
      refetchMetrics();
    }
  });
  
  const removeReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchReviews();
      refetchMetrics();
    }
  });
  
  // Handler functions
  const handleTabChange = (tab: keyof typeof managementTabs) => {
    setManagementTabs({
      users: tab === 'users',
      listings: tab === 'listings',
      bookings: tab === 'bookings',
      reviews: tab === 'reviews'
    });
    
    if (tab === 'users') setActiveView('users');
    if (tab === 'listings') setActiveView('listings');
    if (tab === 'bookings') setActiveView('bookings');
    if (tab === 'reviews') setActiveView('reviews');
  };
  
  const handleFilterChange = (filterName: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const handleRefresh = () => {
    refetchMetrics();
    if (activeView === 'users') refetchUsers();
    if (activeView === 'listings') refetchProperties();
    if (activeView === 'bookings') refetchBookings();
    if (activeView === 'reviews') refetchReviews();
  };
  
  // Loading state
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be an administrator to access this panel.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {currentUser.name}</span>
              <button 
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard Metrics */}
          {activeView === 'dashboard' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {isLoadingMetrics ? (
                                <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
                              ) : (
                                dashboardMetrics.total_users
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Listings</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {isLoadingMetrics ? (
                                <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
                              ) : (
                                dashboardMetrics.total_properties
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {isLoadingMetrics ? (
                                <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
                              ) : (
                                dashboardMetrics.total_bookings
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    <li>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">New user registered</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Ahmed Ali registered as a host
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>Just now</span>
                          </div>
                        </div>
                      </div>
                    </li>
                    
                    <li>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">New property listed</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Luxury apartment in Tripoli was listed
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>2 hours ago</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setActiveView('users')}
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage Platform
                </button>
              </div>
            </div>
          )}
          
          {/* Management Views */}
          {(activeView === 'users' || activeView === 'listings' || activeView === 'bookings' || activeView === 'reviews') && (
            <div className="px-4 py-6 sm:px-0">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => handleTabChange('users')}
                    className={`${
                      managementTabs.users
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => handleTabChange('listings')}
                    className={`${
                      managementTabs.listings
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Listings
                  </button>
                  <button
                    onClick={() => handleTabChange('bookings')}
                    className={`${
                      managementTabs.bookings
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => handleTabChange('reviews')}
                    className={`${
                      managementTabs.reviews
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Reviews
                  </button>
                </nav>
              </div>
              
              {/* Filters Section */}
              <div className="mt-6 bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeView === 'users' && (
                    <>
                      <div>
                        <label htmlFor="user_query" className="block text-sm font-medium text-gray-700">
                          Search Users
                        </label>
                        <input
                          type="text"
                          name="user_query"
                          id="user_query"
                          value={filters.user_query}
                          onChange={(e) => handleFilterChange('user_query', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Name, email..."
                        />
                      </div>
                      <div>
                        <label htmlFor="user_role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          id="user_role"
                          name="user_role"
                          value={filters.user_role}
                          onChange={(e) => handleFilterChange('user_role', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">All Roles</option>
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="user_verified" className="block text-sm font-medium text-gray-700">
                          Verified Status
                        </label>
                        <select
                          id="user_verified"
                          name="user_verified"
                          value={filters.user_verified.toString()}
                          onChange={(e) => handleFilterChange('user_verified', e.target.value === 'true')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="false">All</option>
                          <option value="true">Verified</option>
                          <option value="false">Unverified</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  {activeView === 'listings' && (
                    <>
                      <div>
                        <label htmlFor="property_query" className="block text-sm font-medium text-gray-700">
                          Search Listings
                        </label>
                        <input
                          type="text"
                          name="property_query"
                          id="property_query"
                          value={filters.property_query}
                          onChange={(e) => handleFilterChange('property_query', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Title, city..."
                        />
                      </div>
                      <div>
                        <label htmlFor="property_status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="property_status"
                          name="property_status"
                          value={filters.property_status}
                          onChange={(e) => handleFilterChange('property_status', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">All</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </>
                  )}
                  
                  {activeView === 'bookings' && (
                    <div>
                      <label htmlFor="booking_status" className="block text-sm font-medium text-gray-700">
                        Booking Status
                      </label>
                      <select
                        id="booking_status"
                        name="booking_status"
                        value={filters.booking_status}
                        onChange={(e) => handleFilterChange('booking_status', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  )}
                  
                  {activeView === 'reviews' && (
                    <div>
                      <label htmlFor="review_query" className="block text-sm font-medium text-gray-700">
                        Search Reviews
                      </label>
                      <input
                        type="text"
                        name="review_query"
                        id="review_query"
                        value={filters.review_query}
                        onChange={(e) => handleFilterChange('review_query', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Comment, property..."
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Tables */}
              {activeView === 'users' && (
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              </div>
                            </td>
                          </tr>
                        ) : usersData && usersData.length > 0 ? (
                          usersData.map((user: User) => (
                            <tr key={user.user_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {user.profile_picture_url ? (
                                      <img className="h-10 w-10 rounded-full" src={user.profile_picture_url} alt="" />
                                    ) : (
                                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 capitalize">{user.role}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.is_verified ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => suspendUserMutation.mutate(user.user_id)}
                                  disabled={suspendUserMutation.isPending}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  {suspendUserMutation.isPending ? 'Suspending...' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => deleteUserMutation.mutate(user.user_id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeView === 'listings' && (
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Listing
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Host
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingProperties ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              </div>
                            </td>
                          </tr>
                        ) : propertiesData && propertiesData.length > 0 ? (
                          propertiesData.map((property: Property) => (
                            <tr key={property.property_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{property.title}</div>
                                <div className="text-sm text-gray-500">{property.property_type}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Host #{property.host_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {property.base_price_per_night} LYD
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {property.is_active ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => deletePropertyMutation.mutate(property.property_id)}
                                  disabled={deletePropertyMutation.isPending}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {deletePropertyMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No listings found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeView === 'bookings' && (
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booking
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Guest
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingBookings ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              </div>
                            </td>
                          </tr>
                        ) : bookingsData && bookingsData.length > 0 ? (
                          bookingsData.map((booking: Booking) => (
                            <tr key={booking.booking_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">#{booking.booking_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Property #{booking.property_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Guest #{booking.guest_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.total_price} LYD
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {booking.status !== 'refunded' && (
                                  <button
                                    onClick={() => refundBookingMutation.mutate(booking.booking_id)}
                                    disabled={refundBookingMutation.isPending}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    {refundBookingMutation.isPending ? 'Processing...' : 'Refund'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                              No bookings found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeView === 'reviews' && (
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Review
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Guest
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingReviews ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              </div>
                            </td>
                          </tr>
                        ) : reviewsData && reviewsData.length > 0 ? (
                          reviewsData.map((review: Review) => (
                            <tr key={review.review_id}>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 line-clamp-2">{review.comment || 'No comment'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Property #{review.property_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Guest #{review.reviewer_id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-5 w-5 ${
                                        i < review.overall_rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-1 text-sm text-gray-500">({review.overall_rating})</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeReviewMutation.mutate(review.review_id)}
                                  disabled={removeReviewMutation.isPending}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {removeReviewMutation.isPending ? 'Removing...' : 'Remove'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No reviews found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default UV_AdminPanel;