import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import { StorageAPI, SaveResult } from './storage';

const STORAGE_KEY = '@schorl:content';
const VERSION_KEY = '@schorl:version';
const LAST_SYNC_KEY = '@schorl:last-sync';

interface DocumentRow {
  user_id: string;
  content: string;
  version: number;
  updated_at: string;
}

export const supabaseStorageAPI: StorageAPI = {
  async saveContentLocal(content: string): Promise<void> {
    // Skip Supabase during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Only save to local storage (instant, no network)
      await AsyncStorage.setItem(STORAGE_KEY, content);
    } catch (error) {
      console.error('Error in saveContentLocal:', error);
      throw error;
    }
  },

  async getContent(): Promise<string> {
    // Skip Supabase during SSR
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not authenticated, just return local content
        const localContent = await AsyncStorage.getItem(STORAGE_KEY);
        return localContent || '';
      }

      // Get local content and version
      const [localContent, localVersionStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(VERSION_KEY),
      ]);

      const localVersion = localVersionStr ? parseInt(localVersionStr, 10) : 0;

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching from Supabase:', error);
        // Fall back to local content
        return localContent || '';
      }

      if (!data) {
        // No remote document yet
        // If we have local content, we'll sync it on next save
        return localContent || '';
      }

      const remoteDoc = data as DocumentRow;

      // Compare versions
      if (remoteDoc.version > localVersion) {
        // Remote is newer, use it and update local cache
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEY, remoteDoc.content),
          AsyncStorage.setItem(VERSION_KEY, remoteDoc.version.toString()),
          AsyncStorage.setItem(LAST_SYNC_KEY, remoteDoc.updated_at),
        ]);
        return remoteDoc.content;
      }

      // Local is up to date or newer
      return localContent || '';
    } catch (error) {
      console.error('Error in getContent:', error);
      // Fall back to local storage on any error
      const localContent = await AsyncStorage.getItem(STORAGE_KEY);
      return localContent || '';
    }
  },

  async saveContent(content: string): Promise<SaveResult> {
    // Skip Supabase during SSR
    if (typeof window === 'undefined') {
      return { success: true };
    }

    try {
      // Always save to local storage first (fast, offline-capable)
      await AsyncStorage.setItem(STORAGE_KEY, content);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not authenticated, local save is enough
        return { success: true };
      }

      // Retry logic for version conflicts
      const maxRetries = 3;
      let hadConflict = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Fetch current remote version (server-side source of truth)
        const { data: remoteDoc, error: fetchError } = await supabase
          .from('documents')
          .select('version')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching remote version:', fetchError);
          return { success: false };
        }

        const currentVersion = remoteDoc?.version || 0;
        const newVersion = currentVersion + 1;

        // Attempt optimistic lock: only update if version matches
        if (remoteDoc) {
          // Document exists, use UPDATE with version check
          const { data, error } = await supabase
            .from('documents')
            .update({
              content,
              version: newVersion,
            })
            .eq('user_id', session.user.id)
            .eq('version', currentVersion) // Optimistic lock
            .select();

          if (error) {
            console.error('Error updating Supabase:', error);
            return { success: false };
          }

          // Check if update succeeded (returns empty array if version mismatch)
          if (data && data.length > 0) {
            // Success! Update local version
            await AsyncStorage.setItem(VERSION_KEY, newVersion.toString());
            await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            return { success: true, hadConflict };
          }

          // Version conflict, mark and retry
          hadConflict = true;
          console.warn(`Version conflict on attempt ${attempt + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))); // Exponential backoff
          continue;
        } else {
          // No remote document, insert new one
          const { error } = await supabase
            .from('documents')
            .insert({
              user_id: session.user.id,
              content,
              version: newVersion,
            });

          if (error) {
            console.error('Error inserting to Supabase:', error);
            return { success: false };
          }

          // Update local version
          await AsyncStorage.setItem(VERSION_KEY, newVersion.toString());
          await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
          return { success: true, hadConflict };
        }
      }

      // Failed after retries
      console.error('Failed to save after maximum retries due to version conflicts');
      return { success: false, hadConflict: true };
    } catch (error) {
      console.error('Error in saveContent:', error);
      // Don't throw - at least we saved locally
      return { success: false };
    }
  },
};

// Helper function to check sync status
export async function getSyncStatus(): Promise<{
  lastSync: Date | null;
  version: number;
  hasRemote: boolean;
}> {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return { lastSync: null, version: 0, hasRemote: false };
  }

  try {
    const [lastSyncStr, versionStr] = await Promise.all([
      AsyncStorage.getItem(LAST_SYNC_KEY),
      AsyncStorage.getItem(VERSION_KEY),
    ]);

    const { data: { session } } = await supabase.auth.getSession();
    let hasRemote = false;

    if (session?.user) {
      const { data } = await supabase
        .from('documents')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      hasRemote = !!data;
    }

    return {
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      version: versionStr ? parseInt(versionStr, 10) : 0,
      hasRemote,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      lastSync: null,
      version: 0,
      hasRemote: false,
    };
  }
}

// Helper to force sync local content to remote (useful after first sign-in)
export async function syncLocalToRemote(): Promise<void> {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return;
  }

  const localContent = await AsyncStorage.getItem(STORAGE_KEY);
  if (localContent) {
    await supabaseStorageAPI.saveContent(localContent);
  }
}
