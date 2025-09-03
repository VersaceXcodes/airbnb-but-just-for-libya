import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
// Removed unused imports

// Libya-specific cities
const LIBYAN_CITIES = [
  "Tripoli", "Benghazi", "Misrata", "Tobruk", "Derna", 
  "Zliten", "Zuwara", "Khoms", "Sirte", "Al-Bayda", "Tajura"
];

// Amenities with Libya-specific options
const AMENITIES = [
  { id: 'wifi', name: 'WiFi', category: 'Essentials' },
  { id: 'ac', name: 'Air Conditioning', category: 'Comfort' },
  { id: 'kitchen', name: 'Kitchen', category: 'Essentials' },
  { id: 'parking', name: 'Parking', category: 'Essentials' },
  { id: 'washer', name: 'Washer', category: 'Essentials' },
  { id: 'tv', name: 'TV', category: 'Entertainment' },
  { id: 'pool', name: 'Pool', category: 'Luxury' },
  { id: 'gym', name: 'Gym', category: 'Luxury' },
  { id: 'power_backup', name: 'Generator Power Backup', category: 'Libya-Specific' },
  { id: 'water_tank', name: 'Water Tank/Stable Supply', category: 'Libya-Specific' },
  { id: 'balcony', name: 'Balcony/Patio', category: 'Comfort' },
  { id: 'heating', name: 'Heating', category: 'Comfort' },
];

// Cancellation policies
const CANCELLATION_POLICIES = [
  { id: 'flexible', name: 'Flexible', description: 'Full refund 24 hours prior to arrival' },
  { id: 'moderate', name: 'Moderate', description: 'Full refund 7 days prior to arrival' },
  { id: 'strict', name: 'Strict', description: 'Non-refundable' },
];

const UV_CreateListing: React.FC = () => {
  // Authentication state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Navigation
  const navigate = useNavigate();

  // Local component state
  const [currentStep, setCurrentStep] = useState(1);
  const [listingData, setListingData] = useState({
    host_id: currentUser?.user_id || '',
    title: '',
    description: '',
    city: '',
    neighborhood: '',
    address: '',
    property_type: '',
    guest_capacity: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [] as string[],
    base_price_per_night: 0,
    currency: 'LYD',
    has_power_backup: false,
    has_water_tank: false,
    house_rules: '',
    cancellation_policy: 'moderate',
    instant_book: false,
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser || !authToken) {
      navigate('/login');
    } else {
      setListingData(prev => ({
        ...prev,
        host_id: currentUser.user_id
      }));
    }
  }, [currentUser, authToken, navigate]);

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      
      setPhotos(prev => [...prev, ...files]);
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.photos;
        return newErrors;
      });
    }
  };

  // Remove a photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setListingData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setListingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle amenity selection
  const toggleAmenity = (amenityId: string) => {
    setListingData(prev => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenityId);
      
      if (index > -1) {
        amenities.splice(index, 1);
      } else {
        amenities.push(amenityId);
      }
      
      return {
        ...prev,
        amenities
      };
    });
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Basic Information
        if (!listingData.title.trim()) {
          errors.title = 'Title is required';
        }
        if (listingData.title.length < 10) {
          errors.title = 'Title must be at least 10 characters';
        }
        if (!listingData.description.trim()) {
          errors.description = 'Description is required';
        }
        if (listingData.description.length < 50) {
          errors.description = 'Description must be at least 50 characters';
        }
        if (!listingData.property_type) {
          errors.property_type = 'Property type is required';
        }
        break;
        
      case 2: // Location Details
        if (!listingData.city) {
          errors.city = 'City is required';
        }
        if (!listingData.address.trim()) {
          errors.address = 'Address is required';
        }
        break;
        
      case 3: // Accommodation Specs
        if (listingData.guest_capacity < 1) {
          errors.guest_capacity = 'At least 1 guest required';
        }
        if (listingData.bedrooms < 0) {
          errors.bedrooms = 'Number of bedrooms cannot be negative';
        }
        if (listingData.beds < 1) {
          errors.beds = 'At least 1 bed required';
        }
        if (listingData.bathrooms < 1) {
          errors.bathrooms = 'At least 1 bathroom required';
        }
        break;
        
      case 4: // Amenities
        // No specific validation needed
        break;
        
      case 5: // Photos
        if (photos.length < 5) {
          errors.photos = 'At least 5 photos are required';
        }
        break;
        
      case 6: // Pricing
        if (listingData.base_price_per_night <= 0) {
          errors.base_price_per_night = 'Price must be greater than 0';
        }
        break;
        
      case 7: // Availability
        // No specific validation needed for this step in creation
        break;
        
      case 8: // House Rules & Policies
        // No specific validation needed
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 8));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Submit property listing
  const createPropertyMutation = useMutation({
    mutationFn: async (data: typeof listingData) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // In a real implementation, we would upload photos here
      // For now, we'll just navigate to the dashboard
      navigate('/dashboard/listings');
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || 'Failed to create listing. Please try again.');
      setIsSubmitting(false);
    }
  });

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Prepare data for submission
      const submissionData = {
        ...listingData,
        amenities: listingData.amenities.join(','),
        latitude: null,
        longitude: null,
        house_rules: listingData.house_rules || null,
        neighborhood: listingData.neighborhood || '',
        address: listingData.address || ''
      };
      
      createPropertyMutation.mutate(submissionData);
    }
  };

  // Calculate service fee (10% of nightly rate)
  const serviceFee = (listingData.base_price_per_night * 0.1).toFixed(2);
  const totalPrice = (listingData.base_price_per_night + parseFloat(serviceFee)).toFixed(2);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            {/* Progress indicator */}
            <div className="px-6 pt-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Listing</h1>
              <p className="text-gray-600 mb-6">Follow the steps to list your property</p>
              
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                    <div 
                      key={step} 
                      className={`flex flex-col items-center w-1/${8} ${step <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        step === currentStep 
                          ? 'bg-blue-600 text-white' 
                          : step < currentStep 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200'
                      }`}>
                        {step < currentStep ? '✓' : step}
                      </div>
                      <span className="text-xs text-center">
                        {step === 1 && 'Basic Info'}
                        {step === 2 && 'Location'}
                        {step === 3 && 'Specs'}
                        {step === 4 && 'Amenities'}
                        {step === 5 && 'Photos'}
                        {step === 6 && 'Pricing'}
                        {step === 7 && 'Availability'}
                        {step === 8 && 'Rules'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(currentStep / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Form content */}
            <div className="px-6 py-6 border-t border-gray-200">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={listingData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.title ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Beautiful apartment in downtown Tripoli"
                      />
                      {validationErrors.title && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Create a descriptive title that highlights your property's best features
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={listingData.description}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.description ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Describe your property in detail. Mention what makes it special for travelers in Libya..."
                      />
                      {validationErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Include details about the space, neighborhood, and what guests will love
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Property Type *
                      </label>
                      <select
                        id="property_type"
                        name="property_type"
                        value={listingData.property_type}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.property_type ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select property type</option>
                        <option value="entire_place">Entire Place</option>
                        <option value="private_room">Private Room</option>
                        <option value="shared_room">Shared Room</option>
                      </select>
                      {validationErrors.property_type && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.property_type}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Location Details */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Location Details</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        id="city"
                        name="city"
                        value={listingData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.city ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select a city</option>
                        {LIBYAN_CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {validationErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                        Neighborhood
                      </label>
                      <input
                        type="text"
                        id="neighborhood"
                        name="neighborhood"
                        value={listingData.neighborhood}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Al-Sabah, Souq Al-Juma"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        rows={3}
                        value={listingData.address}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.address ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Enter the full address with nearby landmarks if needed"
                      />
                      {validationErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        For areas with inconsistent addressing, include nearby landmarks
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Accommodation Specifications */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Accommodation Specifications</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="guest_capacity" className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Guests *
                      </label>
                      <input
                        type="number"
                        id="guest_capacity"
                        name="guest_capacity"
                        min="1"
                        value={listingData.guest_capacity}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.guest_capacity ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {validationErrors.guest_capacity && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.guest_capacity}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        id="bedrooms"
                        name="bedrooms"
                        min="0"
                        value={listingData.bedrooms}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.bedrooms ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {validationErrors.bedrooms && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.bedrooms}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">
                        Beds *
                      </label>
                      <input
                        type="number"
                        id="beds"
                        name="beds"
                        min="1"
                        value={listingData.beds}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.beds ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {validationErrors.beds && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.beds}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                        Bathrooms *
                      </label>
                      <input
                        type="number"
                        id="bathrooms"
                        name="bathrooms"
                        min="1"
                        step="0.5"
                        value={listingData.bathrooms}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          validationErrors.bathrooms ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {validationErrors.bathrooms && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.bathrooms}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> For Libya-specific accommodations, describe unique features like 
                      rooftop spaces, traditional architecture, or local decor that make your listing special.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 4: Amenities */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Amenities</h2>
                  <p className="text-gray-600 mb-6">
                    Select all amenities available at your property. This helps guests find exactly what they need.
                  </p>
                  
                  <div className="space-y-6">
                    {Array.from(new Set(AMENITIES.map(a => a.category))).map(category => (
                      <div key={category}>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {AMENITIES.filter(a => a.category === category).map(amenity => (
                            <div 
                              key={amenity.id}
                              className={`flex items-center p-3 border rounded-md cursor-pointer ${
                                listingData.amenities.includes(amenity.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => toggleAmenity(amenity.id)}
                            >
                              <input
                                type="checkbox"
                                checked={listingData.amenities.includes(amenity.id)}
                                onChange={() => toggleAmenity(amenity.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-sm text-gray-700">{amenity.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 5: Photo Upload */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Photo Upload</h2>
                  <p className="text-gray-600 mb-6">
                    Add clear photos of your property. Upload at least 5 photos for best results.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Photos *
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
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
                              htmlFor="photos"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload files</span>
                              <input
                                id="photos"
                                name="photos"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                      {validationErrors.photos && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.photos}</p>
                      )}
                    </div>
                    
                    {photoPreviews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="h-32 w-full object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {photos.length >= 5 && (
                      <div className="p-4 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                          <strong>Great!</strong> You've uploaded {photos.length} photos. This meets the minimum requirement.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 6: Pricing */}
              {currentStep === 6 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="base_price_per_night" className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price per Night (LYD) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">LYD</span>
                        </div>
                        <input
                          type="number"
                          id="base_price_per_night"
                          name="base_price_per_night"
                          min="0"
                          step="0.5"
                          value={listingData.base_price_per_night}
                          onChange={handleInputChange}
                          className={`pl-12 w-full px-3 py-2 border rounded-md ${
                            validationErrors.base_price_per_night ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      {validationErrors.base_price_per_night && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.base_price_per_night}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        This is the nightly rate before service fees
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Price Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Price:</span>
                          <span className="font-medium">
                            LYD {listingData.base_price_per_night.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Fee (10%):</span>
                          <span className="font-medium">LYD {serviceFee}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-medium">Total per night:</span>
                          <span className="font-bold text-lg">LYD {totalPrice}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Discounts</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Coming soon: Offer weekly or monthly discounts to attract longer stays
                      </p>
                      <button 
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled
                      >
                        Add Discount
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 7: Availability */}
              {currentStep === 7 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability Calendar</h2>
                  <p className="text-gray-600 mb-6">
                    Set when your property is available for bookings. You can adjust this later.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> For now, your property will be available by default. 
                      You can set specific dates in the property management section after creation.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() + index);
                      const isAvailable = true; // Default to available
                      
                      return (
                        <div
                          key={index}
                          className={`h-12 flex items-center justify-center text-sm rounded-md ${
                            isAvailable 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 flex items-center">
                    <div className="flex items-center mr-6">
                      <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-md mr-2"></div>
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 rounded-md mr-2"></div>
                      <span className="text-sm text-gray-600">Unavailable</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 8: House Rules & Policies */}
              {currentStep === 8 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">House Rules & Policies</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="house_rules" className="block text-sm font-medium text-gray-700 mb-1">
                        House Rules
                      </label>
                      <textarea
                        id="house_rules"
                        name="house_rules"
                        rows={4}
                        value={listingData.house_rules}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="List any specific rules for your guests (e.g., no smoking, no pets, quiet hours)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Policy *
                      </label>
                      <div className="space-y-3">
                        {CANCELLATION_POLICIES.map(policy => (
                          <div 
                            key={policy.id}
                            className={`p-4 border rounded-md cursor-pointer ${
                              listingData.cancellation_policy === policy.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setListingData(prev => ({
                              ...prev,
                              cancellation_policy: policy.id
                            }))}
                          >
                            <div className="flex items-start">
                              <input
                                type="radio"
                                name="cancellation_policy"
                                value={policy.id}
                                checked={listingData.cancellation_policy === policy.id}
                                onChange={handleInputChange}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <span className="block text-sm font-medium text-gray-900">
                                  {policy.name}
                                </span>
                                <span className="block text-sm text-gray-500">
                                  {policy.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="instant_book"
                          name="instant_book"
                          type="checkbox"
                          checked={listingData.instant_book}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="instant_book" className="font-medium text-gray-700">
                          Enable instant booking
                        </label>
                        <p className="text-gray-500">
                          Allow guests to book without your approval (recommended for better conversion)
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> By submitting this listing, you confirm that you have the right 
                        to rent this property and that it complies with all local laws and regulations in Libya.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
                
                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Listing...
                      </span>
                    ) : (
                      'Create Listing'
                    )}
                  </button>
                )}
              </div>
              
              {/* Error message */}
              {submitError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">{submitError}</p>
                </div>
              )}
              
              {/* Success message */}
              {createPropertyMutation.isSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p className="text-sm">
                    Your listing has been created successfully! 
                    You'll be redirected to your listings dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              to="/dashboard/listings" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Listings Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_CreateListing;