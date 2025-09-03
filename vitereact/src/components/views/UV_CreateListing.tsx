import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { createPropertyInputSchema } from '@/schemas/zodSchemas';
import { useAppStore } from '@/store/main';

const UV_CreateListing: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [guestCapacity, setGuestCapacity] = useState(1);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [amenities] = useState('');
  const [basePricePerNight, setBasePricePerNight] = useState(0);
  const [currency] = useState('LYD');
  const [hasPowerBackup, setHasPowerBackup] = useState(false);
  const [hasWaterTank, setHasWaterTank] = useState(false);
  const [houseRules] = useState('');
  const [cancellationPolicy] = useState('moderate');
  const [instantBook, setInstantBook] = useState(false);
  const [isActive] = useState(true);

  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
        propertyData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Property created successfully:', data);
    },
    onError: (error) => {
      console.error('Error creating property:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    const propertyData = {
      host_id: currentUser.user_id,
      title,
      description,
      city,
      neighborhood: neighborhood || null,
      address: address || null,
      latitude: null,
      longitude: null,
      property_type: propertyType,
      guest_capacity: guestCapacity,
      bedrooms,
      beds,
      bathrooms,
      amenities: amenities || null,
      base_price_per_night: basePricePerNight,
      currency,
      has_power_backup: hasPowerBackup,
      has_water_tank: hasWaterTank,
      house_rules: houseRules || null,
      cancellation_policy: cancellationPolicy,
      instant_book: instantBook,
      is_active: isActive,
    };

    try {
      // Validate the data
      createPropertyInputSchema.parse(propertyData);
      
      // Submit the data
      await createPropertyMutation.mutateAsync(propertyData);
    } catch (error) {
      console.error('Validation or submission error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Listing</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
            Neighborhood
          </label>
          <input
            type="text"
            id="neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select a type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="room">Room</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="guestCapacity" className="block text-sm font-medium text-gray-700">
              Guest Capacity
            </label>
            <input
              type="number"
              id="guestCapacity"
              min="1"
              value={guestCapacity}
              onChange={(e) => setGuestCapacity(parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
              Bedrooms
            </label>
            <input
              type="number"
              id="bedrooms"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="beds" className="block text-sm font-medium text-gray-700">
              Beds
            </label>
            <input
              type="number"
              id="beds"
              min="1"
              value={beds}
              onChange={(e) => setBeds(parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
              Bathrooms
            </label>
            <input
              type="number"
              id="bathrooms"
              min="0"
              step="0.5"
              value={bathrooms}
              onChange={(e) => setBathrooms(parseFloat(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="basePricePerNight" className="block text-sm font-medium text-gray-700">
            Base Price Per Night
          </label>
          <input
            type="number"
            id="basePricePerNight"
            min="0"
            step="0.01"
            value={basePricePerNight}
            onChange={(e) => setBasePricePerNight(parseFloat(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hasPowerBackup}
              onChange={(e) => setHasPowerBackup(e.target.checked)}
              className="mr-2"
            />
            Power Backup
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hasWaterTank}
              onChange={(e) => setHasWaterTank(e.target.checked)}
              className="mr-2"
            />
            Water Tank
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={instantBook}
              onChange={(e) => setInstantBook(e.target.checked)}
              className="mr-2"
            />
            Instant Book
          </label>
        </div>

        <button
          type="submit"
          disabled={createPropertyMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {createPropertyMutation.isPending ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
};

export default UV_CreateListing;