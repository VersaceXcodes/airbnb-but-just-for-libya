import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// TypeScript interfaces based on Zod schemas
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

interface SearchPropertyResponse {
  properties: Property[];
  total_count: number;
}

const UV_SearchResults: React.FC = () => {
  // URL search parameters
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Global state
  const updateSearchFilters = useAppStore(state => state.update_search_filters);
  
  // Local state
  const [mapViewActive, setMapViewActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    check_in: searchParams.get('check_in') || '',
    check_out: searchParams.get('check_out') || '',
    guest_count: searchParams.get('guests') ? parseInt(searchParams.get('guests') || '1') : null,
    price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min') || '0') : null,
    price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max') || '0') : null,
    property_type: searchParams.get('property_type') || '',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')?.split(',') || [] : [],
    instant_book: null as boolean | null,
    sort_by: searchParams.get('sort_by') || 'created_at'
  });

  // Parse amenities from URL
  useEffect(() => {
    const amenitiesParam = searchParams.get('amenities');
    if (amenitiesParam) {
      setFilters(prev => ({
        ...prev,
        amenities: amenitiesParam.split(',')
      }));
    }
  }, []);

  // Update global search filters
  useEffect(() => {
    updateSearchFilters({
      location: filters.location || null,
      check_in: filters.check_in || null,
      check_out: filters.check_out || null,
      guest_count: filters.guest_count,
      price_min: filters.price_min,
      price_max: filters.price_max,
      property_types: filters.property_type ? [filters.property_type] : [],
      amenities: filters.amenities,
      sort_by: filters.sort_by
    });
  }, [filters, updateSearchFilters]);

  // Fetch properties with React Query
  const fetchProperties = async () => {
    const params: Record<string, string | number> = {
      limit: 10,
      offset: (currentPage - 1) * 10
    };
    
    if (filters.location) params.location = filters.location;
    if (filters.check_in) params.check_in = filters.check_in;
    if (filters.check_out) params.check_out = filters.check_out;
    if (filters.guest_count) params.guests = filters.guest_count.toString();
    if (filters.price_min) params.price_min = filters.price_min;
    if (filters.price_max) params.price_max = filters.price_max;
    if (filters.property_type) params.property_type = filters.property_type;
    if (filters.amenities.length > 0) params.amenities = filters.amenities.join(',');
    if (filters.instant_book !== null) params.instant_book = filters.instant_book;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    
    const response = await axios.get<SearchPropertyResponse>(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
      { params }
    );
    
    return response.data;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['properties', filters, currentPage],
    queryFn: fetchProperties,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams.toString());
    if (value !== null && value !== '') {
      if (key === 'amenities') {
        newParams.set('amenities', value.join(','));
      } else {
        newParams.set(key, value.toString());
      }
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Toggle amenity filter
  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    
    handleFilterChange('amenities', newAmenities);
  };

  // Toggle property type filter
  const togglePropertyType = (type: string) => {
    handleFilterChange('property_type', filters.property_type === type ? '' : type);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      location: '',
      check_in: '',
      check_out: '',
      guest_count: null,
      price_min: null,
      price_max: null,
      property_type: '',
      amenities: [],
      instant_book: null,
      sort_by: 'created_at'
    });
    
    setSearchParams({});
    setCurrentPage(1);
  };

  // Format amenities string for display
  const formatAmenities = (amenities: string | null) => {
    if (!amenities) return [];
    return amenities.split(',').map(a => a.trim()).filter(a => a.length > 0);
  };

  // Pagination controls
  const totalPages = data ? Math.ceil(data.total_count / 10) : 1;
  const canNextPage = currentPage < totalPages;
  const canPreviousPage = currentPage > 1;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Your Stay in Libya</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {data ? `${data.total_count} properties found` : 'Searching properties...'}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0">
                <button
                  onClick={() => setMapViewActive(!mapViewActive)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {mapViewActive ? 'List View' : 'Map View'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <div className="w-full lg:w-1/4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Reset all
                  </button>
                </div>

                {/* Location filter */}
                <div className="mb-6">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="City or neighborhood"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Guest count filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <select
                    value={filters.guest_count || ''}
                    onChange={(e) => handleFilterChange('guest_count', e.target.value ? parseInt(e.target.value) : null)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Any number</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Price range filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per night (LYD)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.price_min || ''}
                        onChange={(e) => handleFilterChange('price_min', e.target.value ? parseFloat(e.target.value) : null)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.price_max || ''}
                        onChange={(e) => handleFilterChange('price_max', e.target.value ? parseFloat(e.target.value) : null)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Property type filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property type
                  </label>
                  <div className="space-y-2">
                    {['entire_place', 'private_room', 'shared_room'].map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          id={`type-${type}`}
                          name="property-type"
                          type="checkbox"
                          checked={filters.property_type === type}
                          onChange={() => togglePropertyType(type)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="ml-3 text-sm text-gray-700 capitalize"
                        >
                          {type.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {[
                      'wifi', 'ac', 'kitchen', 'parking', 'laundry', 'tv', 
                      'pool', 'gym', 'generator_power_backup', 'water_tank'
                    ].map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          id={`amenity-${amenity}`}
                          name={`amenity-${amenity}`}
                          type="checkbox"
                          checked={filters.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`amenity-${amenity}`}
                          className="ml-3 text-sm text-gray-700 capitalize"
                        >
                          {amenity.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant book filter */}
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      id="instant-book"
                      name="instant-book"
                      type="checkbox"
                      checked={filters.instant_book === true}
                      onChange={(e) => handleFilterChange('instant_book', e.target.checked ? true : null)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="instant-book"
                      className="ml-3 text-sm text-gray-700"
                    >
                      Instant book
                    </label>
                  </div>
                </div>

                {/* Sort by filter */}
                <div>
                  <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort by
                  </label>
                  <select
                    id="sort-by"
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="created_at">Newest</option>
                    <option value="price_low_to_high">Price: Low to High</option>
                    <option value="price_high_to_low">Price: High to Low</option>
                    <option value="rating_high_to_low">Rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results area */}
            <div className="w-full lg:w-3/4">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error loading properties
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              {error instanceof Error ? error.message : 'An error occurred while loading properties'}
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => refetch()}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      </div>
                </div>
              ) : mapViewActive ? (
                // Map view placeholder
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Map View Coming Soon</h3>
                  <p className="mt-1 text-gray-500">
                    Interactive map view with property markers will be available in a future update.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setMapViewActive(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back to List View
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Property grid */}
                  {data && data.properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.properties.map((property) => (
                        <Link 
                          key={property.property_id} 
                          to={`/properties/${property.property_id}`}
                          className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300"
                        >
                          {/* Property image placeholder */}
                          <div className="bg-gray-200 border-2 border-dashed rounded-t-lg w-full h-48 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 truncate">{property.title}</h3>
                                <p className="text-sm text-gray-500">{property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}</p>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-900">4.85</span>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span>{property.guest_capacity} guests</span>
                              <span className="mx-2">•</span>
                              <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                              <span className="mx-2">•</span>
                              <span>{property.bathrooms} bath</span>
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-1">
                              {property.has_power_backup && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Power Backup
                                </span>
                              )}
                              {property.has_water_tank && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Water Tank
                                </span>
                              )}
                              {property.instant_book && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Instant Book
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-semibold text-gray-900">{property.base_price_per_night} LYD <span className="text-sm font-normal text-gray-500">night</span></p>
                              </div>
                              <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                View Details
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No properties found</h3>
                      <p className="mt-1 text-gray-500">
                        Try adjusting your search filters to find more properties.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={resetFilters}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reset all filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {data && data.total_count > 10 && (
                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!canPreviousPage}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            canPreviousPage
                              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              : 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={!canNextPage}
                          className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            canNextPage
                              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              : 'text-gray-300 bg-gray-100 border border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * 10, data.total_count)}
                            </span>{' '}
                            of <span className="font-medium">{data.total_count}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={!canPreviousPage}
                              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                                canPreviousPage
                                  ? 'text-gray-400 bg-white border border-gray-300 hover:bg-gray-50'
                                  : 'text-gray-200 bg-gray-100 border border-gray-200 cursor-not-allowed'
                              }`}
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  aria-current={pageNum === currentPage ? 'page' : undefined}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    pageNum === currentPage
                                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={!canNextPage}
                              className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                                canNextPage
                                  ? 'text-gray-400 bg-white border border-gray-300 hover:bg-gray-50'
                                  : 'text-gray-200 bg-gray-100 border border-gray-200 cursor-not-allowed'
                              }`}
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_SearchResults;