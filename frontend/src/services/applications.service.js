import api from '../lib/axios';

const applicationsService = {
  submitApplication: async ({ data, editMode }) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    const response = editMode 
      ? await api.put('/applications/update', data, config)
      : await api.post('/applications/apply', data, config);
    return response.data;
  },
  
  getMyApplication: async () => {
    const response = await api.get('/applications/me');
    return response.data;
  },
  
  getMyStatus: async () => {
    const response = await api.get('/applications/my-status');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/applications/profile', profileData);
    return response.data;
  },
  
  uploadDocument: async (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/applications/documents/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default applicationsService;
