import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Zod schema derived TypeScript interfaces
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

interface UpdatePropertyInput {
  property_id: string;
  title?: string;
  description?: string;
  city?: string;
  neighborhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  property_type?: string;
  guest_capacity?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string | null;
  base_price_per_night?: number;
  currency?: string;
  has_power_backup?: boolean;
  has_water_tank?: boolean;
  house_rules?: string | null;
  cancellation_policy?: string;
  instant_book?: boolean;
  is_active?: boolean;
}

const UV_EditListing: React.FC = () => {
  // URL parameters
  const { listing_id } = useParams<{ listing_id: string }>();
  const navigate = useNavigate();
  
  // Store state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Component state
  const [editingValues, setEditingValues] = useState<Partial<Property>>({});
  const [photoOperations, setPhotoOperations] = useState<Array<{
    type: 'add' | 'remove' | 'reorder';
    photo?: PropertyPhoto;
    index?: number;
    tempId?: string;
    file?: File;
  }>>([]);
  const [tempPhotos, setTempPhotos] = useState<Array<{ id: string; file: File; url: string }>>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Libya-specific cities
  const libyanCities = [
    "Tripoli", "Benghazi", "Misrata", "Tobruk", "Derna", "Zliten", "Zuwara", 
    "Khoms", "Sirte", "Al-Bayda", "Tajura", "Sabha", "Al-Marj", "Ghat", 
    "Murzuq", "Waddan", "Jalu", "Jaghbub"
  ];
  
  // Fetch property data
  const { data: propertyData, isLoading, isError } = useQuery<Property>({
    queryKey: ['property', listing_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    enabled: !!listing_id && !!authToken,
  });
  
  // Fetch property photos
  const { data: propertyPhotos = [], refetch: refetchPhotos } = useQuery<PropertyPhoto[]>({
    queryKey: ['property-photos', listing_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}/photos`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    enabled: !!listing_id && !!authToken,
  });
  
  // Initialize editing values when property data loads
  useEffect(() => {
    if (propertyData) {
      setEditingValues({ ...propertyData });
      setUnsavedChanges(false);
    }
  }, [propertyData]);
  
  // Detect unsaved changes
  useEffect(() => {
    if (propertyData) {
      const hasChanges = JSON.stringify(editingValues) !== JSON.stringify(propertyData) || 
                         photoOperations.length > 0;
      setUnsavedChanges(hasChanges);
    }
  }, [editingValues, photoOperations, propertyData]);
  
  // Handle input changes
  const handleInputChange = (field: keyof Property, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
    setError(null);
  };
  
  // Handle photo uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPhotos = files.map(file => {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        return {
          id: tempId,
          file,
          url: URL.createObjectURL(file)
        };
      });
      
      setTempPhotos(prev => [...prev, ...newPhotos]);
      
      // Add to photo operations queue
      const operations = files.map((file, index) => ({
        type: 'add' as const,
        tempId: newPhotos[index].id,
        file
      }));
      
      setPhotoOperations(prev => [...prev, ...operations]);
    }
    e.target.value = ''; // Reset input
  };
  
  // Remove photo
  const handleRemovePhoto = (photo: PropertyPhoto | { id: string }) => {
    if ('photo_id' in photo) {
      // Existing photo
      setPhotoOperations(prev => [...prev, { type: 'remove', photo }]);
    } else {
      // Temp photo
      setTempPhotos(prev => prev.filter(p => p.id !== photo.id));
      setPhotoOperations(prev => prev.filter(op => op.tempId !== photo.id));
    }
  };
  
  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (data: UpdatePropertyInput) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        data,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', listing_id] });
      setSuccess('Listing updated successfully!');
      setUnsavedChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update listing');
    }
  });
  
  // Handle save changes
  const handleSaveChanges = async () => {
    if (!editingValues || !listing_id) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      // Update property details
      const updateData: UpdatePropertyInput = {
        property_id: listing_id,
        ...editingValues
      };
      
      // Remove unchanged fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'property_id' && 
            JSON.stringify(updateData[key as keyof UpdatePropertyInput]) === 
            JSON.stringify(propertyData?.[key as keyof Property])) {
          delete updateData[key as keyof UpdatePropertyInput];
        }
      });
      
      if (Object.keys(updateData).length > 1) { // More than just property_id
        await updatePropertyMutation.mutateAsync(updateData);
      }
      
      // Handle photo operations
      for (const operation of photoOperations) {
        if (operation.type === 'add' && operation.file) {
          // Upload file first
          const formData = new FormData();
          formData.append('file', operation.file);
          
          // Simulate file upload to get URL (in real app, this would be a separate endpoint)
          const photoUrl = URL.createObjectURL(operation.file);
          
          // Then add photo to property
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}/photos`,
            {
              property_id: listing_id,
              photo_url: photoUrl,
              display_order: propertyPhotos.length + tempPhotos.length
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } 
        else if (operation.type === 'remove' && operation.photo) {
          await axios.delete(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}/photos/${operation.photo.photo_id}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        }
      }
      
      // Reset photo operations
      setPhotoOperations([]);
      setTempPhotos([]);
      
      // Refetch photos
      refetchPhotos();
      
      setSuccess('All changes saved successfully!');
      setUnsavedChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    }
  };
  
  // Handle delete listing
  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        { property_id: listing_id, is_active: false },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      navigate('/dashboard/listings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete listing');
    }
  };
  
  // Handle toggle listing status
  const handleToggleStatus = async () => {
    if (!propertyData) return;
    
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        { 
          property_id: listing_id, 
          is_active: !propertyData.is_active 
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      queryClient.invalidateQueries({ queryKey: ['property', listing_id] });
      setSuccess(`Listing ${!propertyData.is_active ? 'published' : 'unpublished'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update listing status');
    }
  };
  
  // Check authentication and ownership
  if (!authToken || !currentUser) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to edit your listing.</p>
            <Link 
              to="/login" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }
  
  // Error state
  if (isError || !propertyData) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Listing</h2>
            <p className="text-gray-600 mb-6">We couldn't find the listing you're trying to edit.</p>
            <Link 
              to="/dashboard/listings" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Back to My Listings
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  // Check ownership
  if (propertyData.host_id !== currentUser.user_id) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to edit this listing.</p>
            <Link 
              to="/dashboard/listings" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Back to My Listings
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  // Combine existing photos and temp photos for display
  const allPhotos = [
    ...propertyPhotos.map(photo => ({ ...photo, temp: false })),
    ...tempPhotos.map(temp => ({ 
      photo_id: temp.id, 
      property_id: listing_id || '', 
      photo_url: temp.url, 
      caption: null, 
      display_order: propertyPhotos.length, 
      created_at: new Date().toISOString(),
      temp: true 
    }))
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
                <p className="mt-2 text-gray-600">
                  Make changes to your property listing below
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/dashboard/listings')}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`${
                    propertyData.is_active 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white px-4 py-2 rounded-md font-medium transition-colors`}
                >
                  {propertyData.is_active ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!unsavedChanges || updatePropertyMutation.isPending}
                  className={`${
                    unsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-400 cursor-not-allowed'
                  } text-white px-4 py-2 rounded-md font-medium transition-colors`}
                >
                  {updatePropertyMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <p>{success}</p>
              </div>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Form Sections */}
            <div className="divide-y divide-gray-200">
              {/* Basic Information */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={editingValues.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Beautiful apartment in central Tripoli"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      id="property_type"
                      value={editingValues.property_type || ''}
                      onChange={(e) => handleInputChange('property_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select property type</option>
                      <option value="entire_place">Entire Place</option>
                      <option value="private_room">Private Room</option>
                      <option value="shared_room">Shared Room</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={editingValues.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your property in detail..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <select
                      id="city"
                      value={editingValues.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a city</option>
                      {libyanCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                      Neighborhood
                    </label>
                    <input
                      type="text"
                      id="neighborhood"
                      value={editingValues.neighborhood || ''}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional neighborhood"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={editingValues.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>
              
              {/* Accommodation Details */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Accommodation Details</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <label htmlFor="guest_capacity" className="block text-sm font-medium text-gray-700 mb-1">
                      Guests
                    </label>
                    <input
                      type="number"
                      id="guest_capacity"
                      min="1"
                      value={editingValues.guest_capacity || 1}
                      onChange={(e) => handleInputChange('guest_capacity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      id="bedrooms"
                      min="0"
                      value={editingValues.bedrooms || 0}
                      onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
                      Beds
                    </label>
                    <input
                      type="number"
                      id="beds"
                      min="1"
                      value={editingValues.beds || 1}
                      onChange={(e) => handleInputChange('beds', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      id="bathrooms"
                      min="1"
                      step="0.5"
                      value={editingValues.bathrooms || 1}
                      onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Amenities */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex items-center">
                    <input
                      id="has_power_backup"
                      type="checkbox"
                      checked={editingValues.has_power_backup || false}
                      onChange={(e) => handleInputChange('has_power_backup', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="has_power_backup" className="ml-2 block text-sm text-gray-900">
                      Generator Power Backup
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="has_water_tank"
                      type="checkbox"
                      checked={editingValues.has_water_tank || false}
                      onChange={(e) => handleInputChange('has_water_tank', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="has_water_tank" className="ml-2 block text-sm text-gray-900">
                      Water Tank/Stable Supply
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="wifi"
                      type="checkbox"
                      checked={editingValues.amenities?.includes('WiFi') || false}
                      onChange={(e) => {
                        const amenities = editingValues.amenities || '';
                        const newAmenities = e.target.checked 
                          ? `${amenities}${amenities ? ',' : ''}WiFi` 
                          : amenities.replace(/WiFi,?/g, '').replace(/^,|,$/g, '');
                        handleInputChange('amenities', newAmenities);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="wifi" className="ml-2 block text-sm text-gray-900">
                      WiFi
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="ac"
                      type="checkbox"
                      checked={editingValues.amenities?.includes('Air Conditioning') || false}
                      onChange={(e) => {
                        const amenities = editingValues.amenities || '';
                        const newAmenities = e.target.checked 
                          ? `${amenities}${amenities ? ',' : ''}Air Conditioning` 
                          : amenities.replace(/Air Conditioning,?/g, '').replace(/^,|,$/g, '');
                        handleInputChange('amenities', newAmenities);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="ac" className="ml-2 block text-sm text-gray-900">
                      Air Conditioning
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="kitchen"
                      type="checkbox"
                      checked={editingValues.amenities?.includes('Kitchen') || false}
                      onChange={(e) => {
                        const amenities = editingValues.amenities || '';
                        const newAmenities = e.target.checked 
                          ? `${amenities}${amenities ? ',' : ''}Kitchen` 
                          : amenities.replace(/Kitchen,?/g, '').replace(/^,|,$/g, '');
                        handleInputChange('amenities', newAmenities);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="kitchen" className="ml-2 block text-sm text-gray-900">
                      Kitchen
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="parking"
                      type="checkbox"
                      checked={editingValues.amenities?.includes('Parking') || false}
                      onChange={(e) => {
                        const amenities = editingValues.amenities || '';
                        const newAmenities = e.target.checked 
                          ? `${amenities}${amenities ? ',' : ''}Parking` 
                          : amenities.replace(/Parking,?/g, '').replace(/^,|,$/g, '');
                        handleInputChange('amenities', newAmenities);
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="parking" className="ml-2 block text-sm text-gray-900">
                      Parking
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Photos */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Photos
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="photo-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="photo-upload"
                            name="photo-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                
                {allPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allPhotos.map((photo) => (
                      <div key={photo.photo_id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt="Property"
                          className="h-32 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.temp ? { id: photo.photo_id } : photo as PropertyPhoto)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Pricing */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label htmlFor="base_price_per_night" className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price per Night (LYD)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="base_price_per_night"
                        min="0"
                        step="0.01"
                        value={editingValues.base_price_per_night || 0}
                        onChange={(e) => handleInputChange('base_price_per_night', parseFloat(e.target.value))}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">LYD</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="cancellation_policy" className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellation Policy
                    </label>
                    <select
                      id="cancellation_policy"
                      value={editingValues.cancellation_policy || 'moderate'}
                      onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="flexible">Flexible (Free cancellation up to 24 hours)</option>
                      <option value="moderate">Moderate (Free cancellation up to 7 days)</option>
                      <option value="strict">Strict (Non-refundable)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center pt-6">
                    <input
                      id="instant_book"
                      type="checkbox"
                      checked={editingValues.instant_book || false}
                      onChange={(e) => handleInputChange('instant_book', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="instant_book" className="ml-2 block text-sm text-gray-900">
                      Enable Instant Booking
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between">
              <button
                onClick={handleDeleteListing}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Delete Listing
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/dashboard/listings')}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!unsavedChanges || updatePropertyMutation.isPending}
                  className={`${
                    unsavedChanges 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-400 cursor-not-allowed'
                  } text-white px-4 py-2 rounded-md font-medium transition-colors`}
                >
                  {updatePropertyMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_EditListing;