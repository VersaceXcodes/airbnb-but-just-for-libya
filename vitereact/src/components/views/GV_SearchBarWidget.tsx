import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

const GV_SearchBarWidget: React.FC = () => {
  // Global state
  const searchFilters = useAppStore(state => state.search_filters);
  const updateSearchFilters = useAppStore(state => state.update_search_filters);
  
  // Component state
  const [selectedLocation, setSelectedLocation] = useState<string>(searchFilters.location || '');
  const [checkInDate, setCheckInDate] = useState<string | null>(searchFilters.check_in || null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(searchFilters.check_out || null);
  const [guestCount, setGuestCount] = useState<number>(searchFilters.guest_count || 1);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState<boolean>(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState<boolean>(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);
  
  // Refs for click outside detection
  const locationRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);
  
  // Navigation
  const navigate = useNavigate();
  const locationHook = useLocation();
  
  // Libyan cities for suggestions
  const libyanCities = [
    'Tripoli', 'Benghazi', 'Misrata', 'Tobruk', 'Derna', 
    'Zliten', 'Zuwara', 'Khoms', 'Sirte', 'Al-Bayda', 'Tajura'
  ];
  
  // Fetch location suggestions
  const { data: locationSuggestions } = useQuery({
    queryKey: ['locationSuggestions', selectedLocation],
    queryFn: async () => {
      if (!selectedLocation) return [];
      
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
          {
            params: {
              city: selectedLocation,
              limit: 10
            }
          }
        );
        
        const cities = new Set<string>();
        response.data.properties.forEach((property: any) => {
          if (property.city) {
            cities.add(property.city);
          }
        });
        
        return Array.from(cities);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        return [];
      }
    },
    enabled: selectedLocation.length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
      
      if (checkInRef.current && !checkInRef.current.contains(event.target as Node)) {
        setShowCheckInCalendar(false);
      }
      
      if (checkOutRef.current && !checkOutRef.current.contains(event.target as Node)) {
        setShowCheckOutCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Initialize from global state if on search page
  useEffect(() => {
    if (locationHook.pathname === '/search') {
      setSelectedLocation(searchFilters.location || '');
      setCheckInDate(searchFilters.check_in || null);
      setCheckOutDate(searchFilters.check_out || null);
      setGuestCount(searchFilters.guest_count || 1);
    }
  }, [locationHook.pathname, searchFilters]);
  
  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationSuggestions(false);
  };
  
  // Handle date selection
  const handleDateSelect = (date: string, isCheckIn: boolean) => {
    // Ensure date is in proper YYYY-MM-DD format
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    if (isCheckIn) {
      setCheckInDate(formattedDate);
      setShowCheckInCalendar(false);
      
      // Auto-open check-out calendar and clear invalid check-out date
      if (!checkOutDate || checkOutDate <= formattedDate) {
        setCheckOutDate(null);
      }
      setShowCheckOutCalendar(true);
    } else {
      setCheckOutDate(formattedDate);
      setShowCheckOutCalendar(false);
    }
    
    // Clear errors
    setCheckInError(null);
    setCheckOutError(null);
  };
  
  // Validate dates
  const validateDates = () => {
    let isValid = true;
    
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if dates are valid
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        setCheckInError('Please enter a valid date');
        setCheckOutError('Please enter a valid date');
        isValid = false;
      } else if (checkIn < today) {
        setCheckInError('Check-in date cannot be in the past');
        isValid = false;
      } else if (checkOut <= checkIn) {
        setCheckInError('Check-in date must be before check-out date');
        setCheckOutError('Check-out date must be after check-in date');
        isValid = false;
      } else {
        setCheckInError(null);
        setCheckOutError(null);
      }
    }
    
    return isValid;
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates()) {
      return;
    }
    
    // Update global search filters
    updateSearchFilters({
      location: selectedLocation || null,
      check_in: checkInDate,
      check_out: checkOutDate,
      guest_count: guestCount
    });
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (selectedLocation) queryParams.append('location', selectedLocation);
    if (checkInDate) queryParams.append('check_in', checkInDate);
    if (checkOutDate) queryParams.append('check_out', checkOutDate);
    if (guestCount) queryParams.append('guests', guestCount.toString());
    
    // Navigate to search results
    navigate(`/search?${queryParams.toString()}`);
  };
  
  // Generate date options
  const generateDateOptions = (isCheckIn: boolean) => {
    const dates: string[] = [];
    const today = new Date();
    
    // Start from today or check-in date
    const startDate = isCheckIn ? today : (checkInDate ? new Date(checkInDate) : today);
    if (!isCheckIn && startDate <= today) {
      startDate.setDate(today.getDate() + 1);
    }
    
    // Generate next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Add dates';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Calculate night count
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  return (
    <>
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200">
        <form onSubmit={handleSearch} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location Input */}
            <div ref={locationRef} className="relative">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">WHERE</label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    placeholder="Where are you going?"
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showLocationSuggestions && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {selectedLocation && locationSuggestions && locationSuggestions.length > 0 ? (
                        locationSuggestions.map((suggestion: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => handleLocationSelect(suggestion)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                          >
                            {suggestion}
                          </div>
                        ))
                      ) : (
                        <>
                          {libyanCities
                            .filter(city => 
                              city.toLowerCase().includes(selectedLocation.toLowerCase())
                            )
                            .map((city, index) => (
                              <div
                                key={index}
                                onClick={() => handleLocationSelect(city)}
                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                              >
                                {city}
                              </div>
                            ))
                          }
                          {!selectedLocation && (
                            <div className="px-4 py-3 text-gray-500">
                              Popular destinations in Libya
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Check-in Date */}
            <div ref={checkInRef} className="relative">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">CHECK IN</label>
                <div 
                  onClick={() => setShowCheckInCalendar(!showCheckInCalendar)}
                  className={`w-full py-3 px-4 border rounded-lg cursor-pointer flex items-center ${
                    checkInError 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{formatDate(checkInDate)}</span>
                    {checkInError && (
                      <span className="text-red-500 text-xs mt-1">{checkInError}</span>
                    )}
                  </div>
                </div>
                
                {showCheckInCalendar && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72">
                    <div className="grid grid-cols-7 gap-1">
                      {generateDateOptions(true).slice(0, 30).map((date, index) => (
                        <div
                          key={index}
                          onClick={() => handleDateSelect(date, true)}
                          className={`p-2 text-center rounded-full cursor-pointer ${
                            date === checkInDate
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {new Date(date).getDate()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Check-out Date */}
            <div ref={checkOutRef} className="relative">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">CHECK OUT</label>
                <div 
                  onClick={() => setShowCheckOutCalendar(!showCheckOutCalendar)}
                  className={`w-full py-3 px-4 border rounded-lg cursor-pointer flex items-center ${
                    checkOutError 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{formatDate(checkOutDate)}</span>
                    {checkOutError && (
                      <span className="text-red-500 text-xs mt-1">{checkOutError}</span>
                    )}
                    {checkInDate && checkOutDate && (
                      <span className="text-gray-500 text-xs">
                        {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                {showCheckOutCalendar && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72">
                    <div className="grid grid-cols-7 gap-1">
                      {generateDateOptions(false).slice(0, 30).map((date, index) => (
                        <div
                          key={index}
                          onClick={() => handleDateSelect(date, false)}
                          className={`p-2 text-center rounded-full cursor-pointer ${
                            date === checkOutDate
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {new Date(date).getDate()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Guests and Search Button */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1">GUESTS</label>
              <div className="flex">
                <div className="relative flex-grow">
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full py-3 px-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(num => (
                      <option key={num} value={num}>
                        {num} guest{num !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-r-lg transition duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <div className="mt-4 flex justify-between items-center">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              Advanced filters
            </button>
            
            {checkInDate && checkOutDate && (
              <div className="text-sm text-gray-600">
                {calculateNights()} night{calculateNights() !== 1 ? 's' : ''} in {selectedLocation || 'Libya'}
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default GV_SearchBarWidget;