import { Platform, Dimensions } from 'react-native';

/**
 * Platform detection utilities for PWA/mobile behavior
 */

/**
 * Returns true if running in a browser environment (not SSR)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Returns true if running on web platform
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Returns true if running on iOS (native or PWA)
 */
export function isIOS(): boolean {
  if (Platform.OS === 'ios') return true;
  
  // Detect iOS PWA via user agent
  if (isWeb() && isBrowser()) {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }
  
  return false;
}

/**
 * Returns true if on a mobile device (native or mobile web)
 */
export function isMobile(): boolean {
  if (Platform.OS !== 'web') return true;
  
  // Mobile web detection by viewport width
  if (isBrowser()) {
    return Dimensions.get('window').width < 768;
  }
  
  return false;
}

/**
 * Returns true if running as installed PWA (standalone mode)
 */
export function isPWA(): boolean {
  if (!isWeb() || !isBrowser()) return false;
  
  // Check display-mode media query
  return window.matchMedia('(display-mode: standalone)').matches ||
         // iOS Safari PWA detection
         (navigator as any).standalone === true;
}

/**
 * Subscribe to visibility changes (for PWA foreground/background)
 * Returns unsubscribe function
 */
export function onVisibilityChange(
  callback: (isVisible: boolean) => void
): () => void {
  if (!isWeb() || !isBrowser()) {
    return () => {};
  }

  const handler = () => {
    callback(document.visibilityState === 'visible');
  };

  document.addEventListener('visibilitychange', handler);
  
  return () => {
    document.removeEventListener('visibilitychange', handler);
  };
}
