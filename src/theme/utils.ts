import { PixelRatio } from 'react-native';

/**
 * Scale font size based on device font scale setting
 * Respects user accessibility preferences
 * 
 * @param size - Base font size in density-independent pixels
 * @returns Scaled font size
 */
export function scaleFont(size: number): number {
  const scale = PixelRatio.getFontScale();
  return Math.round(size * scale);
}

/**
 * Scale size based on screen pixel ratio
 * Useful for truly responsive UIs across different screen densities
 * 
 * @param size - Base size in density-independent pixels
 * @returns Scaled size
 */
export function scaleSize(size: number): number {
  const scale = PixelRatio.get();
  return Math.round(size * scale);
}
