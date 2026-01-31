import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@schorl:content';

export interface SaveResult {
  success: boolean;
  hadConflict?: boolean;
}

export interface RemoteUpdate {
  content: string;
  version: number;
}

export interface StorageAPI {
  getContent: () => Promise<string>;
  saveContent: (content: string) => Promise<SaveResult>;
  saveContentLocal: (content: string) => Promise<void>;
  
  // Optional: realtime subscription for providers that support it
  // Returns unsubscribe function
  subscribe?: (onUpdate: (update: RemoteUpdate) => void) => () => void;
}

export const localStorageAPI: StorageAPI = {
  async getContent(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data || '';
    } catch (error) {
      console.error('Error reading content:', error);
      return '';
    }
  },

  async saveContent(content: string): Promise<SaveResult> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, content);
      return { success: true };
    } catch (error) {
      console.error('Error saving content:', error);
      throw error;
    }
  },

  async saveContentLocal(content: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, content);
    } catch (error) {
      console.error('Error saving content locally:', error);
      throw error;
    }
  },
};

// Use Supabase storage by default (falls back to local if not authenticated)
export { supabaseStorageAPI as storage } from './supabaseStorage';
