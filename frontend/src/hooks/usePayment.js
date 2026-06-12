import { useMutation } from '@tanstack/react-query';
import paymentService from '../services/payment.service';

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: paymentService.createCheckoutSession,
  });
};
