import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_Registration: React.FC = () => {
  const navigate = useNavigate();
  
  // Authentication state
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const registerUser = useAppStore(state => state.register_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);
  
  // Form state
  const [registrationType, setRegistrationType] = useState<'guest' | 'host' | 'both'>('guest');
  const [formValues, setFormValues] = useState({
    email: '',
    phone_number: '',
    password_hash: '',
    name: '',
    profile_picture_url: null as string | null,
    bio: null as string | null,
    emergency_contact_name: null as string | null,
    emergency_contact_phone: null as string | null,
  });
  const [verificationState, setVerificationState] = useState({
    email_verified: false,
    sms_verified: false,
    verification_code: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: null as string | null,
    phone_number: null as string | null,
    password_hash: null as string | null,
    name: null as string | null,
    verification_code: null as string | null,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [activeVerification, setActiveVerification] = useState<'email' | 'sms' | null>(null);
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState({
    terms_of_service: false,
    privacy_policy: false,
    libya_terms: false,
    content_guidelines: false,
    accommodation_laws: false,
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string | null> = {
      email: null,
      phone_number: null,
      password_hash: null,
      name: null,
      verification_code: null,
    };
    
    // Email validation
    if (!formValues.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = 'Email address is invalid';
    }
    
    // Phone validation
    if (!formValues.phone_number) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formValues.phone_number)) {
      errors.phone_number = 'Phone number is invalid';
    }
    
    // Password validation
    if (!formValues.password_hash) {
      errors.password_hash = 'Password is required';
    } else if (formValues.password_hash.length < 8) {
      errors.password_hash = 'Password must be at least 8 characters';
    }
    
    // Name validation
    if (!formValues.name) {
      errors.name = 'Full name is required';
    } else if (formValues.name.length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    
    setFormErrors(errors);
    
    // Check if all required fields are valid
    return !errors.email && !errors.phone_number && !errors.password_hash && !errors.name;
  };
  
  // Validate verification code
  const validateVerification = () => {
    if (!verificationState.verification_code) {
      setFormErrors(prev => ({ ...prev, verification_code: 'Verification code is required' }));
      return false;
    }
    
    if (verificationState.verification_code.length !== 6) {
      setFormErrors(prev => ({ ...prev, verification_code: 'Verification code must be 6 digits' }));
      return false;
    }
    
    setFormErrors(prev => ({ ...prev, verification_code: null }));
    return true;
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTermsAccepted(prev => ({ ...prev, [name]: checked }));
  };
  
  // Send verification code
  const sendVerificationCode = async (type: 'email' | 'sms') => {
    if (!validateForm()) return;
    
    setVerificationLoading(true);
    setActiveVerification(type);
    
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/send-verification`,
        {
          email: type === 'email' ? formValues.email : undefined,
          phone_number: type === 'sms' ? formValues.phone_number : undefined,
        }
      );
      
      setVerificationSent(true);
      setVerificationState(prev => ({ ...prev, verification_code: '' }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification code';
      setFormErrors(prev => ({ ...prev, [type === 'email' ? 'email' : 'phone_number']: errorMessage }));
    } finally {
      setVerificationLoading(false);
    }
  };
  
  // Verify code
  const verifyCode = async () => {
    if (!validateVerification()) return;
    
    // In a real app, we would make an API call to verify the code
    // For now, we'll just simulate verification
    setVerificationState(prev => ({
      ...prev,
      [activeVerification === 'email' ? 'email_verified' : 'sms_verified']: true,
    }));
    
    setActiveVerification(null);
    setVerificationSent(false);
  };
  
  // Handle registration submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    // Check if all terms are accepted
    const allTermsAccepted = Object.values(termsAccepted).every(Boolean);
    if (!allTermsAccepted) {
      alert('Please accept all terms and conditions');
      return;
    }
    
    // Check if email and SMS are verified
    if (!verificationState.email_verified || !verificationState.sms_verified) {
      alert('Please verify both your email and phone number');
      return;
    }
    
    setSubmitLoading(true);
    clearAuthError();
    
    try {
      await registerUser({
        email: formValues.email,
        phone_number: formValues.phone_number,
        password_hash: formValues.password_hash,
        name: formValues.name,
        profile_picture_url: formValues.profile_picture_url,
        bio: formValues.bio,
        emergency_contact_name: formValues.emergency_contact_name,
        emergency_contact_phone: formValues.emergency_contact_phone,
        role: registrationType === 'guest' ? 'traveler' : registrationType,
      });
      
      // Navigate to dashboard after successful registration
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Check if all terms are accepted
  const areAllTermsAccepted = Object.values(termsAccepted).every(Boolean);
  
  // Check if both email and SMS are verified
  const isFullyVerified = verificationState.email_verified && verificationState.sms_verified;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900">Create Your Account</h1>
            <p className="mt-2 text-gray-600">
              Join LibyaStay to start booking accommodations or hosting your property
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Registration Type Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">I want to</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setRegistrationType('guest')}
                    className={`p-4 border rounded-lg text-center ${
                      registrationType === 'guest'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">Book Stays</h3>
                    <p className="mt-1 text-sm text-gray-500">Find and book accommodations</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRegistrationType('host')}
                    className={`p-4 border rounded-lg text-center ${
                      registrationType === 'host'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">Host Guests</h3>
                    <p className="mt-1 text-sm text-gray-500">List your property</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRegistrationType('both')}
                    className={`p-4 border rounded-lg text-center ${
                      registrationType === 'both'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">Both</h3>
                    <p className="mt-1 text-sm text-gray-500">Book and host</p>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formValues.name}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleInputChange}
                        className={`flex-1 min-w-0 block w-full px-3 py-2 border ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        } rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => sendVerificationCode('email')}
                        disabled={verificationLoading || verificationState.email_verified}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
                      >
                        {verificationState.email_verified ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                    {verificationState.email_verified && (
                      <p className="mt-1 text-sm text-green-600">Email verified successfully</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formValues.phone_number}
                        onChange={handleInputChange}
                        className={`flex-1 min-w-0 block w-full px-3 py-2 border ${
                          formErrors.phone_number ? 'border-red-300' : 'border-gray-300'
                        } rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => sendVerificationCode('sms')}
                        disabled={verificationLoading || verificationState.sms_verified}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
                      >
                        {verificationState.sms_verified ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                    {formErrors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phone_number}</p>
                    )}
                    {verificationState.sms_verified && (
                      <p className="mt-1 text-sm text-green-600">Phone number verified successfully</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password_hash" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      id="password_hash"
                      name="password_hash"
                      type="password"
                      value={formValues.password_hash}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.password_hash ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {formErrors.password_hash && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password_hash}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Password must be at least 8 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Code Input */}
              {(verificationSent || verificationState.email_verified || verificationState.sms_verified) && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    Verify {activeVerification === 'email' ? 'Email' : 'Phone'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    We've sent a verification code to your {activeVerification === 'email' ? 'email' : 'phone'}. 
                    Please enter it below.
                  </p>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={verificationState.verification_code}
                      onChange={(e) => {
                        setVerificationState(prev => ({ ...prev, verification_code: e.target.value }));
                        if (formErrors.verification_code) {
                          setFormErrors(prev => ({ ...prev, verification_code: null }));
                        }
                      }}
                      maxLength={6}
                      className={`flex-1 px-3 py-2 border ${
                        formErrors.verification_code ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter 6-digit code"
                    />
                    <button
                      type="button"
                      onClick={verifyCode}
                      disabled={verificationLoading || verificationState.verification_code.length !== 6}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {verificationLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  
                  {formErrors.verification_code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.verification_code}</p>
                  )}
                  
                  <p className="mt-2 text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={() => sendVerificationCode(activeVerification || 'email')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}

              {/* Profile Setup */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Setup</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio (Optional)
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={formValues.bio || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Tell us about yourself in a few sentences
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                        Emergency Contact Name
                      </label>
                      <input
                        id="emergency_contact_name"
                        name="emergency_contact_name"
                        type="text"
                        value={formValues.emergency_contact_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                        Emergency Contact Phone
                      </label>
                      <input
                        id="emergency_contact_phone"
                        name="emergency_contact_phone"
                        type="tel"
                        value={formValues.emergency_contact_phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions</h2>
                <div className="space-y-3">
                  {Object.entries(termsAccepted).map(([key, value]) => (
                    <div key={key} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={key}
                          name={key}
                          type="checkbox"
                          checked={value}
                          onChange={handleCheckboxChange}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={key} className="font-medium text-gray-700">
                          {key === 'terms_of_service' && 'I agree to the Terms of Service'}
                          {key === 'privacy_policy' && 'I agree to the Privacy Policy'}
                          {key === 'libya_terms' && 'I agree to Libya-specific Terms of Service'}
                          {key === 'content_guidelines' && 'I agree to the Content Guidelines'}
                          {key === 'accommodation_laws' && 'I acknowledge the Local Accommodation Laws'}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Registration */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Or register with</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span className="ml-2">Google</span>
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="ml-2">Facebook</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={submitLoading || !isFullyVerified || !areAllTermsAccepted}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    submitLoading || !isFullyVerified || !areAllTermsAccepted
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {submitLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
                
                {!isFullyVerified && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    Please verify both your email and phone number
                  </p>
                )}
                
                {!areAllTermsAccepted && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    Please accept all terms and conditions
                  </p>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Registration;