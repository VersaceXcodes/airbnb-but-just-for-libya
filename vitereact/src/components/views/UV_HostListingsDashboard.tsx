import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// Types based on Zod schemas
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

interface PerformanceMetrics {
  total_bookings: number;
  total_earnings: number;
  average_rating: number;
  pending_requests: number;
}

interface VerificationStatus {
  is_verified: boolean;
  documents_submitted: boolean;
}

const UV_HostListingsDashboard: React.FC = () => {
  // Zustand store selectors
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local component state
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'pending'>('active');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    is_verified: false,
    documents_submitted: false
  });
  
  const queryClient = useQueryClient();
  
  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  // Fetch listings
  const { data: listings = [], isLoading: listingsLoading, error: listingsError } = useQuery<Property[]>({
    queryKey: ['hostListings', currentUser?.user_id, activeFilter],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.user_id}/listings`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      // Filter based on active status
      if (activeFilter === 'active') {
        return response.data.filter((listing: Property) => listing.is_active);
      } else if (activeFilter === 'inactive') {
        return response.data.filter((listing: Property) => !listing.is_active);
      } else if (activeFilter === 'pending') {
        // In a real implementation, we might have a separate status field
        return response.data.filter((listing: Property) => !listing.is_active);
      }
      
      return response.data;
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Fetch performance data
  const { data: performanceMetrics, isLoading: performanceLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['performanceMetrics', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) {
        return {
          total_bookings: 0,
          total_earnings: 0,
          average_rating: 0,
          pending_requests: 0
        };
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/users/${currentUser.user_id}/bookings`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      const bookings: Booking[] = response.data;
      
      const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + booking.total_price, 0);
        
      const pendingRequests = bookings
        .filter(b => b.status === 'pending')
        .length;
        
      // TODO: Fetch actual review data to calculate average rating
      // This would require another API call to /api/users/{user_id}/reviews
      
      return {
        total_bookings: bookings.filter(b => b.status === 'completed').length,
        total_earnings: totalEarnings,
        average_rating: 0, // Placeholder until review data is fetched
        pending_requests: pendingRequests
      };
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });
  
  // Mutation for updating listing status
  const updateListingStatusMutation = useMutation({
    mutationFn: async ({ property_id, is_active }: { property_id: string; is_active: boolean }) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/properties/${property_id}`,
        { is_active },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
    }
  });
  
  // Check verification status on mount
  useEffect(() => {
    if (currentUser) {
      setVerificationStatus({
        is_verified: currentUser.is_verified,
        documents_submitted: !!currentUser.verification_document_url
      });
    }
  }, [currentUser]);
  
  // Handle listing status toggle
  const toggleListingStatus = (property_id: string, current_status: boolean) => {
    updateListingStatusMutation.mutate({
      property_id,
      is_active: !current_status
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(' ly-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Render status badge
  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };
  
  // Render verification status
  const renderVerificationStatus = () => {
    if (verificationStatus.is_verified) {
      return (
        <div className="flex items-center text-green-600">
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Verified</span>
        </div>
      );
    } else if (verificationStatus.documents_submitted) {
      return (
        <div className="flex items-center text-yellow-600">
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Pending Verification</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Not Verified</span>
        </div>
      );
    }
  };
  
  // Render filter buttons
  const renderFilterButtons = () => {
    const filters = [
      { key: 'active', label: 'Active Listings' },
      { key: 'inactive', label: 'Inactive Listings' },
      { key: 'pending', label: 'Pending Review' }
    ];
    
    return (
      <div className="flex space-x-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as 'active' | 'inactive' | 'pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeFilter === filter.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    );
  };
  
  // Render performance metrics cards
  const renderPerformanceMetrics = () => {
    if (performanceLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Total Bookings</div>
          <div className="text-2xl font-bold mt-1">{performanceMetrics?.total_bookings || 0}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Total Earnings</div>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(performanceMetrics?.total_earnings || 0)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Average Rating</div>
          <div className="text-2xl font-bold mt-1">
            {performanceMetrics?.average_rating || 0}
            <span className="text-base font-normal">/5</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Pending Requests</div>
          <div className="text-2xl font-bold mt-1">{performanceMetrics?.pending_requests || 0}</div>
        </div>
      </div>
    );
  };
  
  // Render listings grid
  const renderListingsGrid = () => {
    if (listingsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (listingsError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load listings. Please try again later.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (listings.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No listings found</h3>
          <p className="mt-1 text-gray-500">Get started by creating a new property listing.</p>
          <div className="mt-6">
            <Link to="/listings/create" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Listing
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div key={listing.property_id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Listing Image */}
            <div className="h-48 bg-gray-200 relative">
              {listing.is_active ? (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              ) : (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {listing.city}
              </div>
            </div>
            
            {/* Listing Info */}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 truncate">{listing.title}</h3>
                {renderStatusBadge(listing.is_active)}
              </div>
              
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {listing.description.substring(0, 100)}...
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(listing.base_price_per_night)}
                    <span className="text-sm font-normal text-gray-500">/night</span>
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    to={`/listings/${listing.property_id}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => toggleListingStatus(listing.property_id, listing.is_active)}
                    disabled={updateListingStatusMutation.isPending}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      listing.is_active
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {updateListingStatusMutation.isPending 
                      ? 'Updating...' 
                      : listing.is_active 
                        ? 'Deactivate' 
                        : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
              <Link
                to="/listings/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Listing
              </Link>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Verification Status Banner */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <div className="mr-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Account Verification</h3>
                  <div className="mt-1">
                    {renderVerificationStatus()}
                  </div>
                </div>
              </div>
              
              {!verificationStatus.is_verified && (
                <div className="mt-4 md:mt-0">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Submit Documents
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Performance Metrics */}
          {renderPerformanceMetrics()}
          
          {/* Listings Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-medium text-gray-900">My Property Listings</h2>
                <div className="mt-4 md:mt-0">
                  {renderFilterButtons()}
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {renderListingsGrid()}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_HostListingsDashboard;