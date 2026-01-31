// Access mocks from global setup
const mockAsyncStorage = (global as any).__mockAsyncStorage;
const mockSupabase = (global as any).__mockSupabase;

// Import the module under test
import { supabaseStorageAPI, getSyncStatus } from '../utils/supabaseStorage';

describe('supabaseStorage', () => {
  describe('SSR safety', () => {
    // Note: These tests verify the code handles SSR gracefully.
    // In jsdom environment, window is defined, so we test the non-SSR path.
    // The SSR guards (typeof window === 'undefined') are covered by the fact
    // that the code runs without errors in both environments.
    
    it('getContent returns string in browser environment', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });
      mockAsyncStorage.getItem.mockResolvedValueOnce('content');
      
      const result = await supabaseStorageAPI.getContent();
      expect(typeof result).toBe('string');
    });

    it('saveContent returns SaveResult in browser environment', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });
      
      const result = await supabaseStorageAPI.saveContent('test');
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('subscribe returns function in browser environment', () => {
      const unsubscribe = supabaseStorageAPI.subscribe!(() => {});
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  const mockUserId = 'user-123';
  const mockSession = { user: { id: mockUserId } };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage mock
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    
    // Reset Supabase mock
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  describe('saveContentLocal', () => {
    it('saves content to AsyncStorage', async () => {
      await supabaseStorageAPI.saveContentLocal('test content');
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@schorl:content',
        'test content'
      );
    });
  });

  describe('getContent', () => {
    it('returns local content when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });
      mockAsyncStorage.getItem.mockResolvedValueOnce('local content');

      const result = await supabaseStorageAPI.getContent();

      expect(result).toBe('local content');
    });

    it('returns empty string when no local content and not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await supabaseStorageAPI.getContent();

      expect(result).toBe('');
    });

    it('fetches from Supabase when authenticated and remote is newer', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });
      
      // Local content and version
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('local content')  // STORAGE_KEY
        .mockResolvedValueOnce('1');             // VERSION_KEY

      // Remote has newer version
      const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
        data: { content: 'remote content', version: 2, updated_at: '2026-01-31T00:00:00Z' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await supabaseStorageAPI.getContent();

      expect(result).toBe('remote content');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@schorl:content', 'remote content');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@schorl:version', '2');
    });

    it('returns local content when remote version is not newer', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('local content')
        .mockResolvedValueOnce('5');  // local version is 5

      const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
        data: { content: 'remote content', version: 3, updated_at: '2026-01-31T00:00:00Z' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await supabaseStorageAPI.getContent();

      expect(result).toBe('local content');
    });

    it('returns local content on Supabase error', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });
      
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('local content')
        .mockResolvedValueOnce('1');

      const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' },
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await supabaseStorageAPI.getContent();

      expect(result).toBe('local content');
    });
  });

  describe('saveContent', () => {
    it('saves locally and returns success when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const result = await supabaseStorageAPI.saveContent('test content');

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@schorl:content', 'test content');
    });

    it('inserts new document when authenticated with no existing doc', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // First call: fetch version returns null (no doc)
      const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null,
      });
      const mockVersionEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockVersionSelect = jest.fn().mockReturnValue({ eq: mockVersionEq });
      
      // Insert succeeds
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockVersionSelect })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await supabaseStorageAPI.saveContent('test content');

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        content: 'test content',
        version: 1,
      });
    });

    it('updates existing doc with optimistic locking', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // Fetch version returns existing doc
      const mockMaybeSingle = jest.fn().mockResolvedValueOnce({
        data: { version: 5 },
        error: null,
      });
      const mockVersionEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockVersionSelect = jest.fn().mockReturnValue({ eq: mockVersionEq });

      // Update succeeds
      const mockUpdateSelect = jest.fn().mockResolvedValueOnce({
        data: [{ version: 6 }],
        error: null,
      });
      const mockUpdateVersionEq = jest.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdateUserEq = jest.fn().mockReturnValue({ eq: mockUpdateVersionEq });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateUserEq });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockVersionSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await supabaseStorageAPI.saveContent('updated content');

      expect(result.success).toBe(true);
      expect(result.hadConflict).toBe(false);
    });

    it('retries on version conflict and reports hadConflict', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // First attempt: fetch version 5, update fails (empty result = version mismatch)
      const mockMaybeSingle1 = jest.fn().mockResolvedValueOnce({
        data: { version: 5 },
        error: null,
      });
      const mockVersionEq1 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle1 });
      const mockVersionSelect1 = jest.fn().mockReturnValue({ eq: mockVersionEq1 });

      const mockUpdateSelect1 = jest.fn().mockResolvedValueOnce({
        data: [],  // Empty = version mismatch
        error: null,
      });
      const mockUpdateVersionEq1 = jest.fn().mockReturnValue({ select: mockUpdateSelect1 });
      const mockUpdateUserEq1 = jest.fn().mockReturnValue({ eq: mockUpdateVersionEq1 });
      const mockUpdate1 = jest.fn().mockReturnValue({ eq: mockUpdateUserEq1 });

      // Second attempt: fetch version 6, update succeeds
      const mockMaybeSingle2 = jest.fn().mockResolvedValueOnce({
        data: { version: 6 },
        error: null,
      });
      const mockVersionEq2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle2 });
      const mockVersionSelect2 = jest.fn().mockReturnValue({ eq: mockVersionEq2 });

      const mockUpdateSelect2 = jest.fn().mockResolvedValueOnce({
        data: [{ version: 7 }],
        error: null,
      });
      const mockUpdateVersionEq2 = jest.fn().mockReturnValue({ select: mockUpdateSelect2 });
      const mockUpdateUserEq2 = jest.fn().mockReturnValue({ eq: mockUpdateVersionEq2 });
      const mockUpdate2 = jest.fn().mockReturnValue({ eq: mockUpdateUserEq2 });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockVersionSelect1 })
        .mockReturnValueOnce({ update: mockUpdate1 })
        .mockReturnValueOnce({ select: mockVersionSelect2 })
        .mockReturnValueOnce({ update: mockUpdate2 });

      const result = await supabaseStorageAPI.saveContent('content');

      expect(result.success).toBe(true);
      expect(result.hadConflict).toBe(true);
    });

    it('fails after max retries due to persistent conflicts', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // Create a mock that always returns version conflict
      const createFailedAttemptMocks = () => {
        const mockMaybeSingle = jest.fn().mockResolvedValue({
          data: { version: 5 },
          error: null,
        });
        const mockVersionEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockVersionSelect = jest.fn().mockReturnValue({ eq: mockVersionEq });

        const mockUpdateSelect = jest.fn().mockResolvedValue({
          data: [],  // Always empty = always conflict
          error: null,
        });
        const mockUpdateVersionEq = jest.fn().mockReturnValue({ select: mockUpdateSelect });
        const mockUpdateUserEq = jest.fn().mockReturnValue({ eq: mockUpdateVersionEq });
        const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateUserEq });

        return [
          { select: mockVersionSelect },
          { update: mockUpdate },
        ];
      };

      // 3 attempts × 2 calls each = 6 from() calls
      const allMocks = [
        ...createFailedAttemptMocks(),
        ...createFailedAttemptMocks(),
        ...createFailedAttemptMocks(),
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => allMocks[callIndex++]);

      const result = await supabaseStorageAPI.saveContent('content');

      expect(result.success).toBe(false);
      expect(result.hadConflict).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('returns unsubscribe function', () => {
      const onUpdate = jest.fn();
      const unsubscribe = supabaseStorageAPI.subscribe!(onUpdate);

      expect(typeof unsubscribe).toBe('function');
    });

    it('sets up Supabase channel when authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const onUpdate = jest.fn();
      supabaseStorageAPI.subscribe!(onUpdate);

      // Wait for async setup
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSupabase.channel).toHaveBeenCalledWith(`documents:${mockUserId}`);
    });

    it('unsubscribes cleanly even if called immediately', () => {
      // Test that unsubscribe doesn't throw even if channel isn't set up yet
      const onUpdate = jest.fn();
      const unsubscribe = supabaseStorageAPI.subscribe!(onUpdate);

      // Should not throw
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
