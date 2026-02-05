import { View, Text, StyleSheet, Platform } from 'react-native';
import Constants from 'expo-constants';
import { typography, colors, spacing } from '@/src/theme';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

const DiagonalStripes = () => {
  if (Platform.OS === 'web') {
    return <View style={styles.stripesWeb} />;
  }

  return (
    <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%" opacity={0.2}>
      <Defs>
        <Pattern
          id="stripes"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(45)"
        >
          <Rect x="0" y="0" width="4" height="8" fill="#000000" />
          <Rect x="4" y="0" width="4" height="8" fill="#f59e0b" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#stripes)" />
    </Svg>
  );
};

export default function DevBanner() {
  const isDev = __DEV__ || Constants.appOwnership === 'expo';

  if (!isDev) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <DiagonalStripes />
      <Text style={styles.text}>DEV MODE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stripesWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'repeating-linear-gradient(45deg, #000000 0px, #000000 10px, #f59e0b 10px, #f59e0b 20px)',
    opacity: 0.2,
  } as any,
  text: {
    fontFamily: typography.fontFamily.monospace,
    fontSize: typography.fontSize.tiny,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
    letterSpacing: 1,
    zIndex: 1,
  },
});
