import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  const response = await fetch("/api/me");
  if (response.status === 401) {
    return null; // Explicitly return null for unauthenticated users
  }
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false, // Don't retry on 401s
  });

  const isAuthenticated = !!user && !isError;

  return {
    user,
    isLoading,
    isAuthenticated,
    isError,
  };
}