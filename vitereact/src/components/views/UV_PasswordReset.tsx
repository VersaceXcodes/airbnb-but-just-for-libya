import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UV_PasswordReset: React.FC = () => {
  // State variables from FRD
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [resetCodeValid, setResetCodeValid] = useState(false);
  const [newPasswordValues, setNewPasswordValues] = useState({
    password_hash: '',
    confirm_password: ''
  });
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password_hash?: string;
    confirm_password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // URL parameters
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  

  // Validate token on component mount if present
  useEffect(() => {
    const validateToken = async () => {
      if (resetToken) {
        setIsLoading(true);
        try {
          // Using the implied validation endpoint since it's not in OpenAPI spec
          // but referenced in FRD data mapping
          await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/validate-reset-token`,
            { params: { token: resetToken } }
          );
          setResetCodeValid(true);
        } catch (error: any) {
          setFormErrors({
            general: error.response?.data?.message || 'Invalid or expired reset link'
          });
          setResetCodeValid(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    validateToken();
  }, [resetToken]);

  // Handle email submission for reset request
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});
    
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/request-password-reset`,
        { email }
      );
      setEmailSubmitted(true);
    } catch (error: any) {
      setFormErrors({
        email: error.response?.data?.message || 'Failed to send reset email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: typeof formErrors = {};
    
    if (!newPasswordValues.password_hash) {
      errors.password_hash = 'Password is required';
    } else if (newPasswordValues.password_hash.length < 8) {
      errors.password_hash = 'Password must be at least 8 characters';
    }
    
    if (newPasswordValues.password_hash !== newPasswordValues.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/reset-password`,
        {
          token: resetToken,
          password_hash: newPasswordValues.password_hash
        }
      );
      
      setResetSuccess(true);
      // Reset form after success
      setNewPasswordValues({
        password_hash: '',
        confirm_password: ''
      });
    } catch (error: any) {
      setFormErrors({
        general: error.response?.data?.message || 'Failed to reset password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPasswordValues.password_hash);
  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {resetSuccess 
                ? 'Password Reset Successful' 
                : resetCodeValid 
                  ? 'Set New Password' 
                  : emailSubmitted 
                    ? 'Check Your Email' 
                    : 'Reset Your Password'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {resetSuccess
                ? 'Your password has been successfully reset. You can now sign in with your new password.'
                : resetCodeValid
                  ? 'Please enter your new password below'
                  : emailSubmitted
                    ? 'We have sent a password reset link to your email address if it exists in our system'
                    : 'Enter your email address and we will send you a link to reset your password'}
            </p>
          </div>

          {resetSuccess ? (
            <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-4">
                  <Link 
                    to="/login" 
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Return to login page
                  </Link>
                </div>
              </div>
            </div>
          ) : resetCodeValid ? (
            <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {formErrors.general}
                </div>
              )}
              
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPasswordValues.password_hash}
                    onChange={(e) => {
                      setNewPasswordValues({
                        ...newPasswordValues,
                        password_hash: e.target.value
                      });
                      if (formErrors.password_hash) {
                        setFormErrors({
                          ...formErrors,
                          password_hash: undefined
                        });
                      }
                    }}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.password_hash ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  />
                  {formErrors.password_hash && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password_hash}</p>
                  )}
                  
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Password Strength</span>
                      <span className="text-sm font-medium text-gray-700">
                        {strengthText[passwordStrength] || 'Very Weak'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${strengthColor[passwordStrength] || 'bg-red-500'}`} 
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500">
                    Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPasswordValues.confirm_password}
                    onChange={(e) => {
                      setNewPasswordValues({
                        ...newPasswordValues,
                        confirm_password: e.target.value
                      });
                      if (formErrors.confirm_password) {
                        setFormErrors({
                          ...formErrors,
                          confirm_password: undefined
                        });
                      }
                    }}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  />
                  {formErrors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.confirm_password}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          ) : emailSubmitted ? (
            <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  If an account exists with the email address you provided, you will receive a password reset link shortly.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setEmailSubmitted(false)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Resend email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {formErrors.general}
                </div>
              )}
              
              <div className="rounded-md shadow-sm">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) {
                        setFormErrors({
                          ...formErrors,
                          email: undefined
                        });
                      }
                    }}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Email address"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Return to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_PasswordReset;