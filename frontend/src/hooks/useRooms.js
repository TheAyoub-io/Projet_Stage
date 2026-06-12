import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roomsService from '../services/rooms.service';

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: roomsService.getAllRooms,
  });
};

export const useUnassignedStudents = () => {
  return useQuery({
    queryKey: ['unassignedStudents'],
    queryFn: roomsService.getUnassignedStudents,
  });
};

export const useAssignStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, appId }) => roomsService.assignStudent(roomId, appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedStudents'] });
    },
  });
};

export const useRemoveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, appId }) => roomsService.removeStudent(roomId, appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedStudents'] });
    },
  });
};
