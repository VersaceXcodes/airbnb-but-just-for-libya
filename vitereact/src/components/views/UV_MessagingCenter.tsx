import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import { useAppStore } from '@/store/main';

// Define TypeScript interfaces based on Zod schemas
interface Conversation {
  conversation_id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface User {
  user_id: string;
  name: string;
  profile_picture_url: string | null;
}

const UV_MessagingCenter: React.FC = () => {
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local component state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [newMessageContent, setNewMessageContent] = useState('');
  const [searchParams] = useSearchParams();
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!authToken) return [];
    
    try {
      const response = await axios.get<{ conversations: Conversation[] }>(
        `${API_BASE_URL}/api/conversations`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { limit: 20, offset: 0 }
        }
      );
      return response.data.conversations;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      throw new Error('Failed to load conversations');
    }
  }, [authToken, API_BASE_URL]);
  
  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!authToken) return [];
    
    try {
      const response = await axios.get<Message[]>(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { limit: 50, offset: 0 }
        }
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw new Error('Failed to load messages');
    }
  }, [authToken, API_BASE_URL]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversation_id: string; content: string }) => {
      if (!authToken) throw new Error('Not authenticated');
      
      const response = await axios.post<Message>(
        `${API_BASE_URL}/api/conversations/${data.conversation_id}/messages`,
        {
          content: data.content,
          sender_id: currentUser?.user_id
        },
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: (newMessage) => {
      // Add new message to messages list
      setMessages(prev => [...prev, newMessage]);
      setNewMessageContent('');
      
      // Update conversation's updated_at timestamp
      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === newMessage.conversation_id 
            ? { ...conv, updated_at: new Date().toISOString() } 
            : conv
        )
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  });
  
  // Mark message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!authToken) throw new Error('Not authenticated');
      
      const response = await axios.patch<Message>(
        `${API_BASE_URL}/api/messages/${messageId}`,
        { is_read: true },
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: (updatedMessage) => {
      // Update message read status in local state
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === updatedMessage.message_id 
            ? { ...msg, is_read: updatedMessage.is_read } 
            : msg
        )
      );
      
      // Update unread counts
      setUnreadCounts(prev => {
        const convId = updatedMessage.conversation_id;
        const currentCount = prev[convId] || 0;
        return {
          ...prev,
          [convId]: Math.max(0, currentCount - 1)
        };
      });
    }
  });
  
  // Load conversations on component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const convs = await fetchConversations();
        setConversations(convs);
        
        // Check if there's a pre-selected conversation from URL params
        const conversationId = searchParams.get('conversation_id');
        if (conversationId) {
          const selectedConversation = convs.find(c => c.conversation_id === conversationId);
          if (selectedConversation) {
            setActiveConversation(selectedConversation);
          }
        } else if (convs.length > 0) {
          // Select the most recent conversation by default
          setActiveConversation(convs[0]);
        }
      } catch (err) {
        setError('Failed to load conversations');
        console.error('Error loading conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    if (authToken) {
      loadConversations();
    }
  }, [authToken, fetchConversations, searchParams]);
  
  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation) {
        setMessages([]);
        return;
      }
      
      try {
        setIsLoadingMessages(true);
        const msgs = await fetchMessages(activeConversation.conversation_id);
        setMessages(msgs);
        
        // Mark messages as read if they belong to the current user
        msgs
          .filter(msg => !msg.is_read && msg.sender_id !== currentUser?.user_id)
          .forEach(msg => {
            markMessageAsReadMutation.mutate(msg.message_id);
          });
      } catch (err) {
        setError('Failed to load messages');
        console.error('Error loading messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessages();
  }, [activeConversation, fetchMessages, currentUser, markMessageAsReadMutation]);
  
  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessageContent.trim() || !activeConversation || sendMessageMutation.isPending) {
      return;
    }
    
    sendMessageMutation.mutate({
      conversation_id: activeConversation.conversation_id,
      content: newMessageContent
    });
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };
  
  // Get the other participant in a conversation
  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser) return null;
    
    return conversation.guest_id === currentUser.user_id 
      ? conversation.host_id 
      : conversation.guest_id;
  };
  
  // Render conversation item
  const renderConversationItem = (conversation: Conversation) => {
    const unreadCount = unreadCounts[conversation.conversation_id] || 0;
    const isActive = activeConversation?.conversation_id === conversation.conversation_id;
    const otherUserId = getOtherParticipant(conversation);
    
    return (
      <div
        key={conversation.conversation_id}
        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
          isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={() => setActiveConversation(conversation)}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-700 font-medium">
              {otherUserId?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {otherUserId === conversation.guest_id ? 'Guest' : 'Host'}
              </h3>
              <time className="text-xs text-gray-500">
                {formatMessageDate(conversation.updated_at)}
              </time>
            </div>
            <p className="text-sm text-gray-500 truncate">
              Conversation about booking #{conversation.booking_id.substring(0, 8)}
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="ml-2 flex-shrink-0">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render message item
  const renderMessageItem = (message: Message) => {
    const isCurrentUser = message.sender_id === currentUser?.user_id;
    const messageClass = isCurrentUser 
      ? 'bg-blue-500 text-white rounded-br-none' 
      : 'bg-gray-200 text-gray-800 rounded-bl-none';
    
    return (
      <div
        key={message.message_id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${messageClass}`}>
          <p className="text-sm">{message.content}</p>
          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{formatMessageDate(message.created_at)}</span>
            {isCurrentUser && (
              <span className="ml-2">
                {message.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (!authToken || !currentUser) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access your messages</p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
              {/* Conversations sidebar */}
              <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No conversations yet. Start a conversation from a booking.
                    </div>
                  ) : (
                    conversations.map(renderConversationItem)
                  )}
                </div>
              </div>
              
              {/* Active conversation panel */}
              <div className="w-full md:w-2/3 flex flex-col">
                {activeConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-700 font-medium">
                            {getOtherParticipant(activeConversation)?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {getOtherParticipant(activeConversation) === activeConversation.guest_id 
                              ? 'Guest' 
                              : 'Host'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Booking #{activeConversation.booking_id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : error ? (
                        <div className="p-4 text-center text-red-500">{error}</div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map(renderMessageItem)}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex">
                        <input
                          type="text"
                          value={newMessageContent}
                          onChange={(e) => setNewMessageContent(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 rounded-l-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={sendMessageMutation.isPending}
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          disabled={!newMessageContent.trim() || sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No conversation selected</h3>
                      <p className="mt-1 text-gray-500">Select a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_MessagingCenter;