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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-700 to-red-700 text-white">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block"> Libyan Stays, </span>
              <span className="block text-green-300"> Luxury Experiences </span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-gray-200">
              Discover unique accommodations across Libya with LibyaStay - your home away from home.
            </p>
          </div>

          {/* Search Bar Widget */}
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Where to?
                  </label>
                  <input
                    type="text"
                    id="location"
                    placeholder="Tripoli, Benghazi, Misrata..."
                    value={searchFormValues.location}
                    onChange={(e) => handleSearchChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="check_in" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    id="check_in"
                    value={searchFormValues.check_in}
                    onChange={(e) => handleSearchChange('check_in', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="check_out" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    id="check_out"
                    value={searchFormValues.check_out}
                    onChange={(e) => handleSearchChange('check_out', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <select
                    id="guests"
                    value={searchFormValues.guest_count}
                    onChange={(e) => handleSearchChange('guest_count', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-4">
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300"
                  >
                    Search Accommodations
                  </button>
                </div>
              </form>
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