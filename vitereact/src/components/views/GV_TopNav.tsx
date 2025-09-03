import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Zustand store selectors
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const unreadCount = useAppStore(state => state.notification_count.unread_count);
  const logoutUser = useAppStore(state => state.logout_user);
  
  const location = useLocation();
  
  const handleLogout = () => {
    logoutUser();
    setIsProfileDropdownOpen(false);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };
  
  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };
  
  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (isProfileDropdownOpen) {
        closeProfileDropdown();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);
  
  // Close mobile menu when route changes
  React.useEffect(() => {
    closeMobileMenu();
  }, [location]);
  
  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and main navigation */}
            <div className="flex items-center">
              {/* Logo/Home link */}
              <Link 
                to="/" 
                className="flex-shrink-0 flex items-center"
                onClick={closeMobileMenu}
              >
                <div className="bg-red-600 text-white font-bold text-xl px-3 py-1 rounded">
                  LibyaStay
                </div>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/'
                      ? 'border-red-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
                
                <Link
                  to="/search"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/search'
                      ? 'border-red-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={closeMobileMenu}
                >
                  Search
                </Link>
                
                {isAuthenticated && currentUser?.role === 'host' && (
                  <Link
                    to="/dashboard/listings"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === '/dashboard/listings'
                        ? 'border-red-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Listings
                  </Link>
                )}
                
                {isAuthenticated && (
                  <Link
                    to="/messages"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === '/messages'
                        ? 'border-red-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Messages
                  </Link>
                )}
              </div>
            </div>
            
            {/* Right side - Auth controls and user menu */}
            <div className="flex items-center">
              {!isAuthenticated ? (
                // Unauthenticated view
                <div className="hidden md:flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    onClick={closeMobileMenu}
                  >
                    Register
                  </Link>
                </div>
              ) : (
                // Authenticated view
                <div className="flex items-center">
                  {/* Notifications badge */}
                  <Link
                    to="/notifications"
                    className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none relative"
                    onClick={closeMobileMenu}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Profile dropdown */}
                  <div className="ml-3 relative">
                    <div>
                      <button
                        onClick={toggleProfileDropdown}
                        className="flex text-sm rounded-full focus:outline-none"
                        aria-expanded={isProfileDropdownOpen}
                        aria-haspopup="true"
                      >
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {currentUser?.profile_picture_url ? (
                            <img 
                              className="h-8 w-8 rounded-full" 
                              src={currentUser.profile_picture_url} 
                              alt={currentUser.name} 
                            />
                          ) : (
                            <span className="text-gray-700 font-medium">
                              {currentUser?.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                    
                    {/* Profile dropdown menu */}
                    {isProfileDropdownOpen && (
                      <div 
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {currentUser?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {currentUser?.email}
                          </p>
                        </div>
                        
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={closeProfileDropdown}
                        >
                          Dashboard
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={closeProfileDropdown}
                        >
                          Settings
                        </Link>
                        
                        {currentUser?.emergency_contact_name && (
                          <div className="px-4 py-2 text-xs text-red-600 bg-red-50">
                            <span className="font-medium">Emergency:</span> {currentUser.emergency_contact_name}
                          </div>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile menu button */}
              <div className="md:hidden flex items-center ml-4">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === '/'
                    ? 'bg-red-50 border-red-600 text-red-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              
              <Link
                to="/search"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === '/search'
                    ? 'bg-red-50 border-red-600 text-red-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={closeMobileMenu}
              >
                Search
              </Link>
              
              {isAuthenticated && currentUser?.role === 'host' && (
                <Link
                  to="/dashboard/listings"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === '/dashboard/listings'
                      ? 'bg-red-50 border-red-600 text-red-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  Listings
                </Link>
              )}
              
              {isAuthenticated && (
                <Link
                  to="/messages"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === '/messages'
                      ? 'bg-red-50 border-red-600 text-red-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  Messages
                </Link>
              )}
              
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                    onClick={closeMobileMenu}
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {currentUser?.profile_picture_url ? (
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={currentUser.profile_picture_url} 
                              alt={currentUser.name} 
                            />
                          ) : (
                            <span className="text-gray-700 font-medium">
                              {currentUser?.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {currentUser?.name}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {currentUser?.email}
                        </div>
                        {currentUser?.emergency_contact_name && (
                          <div className="text-xs text-red-600 mt-1">
                            <span className="font-medium">Emergency:</span> {currentUser.emergency_contact_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={closeMobileMenu}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default GV_TopNav;