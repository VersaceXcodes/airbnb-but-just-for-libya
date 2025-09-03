import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// Zod schema derived TypeScript interfaces
interface User {
  user_id: string;
  email: string;
  phone_number: string;
  password_hash: string;
  name: string;
  profile_picture_url: string | null;
  bio: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  role: 'traveler' | 'host' | 'admin' | 'both';
  is_verified: boolean;
  verification_document_url: string | null;
  created_at: string;
  updated_at: string;
}

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

interface Notification {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Global State Interfaces
interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

interface SearchFilters {
  location: string | null;
  check_in: string | null;
  check_out: string | null;
  guest_count: number | null;
  price_min: number | null;
  price_max: number | null;
  property_types: string[];
  amenities: string[];
  sort_by: string;
}

interface BookingCart {
  listing_id: string | null;
  check_in: string | null;
  check_out: string | null;
  guest_count: number | null;
  special_requests: string | null;
}

interface UserRole {
  role: 'traveler' | 'host' | 'admin' | 'both' | null;
}

interface NotificationCount {
  unread_count: number;
}

// WebSocket Events
type WebSocketEvents = 
  | 'message:new'
  | 'message:read'
  | 'booking:request'
  | 'booking:confirmed'
  | 'booking:declined'
  | 'booking:cancelled';

  // Store State
interface AppState {
  // Global state variables
  authentication_state: AuthenticationState;
  search_filters: SearchFilters;
  booking_cart: BookingCart;
  user_role: UserRole;
  notification_count: NotificationCount;
  currentLanguage: string;
  currentCurrency: string;
  
  // WebSocket connection
  websocket_connection: Socket | null;
  websocket_connected: boolean;
  
  // Actions
  // Authentication actions
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
  register_user: (user_data: Omit<User, 'user_id' | 'created_at' | 'updated_at' | 'is_verified' | 'verification_document_url'>) => Promise<void>;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
  
  // Search actions
  update_search_filters: (filters: Partial<SearchFilters>) => void;
  reset_search_filters: () => void;
  
  // Booking cart actions
  update_booking_cart: (cart: Partial<BookingCart>) => void;
  clear_booking_cart: () => void;
  
  // User role actions
  update_user_role: (role: UserRole['role']) => void;
  
  // Notification actions
  update_notification_count: (count: number) => void;
  increment_notification_count: () => void;
  decrement_notification_count: () => void;
  
  // Language actions
  setLanguage: (language: string) => void;
  
  // WebSocket actions
  connect_websocket: (token: string) => void;
  disconnect_websocket: () => void;
  subscribe_to_events: () => void;
}
// Create the store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      
      search_filters: {
        location: null,
        check_in: null,
        check_out: null,
        guest_count: null,
        price_min: null,
        price_max: null,
        property_types: [],
        amenities: [],
        sort_by: 'recommended',
      },
      
      booking_cart: {
        listing_id: null,
        check_in: null,
        check_out: null,
        guest_count: null,
        special_requests: null,
      },
      
      user_role: {
        role: null,
      },
      
      notification_count: {
        unread_count: 0,
      },
      
      websocket_connection: null,
      websocket_connected: false,
      currentLanguage: 'ar',
      currentCurrency: 'LYD',
      
      // Authentication actions
      login_user: async (email: string, password: string) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));
        
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { user, token } = response.data;
          
          set((state) => ({
            authentication_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
            user_role: {
              role: user.role,
            },
          }));
          
          // Connect websocket after successful login
          get().connect_websocket(token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          
          set((state) => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          
          throw new Error(errorMessage);
        }
      },
      
      logout_user: () => {
        // Disconnect websocket
        get().disconnect_websocket();
        
        set((state) => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
          user_role: {
            role: null,
          },
        }));
      },
      
      register_user: async (user_data) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));
        
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
            user_data,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { user, token } = response.data;
          
          set((state) => ({
            authentication_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
            user_role: {
              role: user.role,
            },
          }));
          
          // Connect websocket after successful registration
          get().connect_websocket(token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                ...state.authentication_state.authentication_status,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          
          throw new Error(errorMessage);
        }
      },
      
      initialize_auth: async () => {
        const { auth_token } = get().authentication_state;
        
        if (!auth_token) {
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                ...state.authentication_state.authentication_status,
                is_loading: false,
              },
            },
          }));
          return;
        }
        
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${auth_token}` } }
          );
          
          const { user } = response.data;
          
          set((state) => ({
            authentication_state: {
              current_user: user,
              auth_token: auth_token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
            user_role: {
              role: user.role,
            },
          }));
          
          // Connect websocket after successful auth initialization
          get().connect_websocket(auth_token);
        } catch (error) {
          // Token is invalid, clear auth state
          set((state) => ({
            authentication_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: null,
            },
            user_role: {
              role: null,
            },
          }));
        }
      },
      
      clear_auth_error: () => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            error_message: null,
          },
        }));
      },
      
      // Search actions
      update_search_filters: (filters: Partial<SearchFilters>) => {
        set((state) => ({
          search_filters: {
            ...state.search_filters,
            ...filters,
          },
        }));
      },
      
      reset_search_filters: () => {
        set(() => ({
          search_filters: {
            location: null,
            check_in: null,
            check_out: null,
            guest_count: null,
            price_min: null,
            price_max: null,
            property_types: [],
            amenities: [],
            sort_by: 'recommended',
          },
        }));
      },
      
      // Booking cart actions
      update_booking_cart: (cart: Partial<BookingCart>) => {
        set((state) => ({
          booking_cart: {
            ...state.booking_cart,
            ...cart,
          },
        }));
      },
      
      clear_booking_cart: () => {
        set(() => ({
          booking_cart: {
            listing_id: null,
            check_in: null,
            check_out: null,
            guest_count: null,
            special_requests: null,
          },
        }));
      },
      
      // User role actions
      update_user_role: (role) => {
        set(() => ({
          user_role: {
            role,
          },
        }));
      },
      
      // Notification actions
      update_notification_count: (count: number) => {
        set(() => ({
          notification_count: {
            unread_count: count,
          },
        }));
      },
      
      increment_notification_count: () => {
        set((state) => ({
          notification_count: {
            unread_count: state.notification_count.unread_count + 1,
          },
        }));
      },
      
      decrement_notification_count: () => {
        set((state) => ({
          notification_count: {
            unread_count: Math.max(0, state.notification_count.unread_count - 1),
          },
        }));
      },
      
      // Language actions
      setLanguage: (language: string) => {
        set(() => ({
          currentLanguage: language,
        }));
      },
      connect_websocket: (token: string) => {
        // Disconnect existing connection if any
        if (get().websocket_connection) {
          get().disconnect_websocket();
        }
        
        const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
          auth: {
            token: `Bearer ${token}`,
          },
        });
        
        socket.on('connect', () => {
          set(() => ({
            websocket_connected: true,
          }));
        });
        
        socket.on('disconnect', () => {
          set(() => ({
            websocket_connected: false,
          }));
        });
        
        set(() => ({
          websocket_connection: socket,
        }));
        
        // Subscribe to events
        get().subscribe_to_events();
      },
      
      disconnect_websocket: () => {
        const socket = get().websocket_connection;
        if (socket) {
          socket.disconnect();
          set(() => ({
            websocket_connection: null,
            websocket_connected: false,
          }));
        }
      },
      
      subscribe_to_events: () => {
        const socket = get().websocket_connection;
        if (!socket) return;
        
        // Handle new messages
        socket.on('message:new', (data) => {
          get().increment_notification_count();
        });
        
        // Handle booking requests
        socket.on('booking:request', (data) => {
          get().increment_notification_count();
        });
        
        // Handle booking confirmations
        socket.on('booking:confirmed', (data) => {
          get().increment_notification_count();
        });
        
        // Handle booking declines
        socket.on('booking:declined', (data) => {
          get().increment_notification_count();
        });
        
        // Handle booking cancellations
        socket.on('booking:cancelled', (data) => {
          get().increment_notification_count();
        });
      },
    }),
    {
      name: 'libyastay-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
            is_loading: false, // Never persist loading state
          },
          error_message: null, // Never persist errors
        },
        search_filters: state.search_filters,
        booking_cart: state.booking_cart,
        user_role: state.user_role,
        notification_count: state.notification_count,
      }),
    }
  )
);

// Export utility functions
export const isAuthenticated = (state: AppState) => 
  state.authentication_state.authentication_status.is_authenticated;

export const getCurrentUser = (state: AppState) => 
  state.authentication_state.current_user;

export const getAuthToken = (state: AppState) => 
  state.authentication_state.auth_token;