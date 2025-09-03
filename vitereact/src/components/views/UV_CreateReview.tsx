import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Zod schema derived TypeScript interfaces
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

interface ReviewInput {
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
}

interface ReviewPhoto {
  photo_id: string;
  review_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

interface Property {
  property_id: string;
  title: string;
  city: string;
  neighborhood: string | null;
}

interface User {
  user_id: string;
  name: string;
  profile_picture_url: string | null;
}

const UV_CreateReview: React.FC = () => {
  // Route params
  const { booking_id } = useParams<{ booking_id: string }>();
  const navigate = useNavigate();
  
  // Global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state
  const [ratingValues, setRatingValues] = useState({
    cleanliness_rating: 0,
    accuracy_rating: 0,
    communication_rating: 0,
    location_rating: 0,
    check_in_rating: 0,
    value_rating: 0,
    overall_rating: 0
  });
  
  const [reviewText, setReviewText] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Query client
  const queryClient = useQueryClient();
  
  // Fetch booking details
  const { data: booking, isLoading: isBookingLoading, error: bookingError } = useQuery<Booking>({
    queryKey: ['booking', booking_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${booking_id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!booking_id && !!authToken
  });
  
  // Fetch property details
  const { data: property } = useQuery<Property>({
    queryKey: ['property', booking?.property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${booking?.property_id}`
      );
      return response.data;
    },
    enabled: !!booking?.property_id
  });
  
  // Fetch host details
  const { data: host } = useQuery<User>({
    queryKey: ['host', booking?.host_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${booking?.host_id}`
      );
      return response.data;
    },
    enabled: !!booking?.host_id
  });
  
  // Validate review eligibility
  useEffect(() => {
    if (booking && currentUser) {
      const today = new Date();
      const checkOutDate = new Date(booking.check_out);
      const isEligible = 
        booking.guest_id === currentUser.user_id && 
        booking.status === 'completed' && 
        today > checkOutDate;
      
      if (!isEligible) {
        navigate('/dashboard/bookings');
      }
    }
  }, [booking, currentUser, navigate]);
  
  // Handle photo uploads
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.slice(0, 5 - uploadedPhotos.length);
      
      setUploadedPhotos(prev => [...prev, ...newFiles]);
      
      // Create previews
      const previews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...previews]);
    }
  };
  
  // Remove photo
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calculate overall rating
  useEffect(() => {
    const ratings = [
      ratingValues.cleanliness_rating,
      ratingValues.accuracy_rating,
      ratingValues.communication_rating,
      ratingValues.location_rating,
      ratingValues.check_in_rating,
      ratingValues.value_rating
    ];
    
    const validRatings = ratings.filter(rating => rating > 0);
    const overall = validRatings.length > 0 
      ? Math.round(validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length)
      : 0;
      
    setRatingValues(prev => ({
      ...prev,
      overall_rating: overall
    }));
  }, [
    ratingValues.cleanliness_rating,
    ratingValues.accuracy_rating,
    ratingValues.communication_rating,
    ratingValues.location_rating,
    ratingValues.check_in_rating,
    ratingValues.value_rating
  ]);
  
  // Upload photo to server
  const uploadPhoto = async (file: File, reviewId: string): Promise<string> => {
    // In a real app, this would upload to a file storage service
    // For now, we'll create a mock URL
    return URL.createObjectURL(file);
  };
  
  // Create review photo record
  const createReviewPhoto = async (photoUrl: string, reviewId: string) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/review-photos`,
      {
        review_id: reviewId,
        photo_url: photoUrl,
        caption: null
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  };
  
  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewInput) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${booking_id}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      // Upload photos if any
      if (uploadedPhotos.length > 0) {
        try {
          for (const photo of uploadedPhotos) {
            const photoUrl = await uploadPhoto(photo, data.review_id);
            await createReviewPhoto(photoUrl, data.review_id);
          }
        } catch (error) {
          console.error('Error uploading photos:', error);
          // We don't fail the entire review if photos fail
        }
      }
      
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || 'Failed to submit review');
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validate all ratings are provided
    const requiredRatings = [
      ratingValues.cleanliness_rating,
      ratingValues.accuracy_rating,
      ratingValues.communication_rating,
      ratingValues.location_rating,
      ratingValues.check_in_rating,
      ratingValues.value_rating
    ];
    
    if (requiredRatings.some(rating => rating === 0)) {
      setSubmitError('Please provide ratings for all categories');
      return;
    }
    
    if (!booking || !currentUser) {
      setSubmitError('Booking or user information missing');
      return;
    }
    
    const reviewData: ReviewInput = {
      booking_id: booking.booking_id,
      property_id: booking.property_id,
      reviewer_id: currentUser.user_id,
      host_id: booking.host_id,
      cleanliness_rating: ratingValues.cleanliness_rating,
      accuracy_rating: ratingValues.accuracy_rating,
      communication_rating: ratingValues.communication_rating,
      location_rating: ratingValues.location_rating,
      check_in_rating: ratingValues.check_in_rating,
      value_rating: ratingValues.value_rating,
      overall_rating: ratingValues.overall_rating,
      comment: reviewText || null
    };
    
    submitReviewMutation.mutate(reviewData);
  };
  
  // Render star rating input
  const renderStarRating = (
    category: string, 
    value: number, 
    onChange: (value: number) => void
  ) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {category}
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="text-2xl focus:outline-none"
              aria-label={`Rate ${star} out of 5 stars`}
            >
              {star <= value ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-gray-300">☆</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Show loading state
  if (isBookingLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Show error state
  if (bookingError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Booking</h2>
                <p className="text-gray-600 mb-4">
                  We couldn't load the booking information. Please try again later.
                </p>
                <Link 
                  to="/dashboard/bookings" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Show success state
  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-green-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for sharing your experience. Your review helps other travelers make informed decisions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/dashboard/bookings"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Bookings
                </Link>
                <Link
                  to={`/properties/${booking?.property_id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Property
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Main form
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Leave a Review</h1>
              <p className="mt-1 text-sm text-gray-500">
                Share your experience to help other travelers
              </p>
            </div>
            
            <div className="p-6">
              {/* Booking context */}
              {booking && property && host && (
                <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h2 className="text-lg font-medium text-gray-900">{property.title}</h2>
                  <p className="text-gray-600">
                    {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>
                      Stayed from {new Date(booking.check_in).toLocaleDateString()} to {new Date(booking.check_out).toLocaleDateString()}
                    </span>
                    <span className="mx-2">•</span>
                    <span>Hosted by {host.name}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Rating section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Rating</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderStarRating(
                      "Cleanliness", 
                      ratingValues.cleanliness_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, cleanliness_rating: value }))
                    )}
                    
                    {renderStarRating(
                      "Accuracy", 
                      ratingValues.accuracy_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, accuracy_rating: value }))
                    )}
                    
                    {renderStarRating(
                      "Communication", 
                      ratingValues.communication_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, communication_rating: value }))
                    )}
                    
                    {renderStarRating(
                      "Location", 
                      ratingValues.location_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, location_rating: value }))
                    )}
                    
                    {renderStarRating(
                      "Check-in", 
                      ratingValues.check_in_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, check_in_rating: value }))
                    )}
                    
                    {renderStarRating(
                      "Value", 
                      ratingValues.value_rating, 
                      (value) => setRatingValues(prev => ({ ...prev, value_rating: value }))
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-gray-700 mr-2">Overall Rating:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`text-2xl ${star <= ratingValues.overall_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="ml-2 text-gray-700">
                        {ratingValues.overall_rating > 0 ? `${ratingValues.overall_rating}/5` : 'Not rated'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Review text */}
                <div className="mb-8">
                  <label htmlFor="review" className="block text-lg font-medium text-gray-900 mb-2">
                    Your Review
                  </label>
                  <textarea
                    id="review"
                    rows={6}
                    value={reviewText}
                    onChange={(e) => {
                      setReviewText(e.target.value);
                      setSubmitError(null);
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
                    placeholder="Share details about your stay, what you liked, and any suggestions for improvement..."
                  />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>Helpful reviews include specific details about your stay</span>
                    <span>{reviewText.length}/1000 characters</span>
                  </div>
                </div>
                
                {/* Photo upload */}
                <div className="mb-8">
                  <label className="block text-lg font-medium text-gray-900 mb-2">
                    Photos (Optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload up to 5 photos from your stay
                  </p>
                  
                  <div className="mt-2 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                          <span>Upload a file</span>
                          <input
                            id="photo-upload"
                            name="photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            disabled={uploadedPhotos.length >= 5}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Photo previews */}
                  {photoPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove photo"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Error message */}
                {submitError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="text-sm">{submitError}</p>
                  </div>
                )}
                
                {/* Submit button */}
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <Link
                    to="/dashboard/bookings"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitReviewMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitReviewMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_CreateReview;