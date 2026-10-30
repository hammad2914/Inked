import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useSocketStore } from '../stores/socketStore';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { setSocket, setConnected, incrementUnread } = useSocketStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('notification:new', () => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('dashboard:refresh', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('task:assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    });

    socket.on('task:status_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('task:timeline_updated', (data: { taskId: string }) => {
      // Refresh the open task detail and the task list
      queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    });

    socket.on('task:comment_added', () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments'] });
    });

    socket.on('project:member_joined', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, accessToken]);

  const { socket } = useSocketStore.getState();
  return socket;
}
