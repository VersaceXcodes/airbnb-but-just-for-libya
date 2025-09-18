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
    setSearchFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Modern Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-transparent to-slate-900/50"></div>
        
        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 pt-32 pb-32 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white backdrop-blur-sm border border-white/20">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Trusted by 1000+ travelers
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-8">
              Discover
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Libya's Hidden Gems
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Experience authentic Libyan hospitality with our curated collection of unique accommodations across the country's most beautiful destinations.
            </p>
          </div>

          {/* Modern Search Card */}
          <div className="max-w-5xl mx-auto mt-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Rent
                </button>
                <button className="px-6 py-3 text-sm font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300">
                  <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Buy
                </button>
                <button className="px-6 py-3 text-sm font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300">
                  <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Sell
                </button>
              </div>
              
              <form onSubmit={handleSearchSubmit} className="space-y-6">
                {/* Main Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a6 6 0 111.414-1.414l4.243 4.243a1 1 0 01-1.414 1.414z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="location"
                    placeholder="Where do you want to stay? (City, neighborhood, or landmark)"
                    value={searchFormValues.location}
                    onChange={(e) => handleSearchChange('location', e.target.value)}
                    className="w-full pl-16 pr-6 py-5 text-lg bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 text-gray-900 placeholder-gray-500 shadow-lg transition-all duration-300"
                    required
                  />
                </div>
                
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-white/90 mb-2">Check-in</label>
                    <input
                      type="date"
                      id="check_in"
                      value={searchFormValues.check_in}
                      onChange={(e) => handleSearchChange('check_in', e.target.value)}
                      className="w-full px-4 py-4 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 text-gray-900 shadow-lg transition-all duration-300"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-white/90 mb-2">Check-out</label>
                    <input
                      type="date"
                      id="check_out"
                      value={searchFormValues.check_out}
                      onChange={(e) => handleSearchChange('check_out', e.target.value)}
                      className="w-full px-4 py-4 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 text-gray-900 shadow-lg transition-all duration-300"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-white/90 mb-2">Guests</label>
                    <select
                      id="guests"
                      value={searchFormValues.guest_count}
                      onChange={(e) => handleSearchChange('guest_count', parseInt(e.target.value))}
                      className="w-full px-4 py-4 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 text-gray-900 shadow-lg transition-all duration-300"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Modern Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">500+</div>
                <div className="text-white/80 font-medium">Properties Listed</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">50+</div>
                <div className="text-white/80 font-medium">Cities Covered</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">1000+</div>
                <div className="text-white/80 font-medium">Happy Guests</div>
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
    </>
  );
};

export default UV_Landing;