/**
 * Platform utility tests
 * 
 * Note: These run in jsdom environment which simulates a browser.
 * Platform.OS is mocked to 'web' in jest.setup.js
 */

import {
  isBrowser,
  isWeb,
  isIOS,
  isMobile,
  isPWA,
  onVisibilityChange,
} from '../utils/platform';

describe('platform utilities', () => {
  describe('isBrowser', () => {
    it('returns true in jsdom environment', () => {
      expect(isBrowser()).toBe(true);
    });
  });

  describe('isWeb', () => {
    it('returns true when Platform.OS is web', () => {
      // Platform is mocked to web in jest.setup.js
      expect(isWeb()).toBe(true);
    });
  });

  describe('isIOS', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('returns false for non-iOS user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        writable: true,
      });
      expect(isIOS()).toBe(false);
    });

    it('returns true for iPhone user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
        writable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPad user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
        writable: true,
      });
      expect(isIOS()).toBe(true);
    });
  });

  describe('isPWA', () => {
    it('returns false when not in standalone mode', () => {
      // Default jsdom doesn't have standalone mode
      expect(isPWA()).toBe(false);
    });

    it('returns true when display-mode is standalone', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      expect(isPWA()).toBe(true);

      window.matchMedia = originalMatchMedia;
    });

    it('returns true when navigator.standalone is true (iOS Safari)', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      (navigator as any).standalone = true;

      expect(isPWA()).toBe(true);

      delete (navigator as any).standalone;
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('onVisibilityChange', () => {
    it('returns unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = onVisibilityChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('adds event listener for visibilitychange', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const callback = jest.fn();
      
      const unsubscribe = onVisibilityChange(callback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
      
      unsubscribe();
      addEventListenerSpy.mockRestore();
    });

    it('removes event listener on unsubscribe', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const callback = jest.fn();
      
      const unsubscribe = onVisibilityChange(callback);
      unsubscribe();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
      
      removeEventListenerSpy.mockRestore();
    });

    it('calls callback with true when visibility becomes visible', () => {
      const callback = jest.fn();
      onVisibilityChange(callback);

      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('calls callback with false when visibility becomes hidden', () => {
      const callback = jest.fn();
      onVisibilityChange(callback);

      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('isMobile', () => {
    it('returns value based on window width', () => {
      // In jsdom, Dimensions.get returns mock values
      // Just verify it returns a boolean
      expect(typeof isMobile()).toBe('boolean');
    });
  });
});
