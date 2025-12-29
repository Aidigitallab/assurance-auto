import { useAuthStore } from './authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchMe,
  };
};
