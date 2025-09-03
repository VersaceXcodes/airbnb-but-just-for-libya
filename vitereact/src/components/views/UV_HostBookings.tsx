import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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



const UV_HostBookings: React.FC = () => {
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'history'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  // Fetch pending booking requests
  const { data: pendingBookings = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['hostBookings', 'pending', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(
        `${apiBaseUrl}/api/bookings`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            host_id: currentUser.user_id,
            status: 'pending'
          }
        }
      );
      
      return response.data.bookings as Booking[];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Fetch confirmed bookings
  const { data: confirmedBookings = [], isLoading: isLoadingConfirmed } = useQuery({
    queryKey: ['hostBookings', 'confirmed', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(
        `${apiBaseUrl}/api/bookings`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            host_id: currentUser.user_id,
            status: 'confirmed'
          }
        }
      );
      
      return response.data.bookings as Booking[];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Fetch booking history (completed and cancelled)
  const { data: bookingHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['hostBookings', 'history', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(
        `${apiBaseUrl}/api/bookings`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            host_id: currentUser.user_id,
            status: ['completed', 'cancelled']
          }
        }
      );
      
      return response.data.bookings as Booking[];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  
  
  // Approve booking mutation
  const approveBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${apiBaseUrl}/api/bookings/${bookingId}`,
        { status: 'confirmed' },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data as Booking;
    },
    onSuccess: (data) => {
      // Update local state
      queryClient.setQueryData(
        ['hostBookings', 'pending', currentUser?.user_id],
        (oldData: Booking[] | undefined) => 
          oldData?.filter(booking => booking.booking_id !== data.booking_id) || []
      );
      
      queryClient.setQueryData(
        ['hostBookings', 'confirmed', currentUser?.user_id],
        (oldData: Booking[] | undefined) => 
          [...(oldData || []), data]
      );
      
      // Close modal if open
      setSelectedBooking(null);
    },
    onError: (error) => {
      console.error('Error approving booking:', error);
      alert('Failed to approve booking. Please try again.');
    }
  });
  
  // Decline booking mutation
  const declineBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${apiBaseUrl}/api/bookings/${bookingId}`,
        { 
          status: 'declined',
          special_requests: reason || 'No reason provided' // Using special_requests for decline reason
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data as Booking;
    },
    onSuccess: (data) => {
      // Update local state
      queryClient.setQueryData(
        ['hostBookings', 'pending', currentUser?.user_id],
        (oldData: Booking[] | undefined) => 
          oldData?.filter(booking => booking.booking_id !== data.booking_id) || []
      );
      
      // Close modal and reset reason
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedBooking(null);
    },
    onError: (error) => {
      console.error('Error declining booking:', error);
      alert('Failed to decline booking. Please try again.');
    }
  });
  
  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${apiBaseUrl}/api/bookings/${bookingId}`,
        { status: 'cancelled' },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data as Booking;
    },
    onSuccess: (data) => {
      // Update local state
      queryClient.setQueryData(
        ['hostBookings', 'confirmed', currentUser?.user_id],
        (oldData: Booking[] | undefined) => 
          oldData?.filter(booking => booking.booking_id !== data.booking_id) || []
      );
      
      queryClient.setQueryData(
        ['hostBookings', 'history', currentUser?.user_id],
        (oldData: Booking[] | undefined) => 
          [...(oldData || []), data]
      );
      
      // Close modal
      setSelectedBooking(null);
    },
    onError: (error) => {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  });
  
  // Handle approve booking
  const handleApproveBooking = (bookingId: string) => {
    approveBookingMutation.mutate(bookingId);
  };
  
  // Handle decline booking
  const handleDeclineBooking = (bookingId: string) => {
    setSelectedBooking(pendingBookings.find(b => b.booking_id === bookingId) || null);
    setShowDeclineModal(true);
  };
  
  // Handle confirm decline
  const handleConfirmDecline = () => {
    if (selectedBooking) {
      declineBookingMutation.mutate({ 
        bookingId: selectedBooking.booking_id, 
        reason: declineReason 
      });
    }
  };
  
  // Handle cancel booking
  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
  
  // Calculate booking duration
  const getBookingDuration = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Render booking request card
  const renderBookingRequestCard = (booking: Booking) => (
    <div key={booking.booking_id} className="border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Booking #{booking.booking_id.substring(0, 8)}</h3>
          <p className="text-gray-600">{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</p>
          <p className="text-gray-600">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(booking.total_price)}</p>
          <p className="text-sm text-gray-500">+{formatCurrency(booking.service_fee)} service fee</p>
        </div>
      </div>
      
      {booking.special_requests && (
        <div className="mt-2 p-2 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Special requests:</span> {booking.special_requests}
          </p>
        </div>
      )}
      
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => handleApproveBooking(booking.booking_id)}
          disabled={approveBookingMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {approveBookingMutation.isPending ? 'Approving...' : 'Approve'}
        </button>
        <button
          onClick={() => handleDeclineBooking(booking.booking_id)}
          disabled={declineBookingMutation.isPending}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {declineBookingMutation.isPending ? 'Declining...' : 'Decline'}
        </button>
      </div>
    </div>
  );
  
  
  
  // Render booking history card
  const renderHistoryBookingCard = (booking: Booking) => (
    <div key={booking.booking_id} className="border rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Booking #{booking.booking_id.substring(0, 8)}</h3>
          <p className="text-gray-600">{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</p>
          <p className="text-gray-600">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(booking.total_price)}</p>
          <p className={`text-sm font-medium ${booking.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </p>
        </div>
      </div>
    </div>
  );
  
  // Render calendar view
  const renderCalendarView = () => {
    // Group bookings by month for simplicity
    const bookingsByMonth: Record<string, Booking[]> = {};
    
    confirmedBookings.forEach(booking => {
      const month = new Date(booking.check_in).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!bookingsByMonth[month]) {
        bookingsByMonth[month] = [];
      }
      bookingsByMonth[month].push(booking);
    });
    
    return (
      <div className="space-y-8">
        {Object.entries(bookingsByMonth).map(([month, bookings]) => (
          <div key={month}>
            <h3 className="text-xl font-bold mb-4">{month}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map(booking => (
                <div 
                  key={booking.booking_id} 
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Booking #{booking.booking_id.substring(0, 8)}</h4>
                      <p className="text-gray-600">{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</p>
                      <p className="text-gray-600">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(booking.total_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Host Bookings</h1>
            <p className="text-gray-600 mt-2">
              Manage your booking requests, confirmed bookings, and booking history
            </p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Booking Requests
                {pendingBookings.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {pendingBookings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'confirmed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Confirmed Bookings
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Booking History
              </button>
            </nav>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Booking Requests</h2>
              {isLoadingPending ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No pending booking requests</h3>
                  <p className="mt-1 text-gray-500">When guests request to book your properties, they'll appear here.</p>
                </div>
              ) : (
                <div>
                  {pendingBookings.map(renderBookingRequestCard)}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'confirmed' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Confirmed Bookings</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCalendarViewMode('month')}
                    className={`px-3 py-1 rounded ${
                      calendarViewMode === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('week')}
                    className={`px-3 py-1 rounded ${
                      calendarViewMode === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('day')}
                    className={`px-3 py-1 rounded ${
                      calendarViewMode === 'day'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>
              
              {isLoadingConfirmed ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : confirmedBookings.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No confirmed bookings</h3>
                  <p className="mt-1 text-gray-500">When guests confirm bookings, they'll appear here.</p>
                </div>
              ) : (
                <div>
                  {renderCalendarView()}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking History</h2>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No booking history</h3>
                  <p className="mt-1 text-gray-500">Your completed and cancelled bookings will appear here.</p>
                </div>
              ) : (
                <div>
                  {bookingHistory.map(renderHistoryBookingCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Decline Booking Modal */}
      {showDeclineModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Decline Booking Request</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to decline this booking request? You can provide a reason for declining.
              </p>
              <div className="mb-4">
                <label htmlFor="declineReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for declining (optional)
                </label>
                <textarea
                  id="declineReason"
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder="Enter reason for declining..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDecline}
                  disabled={declineBookingMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {declineBookingMutation.isPending ? 'Declining...' : 'Decline Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Details Modal */}
      {selectedBooking && !showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900">Booking Information</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
                      <dd className="text-sm text-gray-900">{selectedBooking.booking_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Check-in</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedBooking.check_in)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Check-out</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedBooking.check_out)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Guests</dt>
                      <dd className="text-sm text-gray-900">{selectedBooking.guest_count}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900 capitalize">{selectedBooking.status}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Financial Details</h4>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(selectedBooking.total_price)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Service Fee</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(selectedBooking.service_fee)}</dd>
                    </div>
                    {selectedBooking.special_requests && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
                        <dd className="text-sm text-gray-900">{selectedBooking.special_requests}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_HostBookings;