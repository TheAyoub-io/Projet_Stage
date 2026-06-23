import api from '../lib/axios';

const ticketsService = {
  getTickets: async () => {
    const response = await api.get('/api/tickets/');
    return response.data;
  },

  getTicketDetails: async (ticketId) => {
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/api/tickets/', ticketData);
    return response.data;
  },

  addMessage: async (ticketId, message) => {
    const response = await api.post(`/api/tickets/${ticketId}/messages`, { message });
    return response.data;
  },

  updateStatus: async (ticketId, status) => {
    const response = await api.put(`/api/tickets/${ticketId}/status`, { status });
    return response.data;
  }
};

export default ticketsService;
