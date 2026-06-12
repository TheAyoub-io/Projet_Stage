import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/admin.service';

export const useAdminApplications = (params) => {
  return useQuery({
    queryKey: ['adminApplications', params],
    queryFn: () => adminService.getApplications(params),
    keepPreviousData: true,
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  });
};

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: adminService.getAnalytics,
  });
};

export const useAdminInactiveStudents = () => {
  return useQuery({
    queryKey: ['adminInactiveStudents'],
    queryFn: adminService.getInactiveStudents,
  });
};

export const useSendAdminEmails = () => {
  return useMutation({
    mutationFn: (data) => adminService.sendEmails(data),
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }) => adminService.updateApplicationStatus(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    },
  });
};
