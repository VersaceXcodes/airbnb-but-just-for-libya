import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Import necessary interfaces from Zod schemas
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

const UV_Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Zustand store selectors
  const updateSearchFilters = useAppStore(state => state.update_search_filters);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  // Local state for search form values
  const [searchFormValues, setSearchFormValues] = useState({
    location: '',
    check_in: '',
    check_out: '',
    guest_count: 1
  });

  // Fetch featured properties
  const { data: featuredDestinations, isLoading: isLoadingProperties, error: propertiesError } = useQuery<Property[]>({
    queryKey: ['featuredProperties'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
        {
          params: {
            limit: 6,
            sort_by: 'created_at'
          }
        }
      );
      return response.data.properties;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Fetch testimonials
  const { data: testimonials, isLoading: isLoadingTestimonials, error: testimonialsError } = useQuery<Review[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews`,
        {
          params: {
            limit: 3,
            sort_by: 'created_at'
          }
        }
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates before submission
    if (searchFormValues.check_in && searchFormValues.check_out) {
      const checkInDate = new Date(searchFormValues.check_in);
      const checkOutDate = new Date(searchFormValues.check_out);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Validate check-in date is not in the past
      if (checkInDate < today) {
        alert('Check-in date cannot be in the past');
        return;
      }
      
      // Validate check-out date is after check-in date
      if (checkOutDate <= checkInDate) {
        alert('Check-out date must be after check-in date');
        return;
      }
    }
    
    // Update global search filters
    updateSearchFilters({
      location: searchFormValues.location || null,
      check_in: searchFormValues.check_in || null,
      check_out: searchFormValues.check_out || null,
      guest_count: searchFormValues.guest_count || null
    });
    
    // Navigate to search results
    navigate('/search');
  };

  // Handle search form changes
  const handleSearchChange = (field: string, value: string | number) => {
    // Ensure date values are properly formatted for HTML5 date inputs
    if (field === 'check_in' || field === 'check_out') {
      const dateValue = value as string;
      // Validate and format date to YYYY-MM-DD format
      if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toISOString().split('T')[0];
          setSearchFormValues(prev => ({
            ...prev,
            [field]: formattedDate
          }));
          return;
        }
      }
    }
    
    setSearchFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Ultra-Modern Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-hidden">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 -left-10 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-20 -right-10 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-bounce"></div>
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-bounce"></div>
        </div>
        
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-indigo-950/60 to-slate-950/90"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-32 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced Badge */}
            <div className="mb-12 animate-fade-in-up">
              <span className="group inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-white/10 to-white/5 text-white backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 hover:scale-105">
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 animate-pulse"></div>
                <svg className="w-4 h-4 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Trusted by 1000+ travelers worldwide
                <svg className="w-4 h-4 ml-2 text-white/60 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
            
            {/* Ultra-Modern Typography */}
            <div className="mb-8 animate-fade-in-up animation-delay-200">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] mb-6 tracking-tight">
                <span className="block relative">
                  Discover
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-lg rounded-lg"></div>
                </span>
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x bg-300% mt-4">
                  Libya's Hidden Gems
                </span>
              </h1>
              
              {/* Subtitle with enhanced styling */}
              <div className="relative mt-8">
                <p className="text-xl md:text-2xl lg:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                  Experience <span className="text-white font-medium">authentic Libyan hospitality</span> with our curated collection of 
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium"> unique accommodations</span> across the country's most beautiful destinations.
                </p>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-60"></div>
              </div>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 animate-fade-in-up animation-delay-400">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Start Exploring
                </div>
              </button>
              
              <button className="group px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Ultra-Modern Search Card */}
          <div className="max-w-6xl mx-auto mt-20 animate-fade-in-up animation-delay-600">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-12">
                {/* Enhanced Tab Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  <button className="group relative px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-105 modern-button">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Rent
                    </div>
                  </button>
                  <button className="group px-8 py-4 text-sm font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Buy
                    </div>
                  </button>
                  <button className="group px-8 py-4 text-sm font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-105">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Sell
                    </div>
                  </button>
                </div>
              
              <form onSubmit={handleSearchSubmit} className="space-y-8">
                {/* Enhanced Main Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none z-10">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a6 6 0 111.414-1.414l4.243 4.243a1 1 0 01-1.414 1.414z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="text"
                    id="location"
                    placeholder="Where do you want to stay? (City, neighborhood, or landmark)"
                    value={searchFormValues.location}
                    onChange={(e) => handleSearchChange('location', e.target.value)}
                    className="w-full pl-20 pr-8 py-6 text-lg bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-3xl focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400 text-gray-900 placeholder-gray-500 shadow-2xl transition-all duration-500 hover:shadow-cyan-500/10 group-hover:border-white/50"
                    required
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                
                {/* Enhanced Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="relative group">
                    <label className="block text-sm font-bold text-white/95 mb-3 tracking-wide">Check-in</label>
                    <input
                      type="date"
                      id="check_in"
                      value={searchFormValues.check_in}
                      onChange={(e) => handleSearchChange('check_in', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-6 py-5 bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-2xl focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400 text-gray-900 shadow-xl transition-all duration-500 hover:shadow-cyan-500/10 group-hover:border-white/50"
                      required
                    />
                  </div>
                  
                  <div className="relative group">
                    <label className="block text-sm font-bold text-white/95 mb-3 tracking-wide">Check-out</label>
                    <input
                      type="date"
                      id="check_out"
                      value={searchFormValues.check_out}
                      onChange={(e) => handleSearchChange('check_out', e.target.value)}
                      min={searchFormValues.check_in ? new Date(new Date(searchFormValues.check_in).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-6 py-5 bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-2xl focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400 text-gray-900 shadow-xl transition-all duration-500 hover:shadow-cyan-500/10 group-hover:border-white/50"
                      required
                    />
                  </div>
                  
                  <div className="relative group">
                    <label className="block text-sm font-bold text-white/95 mb-3 tracking-wide">Guests</label>
                    <select
                      id="guests"
                      value={searchFormValues.guest_count}
                      onChange={(e) => handleSearchChange('guest_count', parseInt(e.target.value))}
                      className="w-full px-6 py-5 bg-white/95 backdrop-blur-xl border-2 border-white/30 rounded-2xl focus:ring-4 focus:ring-cyan-500/30 focus:border-cyan-400 text-gray-900 shadow-xl transition-all duration-500 hover:shadow-cyan-500/10 group-hover:border-white/50"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="group relative w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 hover:-translate-y-1 modern-button overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      <div className="relative flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Now
                      </div>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Ultra-Modern Stats */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center group animate-fade-in-up animation-delay-200">
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 shadow-2xl hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3 animate-gradient-x bg-300%">500+</div>
                <div className="text-white/90 font-semibold text-lg tracking-wide">Properties Listed</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
          <div className="text-center group animate-fade-in-up animation-delay-400">
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 animate-gradient-x bg-300%">50+</div>
                <div className="text-white/90 font-semibold text-lg tracking-wide">Cities Covered</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
          <div className="text-center group animate-fade-in-up animation-delay-600">
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 shadow-2xl hover:shadow-emerald-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3 animate-gradient-x bg-300%">1000+</div>
                <div className="text-white/90 font-semibold text-lg tracking-wide">Happy Guests</div>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Destinations */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Destinations</h2>
            <p className="mt-4 text-lg text-gray-500">
              Discover amazing places to stay across Libya
            </p>
          </div>

          {isLoadingProperties ? (
            <div className="flex justify-center mt-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : propertiesError ? (
            <div className="text-center mt-12 text-red-600">
              Failed to load featured destinations. Please try again later.
            </div>
          ) : (
            <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
              {featuredDestinations?.map((property) => (
                <div key={property.property_id} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                  <div className="flex-shrink-0">
                    <div className="h-48 w-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">Property Image</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">
                        {property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}
                      </p>
                      <Link to={`/properties/${property.property_id}`} className="block mt-2">
                        <p className="text-xl font-semibold text-gray-900">{property.title}</p>
                        <p className="mt-3 text-base text-gray-500 line-clamp-3">
                          {property.description}
                        </p>
                      </Link>
                    </div>
                    <div className="mt-6 flex items-center">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {property.guest_capacity} guests
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {property.base_price_per_night} LYD<span className="text-gray-500">/night</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How It Works Sections */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              For Travelers & Hosts
            </p>
          </div>

          <div className="mt-16">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Travelers Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">For Travelers</h3>
                <div className="space-y-10">
                  {[
                    {
                      title: "Search & Discover",
                      description: "Browse our extensive collection of accommodations in Libyan cities."
                    },
                    {
                      title: "Book Your Stay",
                      description: "Secure your accommodation with our simple booking process."
                    },
                    {
                      title: "Enjoy Your Trip",
                      description: "Experience authentic Libyan hospitality and culture."
                    }
                  ].map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">{step.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    to="/search"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Find Your Stay
                  </Link>
                </div>
              </div>

              {/* Hosts Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">For Hosts</h3>
                <div className="space-y-10">
                  {[
                    {
                      title: "List Your Property",
                      description: "Create a detailed listing of your space with photos and amenities."
                    },
                    {
                      title: "Receive Booking Requests",
                      description: "Get notified when travelers want to book your property."
                    },
                    {
                      title: "Earn Income",
                      description: "Welcome guests and earn money from your listing."
                    }
                  ].map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg leading-6 font-medium text-gray-900">{step.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  {isAuthenticated ? (
                    <Link
                      to="/listings/create"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Add Your Property
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Become a Host
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Safety Badges */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Your Safety is Our Priority</h2>
            <p className="mt-4 text-lg text-gray-500">
              We ensure secure and trustworthy experiences for all users
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Verified Listings",
                description: "All properties are verified for accuracy and safety"
              },
              {
                title: "Secure Payments",
                description: "Safe and transparent payment processing"
              },
              {
                title: "24/7 Support",
                description: "Round-the-clock assistance for all your needs"
              },
              {
                title: "Local Community",
                description: "Authentic experiences with Libyan hosts"
              }
            ].map((badge, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{badge.title}</h3>
                <p className="mt-2 text-base text-gray-500">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">What Our Guests Say</h2>
            <p className="mt-4 text-lg text-gray-500">
              Hear from travelers who've experienced Libya through LibyaStay
            </p>
          </div>

          {isLoadingTestimonials ? (
            <div className="flex justify-center mt-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : testimonialsError ? (
            <div className="text-center mt-12 text-red-600">
              Failed to load testimonials. Please try again later.
            </div>
          ) : (
            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {testimonials?.map((review) => (
                <div key={review.review_id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < review.overall_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4">
                    <p className="text-base text-gray-700">
                      {review.comment || "This was an amazing experience. The host was very welcoming and the place was exactly as described."}
                    </p>
                  </blockquote>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-bold">U</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Anonymous Traveler</p>
                      <p className="text-sm text-gray-500">Verified Guest</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Final CTA Sections */}
      <div className="py-16 bg-gradient-to-r from-green-700 to-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Ready to Experience Libya?</h2>
            <p className="mt-4 text-lg text-green-100">
              Join thousands of travelers and hosts on LibyaStay
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                to="/search"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-green-700 bg-white hover:bg-green-50"
              >
                Find Your Stay
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/listings/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Add Your Property
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Become a Host
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default UV_Landing;