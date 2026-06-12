import api from '../lib/axios';

const adminService = {
  getApplications: async (params) => {
    const response = await api.get('/admin/applications', { params });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
  
  getInactiveStudents: async () => {
    const response = await api.get('/admin/email/inactive-students');
    return response.data;
  },
  
  sendEmails: async (data) => {
    const response = await api.post('/admin/email/send', data);
    return response.data;
  },
  
  updateApplicationStatus: async (id, status, rejectionReason = '') => {
    const payload = { status };
    if (status === 'rejected' && rejectionReason) {
      payload.rejection_reason = rejectionReason;
    }
    const response = await api.patch(`/admin/applications/${id}/status`, payload);
    return response.data;
  }
};

export default adminService;
