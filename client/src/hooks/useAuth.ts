import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch('/api/auth/user');
      if (!res.ok) {
        // Return null instead of throwing for unauthorized users
        if (res.status === 401) return null;
        throw new Error('Auth check failed');
      }
      return res.json();
    },
    retry: false,
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}