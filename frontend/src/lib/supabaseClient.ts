import { auth } from './apiClient';

/**
 * True in Node migration mode.
 */
export const IS_CONFIGURED = true;

// Mock the supabase client structure to use our apiClient auth implementation
export const supabase = {
  auth
};

/** Async helper — returns the current user's id or throws */
export async function getUserId(): Promise<string> {
  const { data, error } = await auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}
