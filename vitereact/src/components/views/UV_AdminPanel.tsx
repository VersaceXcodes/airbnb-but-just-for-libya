import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const UV_AdminPanel: React.FC = () => {
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.post(`/api/admin/suspend-user`, { userId });
      return response.data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.delete(`/api/admin/delete-user/${userId}`);
      return response.data;
    },
  });

  const approvePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await axios.post(`/api/admin/approve-property`, { propertyId });
      return response.data;
    },
  });

  const rejectPropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await axios.post(`/api/admin/reject-property`, { propertyId });
      return response.data;
    },
  });

  const banPropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await axios.post(`/api/admin/ban-property`, { propertyId });
      return response.data;
    },
  });

  const unbanPropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await axios.post(`/api/admin/unban-property`, { propertyId });
      return response.data;
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await axios.post(`/api/admin/resolve-report`, { reportId });
      return response.data;
    },
  });

  const dismissReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await axios.post(`/api/admin/dismiss-report`, { reportId });
      return response.data;
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">User Management</h2>
          <div className="space-y-2">
            <button
              onClick={() => suspendUserMutation.mutate('test-user-id')}
              disabled={suspendUserMutation.isPending}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {suspendUserMutation.isPending ? 'Suspending...' : 'Suspend User'}
            </button>
            <button
              onClick={() => deleteUserMutation.mutate('test-user-id')}
              disabled={deleteUserMutation.isPending}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Property Management</h2>
          <div className="space-y-2">
            <button
              onClick={() => approvePropertyMutation.mutate('test-property-id')}
              disabled={approvePropertyMutation.isPending}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {approvePropertyMutation.isPending ? 'Approving...' : 'Approve Property'}
            </button>
            <button
              onClick={() => rejectPropertyMutation.mutate('test-property-id')}
              disabled={rejectPropertyMutation.isPending}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {rejectPropertyMutation.isPending ? 'Rejecting...' : 'Reject Property'}
            </button>
            <button
              onClick={() => banPropertyMutation.mutate('test-property-id')}
              disabled={banPropertyMutation.isPending}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {banPropertyMutation.isPending ? 'Banning...' : 'Ban Property'}
            </button>
            <button
              onClick={() => unbanPropertyMutation.mutate('test-property-id')}
              disabled={unbanPropertyMutation.isPending}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {unbanPropertyMutation.isPending ? 'Unbanning...' : 'Unban Property'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Report Management</h2>
          <div className="space-y-2">
            <button
              onClick={() => resolveReportMutation.mutate('test-report-id')}
              disabled={resolveReportMutation.isPending}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {resolveReportMutation.isPending ? 'Resolving...' : 'Resolve Report'}
            </button>
            <button
              onClick={() => dismissReportMutation.mutate('test-report-id')}
              disabled={dismissReportMutation.isPending}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {dismissReportMutation.isPending ? 'Dismissing...' : 'Dismiss Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UV_AdminPanel;