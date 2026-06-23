import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ticketsService from '../services/tickets.service';

export const useTickets = () => {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: ticketsService.getTickets,
  });
};

export const useTicketDetails = (ticketId) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsService.getTicketDetails(ticketId),
    enabled: !!ticketId,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ticketsService.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useAddTicketMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, message }) => ticketsService.addMessage(ticketId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, status }) => ticketsService.updateStatus(ticketId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
