import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import { StorageAPI } from './storage';

const STORAGE_KEY = '@md-tasks:content';
const VERSION_KEY = '@md-tasks:version';
const LAST_SYNC_KEY = '@md-tasks:last-sync';

interface DocumentRow {
  user_id: string;
  content: string;
  version: number;
  updated_at: string;
}

export const supabaseStorageAPI: StorageAPI = {
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

  async saveContent(content: string): Promise<void> {
    // Skip Supabase during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Always save to local storage first (fast, offline-capable)
      await AsyncStorage.setItem(STORAGE_KEY, content);

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not authenticated, local save is enough
        return;
      }

      // Get current version
      const localVersionStr = await AsyncStorage.getItem(VERSION_KEY);
      const currentVersion = localVersionStr ? parseInt(localVersionStr, 10) : 0;
      const newVersion = currentVersion + 1;

      // Upsert to Supabase
      const { error } = await supabase
        .from('documents')
        .upsert({
          user_id: session.user.id,
          content,
          version: newVersion,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Don't throw - we already saved locally
        return;
      }

      // Update local version
      await AsyncStorage.setItem(VERSION_KEY, newVersion.toString());
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error in saveContent:', error);
      // Don't throw - at least we saved locally
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
