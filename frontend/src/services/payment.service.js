import api from '../lib/axios';

const paymentService = {
  createCheckoutSession: async () => {
    const response = await api.post('/payments/create-checkout-session');
    return response.data;
  }
};

export default paymentService;
