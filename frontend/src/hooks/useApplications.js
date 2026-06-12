import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import applicationsService from '../services/applications.service';

export const useMyApplication = () => {
  return useQuery({
    queryKey: ['myApplication'],
    queryFn: applicationsService.getMyApplication,
  });
};

export const useMyStatus = () => {
  return useQuery({
    queryKey: ['myStatus'],
    queryFn: applicationsService.getMyStatus,
    retry: false, // Handle 401 manually or via interceptor
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myStatus'] });
      queryClient.invalidateQueries({ queryKey: ['myApplication'] });
    },
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationsService.submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplication'] });
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }) => applicationsService.uploadDocument(type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplication'] });
    },
  });
};
