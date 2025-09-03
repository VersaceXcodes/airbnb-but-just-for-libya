import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

interface Conversation {
  conversation_id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  created_at: string;
  updated_at: string;
}

const UV_TravelerBookings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get authentication state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Tab management
  const statusParam = searchParams.get('status') || 'upcoming';
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'pending' | 'cancelled'>(
    statusParam as 'upcoming' | 'past' | 'pending' | 'cancelled' || 'upcoming'
  );
  
  // Handle tab change
  useEffect(() => {
    const status = searchParams.get('status') || 'upcoming';
    setActiveTab(status as 'upcoming' | 'past' | 'pending' | 'cancelled');
  }, [searchParams]);
  
  const handleTabChange = (tab: 'upcoming' | 'past' | 'pending' | 'cancelled') => {
    setActiveTab(tab);
    setSearchParams({ status: tab });
  };
  
  // Fetch bookings
  const fetchBookings = async (status: string) => {
    if (!currentUser?.user_id || !authToken) return [];
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.user_id}/bookings`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { status }
      }
    );
    
    // Convert date strings to Date objects
    return response.data.map((booking: any) => ({
      ...booking,
      check_in: new Date(booking.check_in),
      check_out: new Date(booking.check_out),
      created_at: new Date(booking.created_at),
      updated_at: new Date(booking.updated_at)
    }));
  };
  
  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['bookings', activeTab, currentUser?.user_id],
    queryFn: () => fetchBookings(activeTab),
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${bookingId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      return response.data;
    },
    onSuccess: (updatedBooking) => {
      // Update the local cache
      queryClient.setQueryData(
        ['bookings', activeTab, currentUser?.user_id],
        (oldBookings: Booking[] = []) => {
          return oldBookings.map(booking => 
            booking.booking_id === updatedBooking.booking_id ? updatedBooking : booking
          );
        }
      );
      
      // Also update other booking lists
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
  
  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (booking: Booking) => {
      if (!authToken || !currentUser) throw new Error('Not authenticated');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/conversations`,
        {
          booking_id: booking.booking_id,
          guest_id: currentUser.user_id,
          host_id: booking.host_id
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      return response.data;
    },
    onSuccess: (conversation: Conversation) => {
      // Redirect to messages with new conversation
      window.location.href = `/messages?conversation_id=${conversation.conversation_id}`;
    }
  });
  
  // Handle booking cancellation
  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };
  
  // Handle messaging
  const handleMessageHost = (booking: Booking) => {
    createConversationMutation.mutate(booking);
  };
  
  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };
  
  // Get cancellation policy text
  const getCancellationPolicyText = (policy: string) => {
    switch (policy) {
      case 'flexible':
        return 'Free cancellation up to 24 hours before check-in';
      case 'moderate':
        return 'Free cancellation up to 7 days before check-in';
      case 'strict':
        return 'Non-refundable';
      default:
        return 'Cancellation policy not specified';
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    
    const statusText = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };
  
  // Render action buttons based on booking status
  const renderActionButtons = (booking: Booking) => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleCancelBooking(booking.booking_id)}
              disabled={cancelBookingMutation.isPending}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
            >
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMessageHost(booking)}
              disabled={createConversationMutation.isPending}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              Message Host
            </button>
            <button
              onClick={() => handleCancelBooking(booking.booking_id)}
              disabled={cancelBookingMutation.isPending}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
            >
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        );
      case 'completed':
        // Check if user has reviewed this booking (simplified check)
        // In a real app, you'd fetch actual review status
        {
          const hasReview = false; // Placeholder
        
        return (
          <div className="flex flex-wrap gap-2">
            {!hasReview && (
              <Link
                to={`/reviews/create/${booking.booking_id}`}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Leave Review
              </Link>
            )}
            <button
              onClick={() => handleMessageHost(booking)}
              disabled={createConversationMutation.isPending}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              Message Host
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={() => handleMessageHost(booking)}
            disabled={createConversationMutation.isPending}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            Message Host
          </button>
        );
    }
  };
  
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-gray-600">Manage your accommodation reservations</p>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {(['upcoming', 'past', 'pending', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  if (isError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-gray-600">Manage your accommodation reservations</p>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {(['upcoming', 'past', 'pending', 'cancelled'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error loading bookings
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="mt-2 text-gray-600">Manage your accommodation reservations</p>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {(['upcoming', 'past', 'pending', 'cancelled'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {bookings.filter((b: Booking) => b.status === tab).length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {bookings.filter((b: Booking) => b.status === tab).length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Bookings List */}
            <div className="p-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'upcoming' 
                      ? "You don't have any upcoming trips." 
                      : activeTab === 'past' 
                        ? "You haven't taken any trips yet." 
                        : activeTab === 'pending' 
                          ? "You don't have any pending bookings." 
                          : "You haven't cancelled any bookings."}
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/search"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Explore Listings
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking: Booking) => (
                    <div key={booking.booking_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start">
                              {/* Property Image Placeholder */}
                              <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
                              </div>
                              
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    <Link to={`/properties/${booking.property_id}`} className="hover:text-blue-600">
                                      Property #{booking.property_id.substring(0, 8)}
                                    </Link>
                                  </h3>
                                  {renderStatusBadge(booking.status)}
                                </div>
                                
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-sm text-gray-500">Dates</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatDate(new Date(booking.check_in))} - {formatDate(new Date(booking.check_out))}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-gray-500">Guests</p>
                                    <p className="text-sm font-medium text-gray-900">{booking.guest_count} guests</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatCurrency(booking.total_price)}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-gray-500">Booking ID</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {booking.booking_id.substring(0, 8)}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Libya-specific features */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Power: Available
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Water: Available
                                  </span>
                                </div>
                                
                                {booking.status === 'confirmed' && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    <p>Cancellation Policy: {getCancellationPolicyText('moderate')}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-3">
                            {renderActionButtons(booking)}
                            
                            <Link
                              to={`/properties/${booking.property_id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              View property details
                            </Link>
                          </div>
                        </div>
                      </div>
                      
                      {/* Emergency contact information for confirmed bookings */}
                      {booking.status === 'confirmed' && (
                        <div className="bg-blue-50 px-6 py-4 border-t border-gray-200">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">Emergency Contact</h3>
                              <div className="mt-1 text-sm text-blue-700">
                                <p>Host: John Doe</p>
                                <p>Phone: +218 91 000 0000</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_TravelerBookings;