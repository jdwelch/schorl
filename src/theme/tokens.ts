import { Platform } from 'react-native';

/**
 * Typography Design Tokens
 * 
 * All sizes are unitless and represent density-independent pixels (dp/pt).
 * React Native does not support rem/em units.
 */
export const typography = {
  fontFamily: {
    monospace: Platform.select({
      web: 'IBM Plex Mono, Roboto Mono, Menlo, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  
  // Font sizes with their scale relationships documented
  fontSize: {
    base: 14,      // Body text baseline (1.0x)
    heading: 17,   // All heading levels (1.2x of base)
    small: 11,     // Badges, small text (0.79x of base)
    tiny: 12,      // Toolbar buttons (0.86x of base)
    large: 18,     // Modal titles (1.29x of base)
  },
  
  lineHeight: {
    base: 20,      // For base fontSize (1.43x)
    heading: 24,   // For heading fontSize (1.41x)
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

/**
 * Color Design Tokens
 * 
 * Dark theme only. Colors are named semantically by purpose.
 */
export const colors = {
  // Background colors
  background: {
    primary: '#1a1a1a',    // Main app background
    secondary: '#262626',  // Cards, toolbar, modals
  },
  
  // Text colors
  text: {
    primary: '#e5e7eb',    // Main body text
    secondary: '#9ca3af',  // Muted text, placeholders
    tertiary: '#6b7280',   // Very muted, disabled
    heading: '#f3f4f6',    // Emphasized text, headings
    inverse: '#ffffff',    // Text on colored backgrounds
  },
  
  // UI colors
  border: '#374151',
  accent: '#3B82F6',       // Primary action color
  success: '#10B981',      // Completed tasks
  warning: '#f59e0b',      // Warnings, conflicts
  
  // Badge colors
  badge: {
    default: '#374151',
    defaultText: '#9ca3af',
    
    due: '#78350f',
    dueText: '#fcd34d',
    
    overdue: 'rgba(88, 28, 135, 0.3)',
    overdueText: '#d8b4fe',
    
    code: '#262626',
    codeText: '#fcd34d',
  },
  
  // Priority colors
  priority: {
    highest: '#7f1d1d',
    high: '#78350f',
    low: '#1e3a8a',
    lowest: '#3730a3',
  },
  
  // Modal overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
};

/**
 * Spacing Design Tokens
 * 
 * Consistent spacing scale for margins, padding, and gaps.
 */
export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
};

/**
 * Border Radius Tokens
 * 
 * Consistent corner radius values.
 */
export const radius = {
  sm: 4,
  md: 6,
  lg: 12,
};
