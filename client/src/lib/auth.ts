import { useQuery } from "@tanstack/react-query";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar?: string;
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function getCurrentUserId(): number | null {
  // Check if user is logged in by looking for auth token
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  // Parse JWT token to get user ID (basic parsing, in production use proper JWT library)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('onboarding_completed');
  window.location.reload();
}