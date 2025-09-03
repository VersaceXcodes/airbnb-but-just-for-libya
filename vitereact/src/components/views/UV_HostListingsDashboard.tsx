import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const UV_HostListingsDashboard: React.FC = () => {
  const togglePropertyStatusMutation = useMutation({
    mutationFn: async (data: { property_id: string; is_active: boolean }) => {
      const response = await axios.patch(`/api/properties/${data.property_id}/status`, {
        is_active: data.is_active
      });
      return response.data;
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Host Listings Dashboard</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Property Management</h2>
        <div className="space-y-2">
          <button
            onClick={() => togglePropertyStatusMutation.mutate({ property_id: 'test-id', is_active: true })}
            disabled={togglePropertyStatusMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {togglePropertyStatusMutation.isPending ? 'Activating...' : 'Activate Property'}
          </button>
          <button
            onClick={() => togglePropertyStatusMutation.mutate({ property_id: 'test-id', is_active: false })}
            disabled={togglePropertyStatusMutation.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 ml-2"
          >
            {togglePropertyStatusMutation.isPending ? 'Deactivating...' : 'Deactivate Property'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_HostListingsDashboard;