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
  const { } = useQuery({
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
    if (isCheckIn) {
      setCheckInDate(date);
      
      // Auto-open check-out calendar
      if (!checkOutDate || checkOutDate < date) {
        setCheckOutDate(null);
      }
    } else {
      setCheckOutDate(date);
    }
    
    // Clear errors
    setCheckInError(null);
    setCheckOutError(null);
  };
  
  // Validate dates
  const validateDates = () => {
    let isValid = true;
    
    if (checkInDate && checkOutDate) {
      if (checkInDate > checkOutDate) {
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
  


  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <form onSubmit={handleSearch} className="flex gap-4">
        <div ref={locationRef} className="flex-1">
          <input
            type="text"
            placeholder="Where are you going?"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            onFocus={() => setShowLocationSuggestions(true)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {showLocationSuggestions && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
              {libyanCities
                .filter(city => city.toLowerCase().includes(selectedLocation.toLowerCase()))
                .map(city => (
                  <div
                    key={city}
                    onClick={() => handleLocationSelect(city)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {city}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <div ref={checkInRef} className="flex-1">
          <input
            type="date"
            value={checkInDate || ''}
            onChange={(e) => handleDateSelect(e.target.value, true)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {checkInError && <p className="text-red-500 text-sm mt-1">{checkInError}</p>}
        </div>
        
        <div ref={checkOutRef} className="flex-1">
          <input
            type="date"
            value={checkOutDate || ''}
            onChange={(e) => handleDateSelect(e.target.value, false)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {checkOutError && <p className="text-red-500 text-sm mt-1">{checkOutError}</p>}
        </div>
        
        <div className="flex-1">
          <input
            type="number"
            min="1"
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default GV_SearchBarWidget;