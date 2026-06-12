import api from '../lib/axios';

const roomsService = {
  getAllRooms: async () => {
    const response = await api.get('/rooms/all');
    return response.data;
  },
  
  getUnassignedStudents: async () => {
    const response = await api.get('/rooms/unassigned-students');
    return response.data;
  },
  
  assignStudent: async (roomId, appId) => {
    const response = await api.post(`/rooms/${roomId}/assign/${appId}`);
    return response.data;
  },
  
  removeStudent: async (roomId, appId) => {
    const response = await api.delete(`/rooms/${roomId}/remove/${appId}`);
    return response.data;
  }
};

export default roomsService;
