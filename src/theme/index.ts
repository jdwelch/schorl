/**
 * Design Token System
 * 
 * Single source of truth for typography, colors, spacing, and other design values.
 * Import from here to use tokens in components.
 */

import { colors, radius, spacing, typography } from './tokens';

export { colors, radius, spacing, typography } from './tokens';
export { scaleFont, scaleSize } from './utils';

// Convenience export for importing the entire theme
export const theme = {
  typography,
  colors,
  spacing,
  radius,
};
