import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, parseISO, isBefore, isSameDay } from 'date-fns';
import { useAppStore } from '@/store/main';

// Zod schema derived TypeScript interfaces
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
  role: 'traveler' | 'host' | 'admin' | 'both';
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

interface PropertyPhoto {
  photo_id: string;
  property_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
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

interface PropertyAvailability {
  availability_id: string;
  property_id: string;
  date: string;
  is_available: boolean;
  price_override: number | null;
}

const UV_PropertyDetails: React.FC = () => {
  // URL parameters
  const { property_id } = useParams<{ property_id: string }>();
  const [searchParams] = useSearchParams();
  
  // Global state
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const bookingCart = useAppStore(state => state.booking_cart);
  
  
  // Local state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [checkInDate, setCheckInDate] = useState<string | null>(searchParams.get('check_in') || bookingCart.check_in);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(searchParams.get('check_out') || bookingCart.check_out);
  const [guestCount, setGuestCount] = useState<number>(searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : bookingCart.guest_count || 1);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  
  // Fetch property details
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: ['property', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}`
      );
      return response.data;
    },
    enabled: !!property_id
  });
  
  // Fetch property photos
  const { data: photos = [] } = useQuery<PropertyPhoto[]>({
    queryKey: ['property-photos', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}/photos`
      );
      return response.data;
    },
    enabled: !!property_id
  });
  
  // Fetch host information
  const { data: host } = useQuery<User>({
    queryKey: ['host', property?.host_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${property?.host_id}`
      );
      return response.data;
    },
    enabled: !!property?.host_id
  });
  
  // Fetch property reviews
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['property-reviews', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}/reviews`
      );
      return response.data;
    },
    enabled: !!property_id
  });
  
  // Fetch availability data
  const { data: availability = [], refetch: refetchAvailability } = useQuery<PropertyAvailability[]>({
    queryKey: ['property-availability', property_id, dateRange.start, dateRange.end],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}/availability?${params}`
      );
      return response.data;
    },
    enabled: !!property_id && !!dateRange.start && !!dateRange.end
  });
  
  // Parse amenities
  const amenitiesList = property?.amenities ? property.amenities.split(',').map(a => a.trim()) : [];
  
  // Calculate total nights
  const totalNights = checkInDate && checkOutDate ? 
    Math.max(0, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  // Calculate total price
  const totalPrice = property && totalNights > 0 ? 
    property.base_price_per_night * totalNights : 0;
  
  // Calculate service fee (10% of total)
  const serviceFee = totalPrice * 0.1;
  
  // Calculate final total
  const finalTotal = totalPrice + serviceFee;
  
  // Check if dates are available
  const isDateRangeAvailable = () => {
    if (!checkInDate || !checkOutDate) return false;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Check each date in range
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const availabilityForDate = availability.find(a => a.date === dateStr);
      
      // If date is not available or not found in availability data
      if (!availabilityForDate || !availabilityForDate.is_available) {
        return false;
      }
    }
    
    return true;
  };
  
  // Handle photo selection
  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowLightbox(true);
  };
  
  // Handle lightbox close
  const closeLightbox = () => {
    setShowLightbox(false);
  };
  
  // Handle date range change for availability
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      
      // Extend date range to show more availability
      const extendedStart = new Date(startDate);
      extendedStart.setMonth(extendedStart.getMonth() - 1);
      
      const extendedEnd = new Date(endDate);
      extendedEnd.setMonth(extendedEnd.getMonth() + 1);
      
      setDateRange({
        start: format(extendedStart, 'yyyy-MM-dd'),
        end: format(extendedEnd, 'yyyy-MM-dd')
      });
    }
  }, [checkInDate, checkOutDate]);
  
  // Refetch availability when date range changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      refetchAvailability();
    }
  }, [dateRange, refetchAvailability]);
  
  // Submit booking request
  const submitBooking = async () => {
    if (!property || !currentUser || !authToken) return;
    
    try {
      const bookingData = {
        property_id: property.property_id,
        guest_id: currentUser.user_id,
        host_id: property.host_id,
        check_in: checkInDate,
        check_out: checkOutDate,
        guest_count: guestCount,
        total_price: finalTotal,
        service_fee: serviceFee,
        special_requests: specialRequests,
        status: 'pending'
      };
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings`,
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Reset form
      setCheckInDate(null);
      setCheckOutDate(null);
      setGuestCount(1);
      setSpecialRequests('');
      setTermsAccepted(false);
      
      alert('Booking request submitted successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to submit booking request. Please try again.');
    }
  };
  
  // Initiate messaging with host
  const initiateMessaging = async () => {
    if (!property || !currentUser || !authToken) {
      alert('You need to be logged in to contact the host.');
      return;
    }
    
    try {
      const conversationData = {
        guest_id: currentUser.user_id,
        host_id: property.host_id
      };
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/conversations`,
        conversationData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Navigate to messages (in a real app, this would use navigate hook)
      alert('Messaging initiated! You can now communicate with the host.');
    } catch (error) {
      console.error('Messaging error:', error);
      alert('Failed to initiate messaging. Please try again.');
    }
  };
  
  // Calculate average ratings
  const calculateAverageRatings = () => {
    if (reviews.length === 0) return null;
    
    const totals = {
      cleanliness: 0,
      accuracy: 0,
      communication: 0,
      location: 0,
      check_in: 0,
      value: 0,
      overall: 0
    };
    
    reviews.forEach(review => {
      totals.cleanliness += review.cleanliness_rating;
      totals.accuracy += review.accuracy_rating;
      totals.communication += review.communication_rating;
      totals.location += review.location_rating;
      totals.check_in += review.check_in_rating;
      totals.value += review.value_rating;
      totals.overall += review.overall_rating;
    });
    
    return {
      cleanliness: totals.cleanliness / reviews.length,
      accuracy: totals.accuracy / reviews.length,
      communication: totals.communication / reviews.length,
      location: totals.location / reviews.length,
      check_in: totals.check_in / reviews.length,
      value: totals.value / reviews.length,
      overall: totals.overall / reviews.length
    };
  };
  
  const averageRatings = calculateAverageRatings();
  
  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // Render amenity icon
  const renderAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
          </svg>
        );
      case 'ac':
      case 'air conditioning':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15c0-2.8 2.2-5 5-5h11c1.7 0 3 1.3 3 3 0 .4-.1.8-.3 1.1l-4.4 7.9c-.6 1-1.7 1.6-2.9 1.6H8c-2.8 0-5-2.2-5-5z"></path>
          </svg>
        );
      case 'kitchen':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
        );
      case 'parking':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
        );
      case 'generator':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        );
      case 'water tank':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
    }
  };
  
  // Render availability calendar day
  const renderCalendarDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availabilityForDate = availability.find(a => a.date === dateStr);
    
    let isAvailable = true;
    let isBlocked = false;
    
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (
        (isSameDay(date, checkIn) || isSameDay(date, checkOut)) ||
        (date > checkIn && date < checkOut)
      ) {
        isBlocked = true;
      }
    }
    
    if (availabilityForDate) {
      isAvailable = availabilityForDate.is_available;
    }
    
    const today = new Date();
    const isPast = isBefore(date, today);
    
    let bgColor = 'bg-white';
    if (isBlocked) bgColor = 'bg-blue-100';
    else if (!isAvailable || isPast) bgColor = 'bg-gray-100';
    
    return (
      <button
        key={dateStr}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${bgColor} ${isAvailable && !isPast && !isBlocked ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-not-allowed'}`}
        onClick={() => {
          if (!isAvailable || isPast || isBlocked) return;
          
          if (!checkInDate) {
            setCheckInDate(dateStr);
          } else if (!checkOutDate) {
            if (new Date(dateStr) > new Date(checkInDate)) {
              setCheckOutDate(dateStr);
            } else {
              // Swap dates
              setCheckOutDate(checkInDate);
              setCheckInDate(dateStr);
            }
          } else {
            // Reset selection
            setCheckInDate(dateStr);
            setCheckOutDate(null);
          }
        }}
        disabled={!isAvailable || isPast || isBlocked}
      >
        {format(date, 'd')}
      </button>
    );
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const days: JSX.Element[] = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    // Previous month
    const prevMonth = new Date(startDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    
    // Next month
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Add days from previous month
    const prevMonthStartDay = prevMonthEnd.getDay();
    for (let i = prevMonthStartDay; i > 0; i--) {
      const date = new Date(prevMonthEnd);
      date.setDate(date.getDate() - i + 1);
      days.push(renderCalendarDay(date));
    }
    
    // Add days from current month
    const daysInMonth = endDate.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(startDate);
      date.setDate(i);
      days.push(renderCalendarDay(date));
    }
    
    // Add days from next month
    const totalCells = 42; // 6 weeks
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(nextMonth);
      date.setDate(i);
      days.push(renderCalendarDay(date));
    }
    
    return days;
  };
  
  if (propertyLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }
  
  if (propertyError) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the property you're looking for.</p>
            <Link 
              to="/search" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Lightbox */}
        {showLightbox && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl"
            >
              &times;
            </button>
            <button
              onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
              className="absolute left-4 text-white text-4xl"
              disabled={photos.length <= 1}
            >
              &#8249;
            </button>
            <button
              onClick={() => setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 text-white text-4xl"
              disabled={photos.length <= 1}
            >
              &#8250;
            </button>
            <img
              src={photos[selectedPhotoIndex]?.photo_url}
              alt="Property"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
        
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Photo gallery */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                {photos.length > 0 ? (
                  <img
                    src={photos[0]?.photo_url}
                    alt="Property"
                    className="w-full h-96 object-cover rounded-lg cursor-pointer"
                    onClick={() => handlePhotoClick(0)}
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
                    <span className="text-gray-500">No photos available</span>
                  </div>
                )}
              </div>
              {photos.slice(1, 5).map((photo, index) => (
                <div key={photo.photo_id} className="relative">
                  <img
                    src={photo.photo_url}
                    alt="Property"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => handlePhotoClick(index + 1)}
                  />
                  {index === 3 && photos.length > 5 && (
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                      onClick={() => handlePhotoClick(4)}
                    >
                      <span className="text-white text-xl font-bold">+{photos.length - 5} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Property details and booking form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property details */}
            <div className="lg:col-span-2">
              {/* Title and location */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property?.title}</h1>
                <p className="text-gray-600">
                  {property?.city}{property?.neighborhood ? `, ${property.neighborhood}` : ''}
                </p>
              </div>
              
              {/* Host information */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    {host?.profile_picture_url ? (
                      <img 
                        src={host.profile_picture_url} 
                        alt={host.name} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-gray-200 border-2 border-dashed rounded-full w-16 h-16 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">?</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-900">Hosted by {host?.name}</h2>
                    <div className="flex items-center mt-1">
                      {host?.is_verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {isAuthenticated && host?.emergency_contact_name && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Emergency Contact</h3>
                    <p className="text-gray-700">
                      <span className="font-medium">Name:</span> {host.emergency_contact_name}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span> {host.emergency_contact_phone}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={initiateMessaging}
                  className="mt-4 w-full bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contact Host
                </button>
              </div>
              
              {/* Property specs */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{property?.guest_capacity}</p>
                    <p className="text-sm text-gray-500">Guests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{property?.bedrooms}</p>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{property?.beds}</p>
                    <p className="text-sm text-gray-500">Beds</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{property?.bathrooms}</p>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About this place</h2>
                <p className="text-gray-700 whitespace-pre-line">{property?.description}</p>
              </div>
              
              {/* Amenities */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What this place offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <div className="mr-3">
                        {renderAmenityIcon(amenity)}
                      </div>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
                
                {/* Libya-specific utilities */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Infrastructure Status</h3>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${property?.has_power_backup ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-700">Generator Power Backup</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${property?.has_water_tank ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-700">Water Tank/Stable Supply</span>
                  </div>
                </div>
              </div>
              
              {/* House rules */}
              {property?.house_rules && (
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">House Rules</h2>
                  <p className="text-gray-700 whitespace-pre-line">{property.house_rules}</p>
                </div>
              )}
              
              {/* Cancellation policy */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cancellation Policy</h2>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {property?.cancellation_policy === 'flexible' ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    ) : property?.cancellation_policy === 'moderate' ? (
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-900 capitalize">{property?.cancellation_policy}</p>
                    <p className="text-gray-600 mt-1">
                      {property?.cancellation_policy === 'flexible' 
                        ? 'Free cancellation up to 24 hours before check-in' 
                        : property?.cancellation_policy === 'moderate' 
                          ? 'Free cancellation up to 7 days before check-in' 
                          : 'Non-refundable'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Reviews */}
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
                  {averageRatings && (
                    <div className="flex items-center">
                      {averageRatings && renderStars(averageRatings.overall)}
                      <span className="ml-2 text-gray-600">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
                
                {averageRatings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Cleanliness</span>
                        <span className="text-gray-900 font-medium">{averageRatings.cleanliness.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.cleanliness / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="text-gray-900 font-medium">{averageRatings.accuracy.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.accuracy / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Communication</span>
                        <span className="text-gray-900 font-medium">{averageRatings.communication.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.communication / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Location</span>
                        <span className="text-gray-900 font-medium">{averageRatings.location.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.location / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Check-in</span>
                        <span className="text-gray-900 font-medium">{averageRatings.check_in.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.check_in / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Value</span>
                        <span className="text-gray-900 font-medium">{averageRatings.value.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(averageRatings.value / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <div className="flex-shrink-0">
                          <div className="bg-gray-200 border-2 border-dashed rounded-full w-10 h-10 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">U</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900">User</h3>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(review.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13 mb-2">
                        {renderStars(review.overall_rating)}
                      </div>
                      <p className="ml-13 text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
                
                {reviews.length > 3 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showAllReviews ? 'Show less' : `Show all ${reviews.length} reviews`}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Booking form */}
            <div>
              <div className="sticky top-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {property?.base_price_per_night} {property?.currency} <span className="text-base font-normal text-gray-600">/ night</span>
                    </p>
                  </div>
                  {averageRatings && (
                    <div className="flex items-center">
{averageRatings && renderStars(averageRatings.overall)}
                       <span className="ml-1 text-sm text-gray-600">({reviews.length})</span>                    </div>
                  )}
                </div>
                
                {/* Calendar */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Select dates</h3>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-sm text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays()}
                  </div>
                </div>
                
                {/* Guest selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    disabled={!checkInDate || !checkOutDate}
                  >
                    {[...Array(property?.guest_capacity || 1)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} {i === 0 ? 'guest' : 'guests'}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Pricing breakdown */}
                {checkInDate && checkOutDate && (
                  <div className="mb-6 border-t border-gray-200 pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">
                        {property?.base_price_per_night} {property?.currency} x {totalNights} nights
                      </span>
                      <span className="text-gray-900">
                        {totalPrice} {property?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-600">Service fee</span>
                      <span className="text-gray-900">
                        {serviceFee.toFixed(2)} {property?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {finalTotal.toFixed(2)} {property?.currency}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Special requests */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Any special requests or notes for the host?"
                  />
                </div>
                
                {/* Terms */}
                <div className="mb-6 flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">House Rules</a> and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500">Cancellation Policy</a>
                    </label>
                  </div>
                </div>
                
                {/* Booking button */}
                {isAuthenticated ? (
                  <button
                    onClick={submitBooking}
                    disabled={
                      !checkInDate || 
                      !checkOutDate || 
                      !termsAccepted || 
                      !isDateRangeAvailable() || 
                      guestCount > (property?.guest_capacity || 0)
                    }
                    className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !checkInDate || 
                      !checkOutDate || 
                      !termsAccepted || 
                      !isDateRangeAvailable() || 
                      guestCount > (property?.guest_capacity || 0)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    {!checkInDate || !checkOutDate
                      ? 'Select dates'
                      : !isDateRangeAvailable()
                        ? 'Dates not available'
                        : guestCount > (property?.guest_capacity || 0)
                          ? 'Too many guests'
                          : !termsAccepted
                            ? 'Accept terms'
                            : property?.instant_book
                              ? 'Book instantly'
                              : 'Request to book'}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center block"
                  >
                    Sign in to book
                  </Link>
                )}
                
                {!isDateRangeAvailable() && checkInDate && checkOutDate && (
                  <p className="mt-2 text-sm text-red-600">Selected dates are not available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PropertyDetails;