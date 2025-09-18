import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import ErrorBoundary from '@/components/ErrorBoundary';

// Global views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';

// Unique views
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_SearchResults from '@/components/views/UV_SearchResults.tsx';
import UV_PropertyDetails from '@/components/views/UV_PropertyDetails.tsx';
import UV_Registration from '@/components/views/UV_Registration.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_UserDashboard from '@/components/views/UV_UserDashboard.tsx';
import UV_TravelerBookings from '@/components/views/UV_TravelerBookings.tsx';
import UV_HostListingsDashboard from '@/components/views/UV_HostListingsDashboard.tsx';
import UV_CreateListing from '@/components/views/UV_CreateListing.tsx';
import UV_EditListing from '@/components/views/UV_EditListing.tsx';
import UV_HostBookings from '@/components/views/UV_HostBookings.tsx';
import UV_MessagingCenter from '@/components/views/UV_MessagingCenter.tsx';
import UV_CreateReview from '@/components/views/UV_CreateReview.tsx';
import UV_AdminPanel from '@/components/views/UV_AdminPanel.tsx';
import UV_ProfileSettings from '@/components/views/UV_ProfileSettings.tsx';
import UV_PasswordReset from '@/components/views/UV_PasswordReset.tsx';
import UV_NotFound from '@/components/views/UV_NotFound.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <div className="App min-h-screen flex flex-col">
            <GV_TopNav />
            <main className="flex-1">
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Landing />} />
              <Route path="/search" element={<UV_SearchResults />} />
              <Route path="/properties/:property_id" element={<UV_PropertyDetails />} />
              <Route path="/register" element={<UV_Registration />} />
              <Route path="/login" element={<UV_Login />} />
              <Route path="/reset-password" element={<UV_PasswordReset />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UV_UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/bookings" 
                element={
                  <ProtectedRoute>
                    <UV_TravelerBookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/listings" 
                element={
                  <ProtectedRoute>
                    <UV_HostListingsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/listings/create" 
                element={
                  <ProtectedRoute>
                    <UV_CreateListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/listings/:listing_id/edit" 
                element={
                  <ProtectedRoute>
                    <UV_EditListing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/host-bookings" 
                element={
                  <ProtectedRoute>
                    <UV_HostBookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <UV_MessagingCenter />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reviews/create/:booking_id" 
                element={
                  <ProtectedRoute>
                    <UV_CreateReview />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <UV_ProfileSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <UV_AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all - show 404 page */}
              <Route path="*" element={<UV_NotFound />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
        </ErrorBoundary>
      </QueryClientProvider>
    </Router>
  );
};

export default App;