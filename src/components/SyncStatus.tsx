import { Text, StyleSheet, Platform, Pressable, Animated, Dimensions } from 'react-native';
import { Cloud, CloudOff, Loader2 } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { typography, colors, spacing, radius } from '@/src/theme';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

// Detect if we're on a mobile device (including mobile web)
const isMobile = Platform.OS !== 'web' || Dimensions.get('window').width < 768;

interface SyncStatusProps {
  state: SyncState;
  lastSync?: Date | null;
  version?: number;
}

export default function SyncStatus({ state, lastSync, version }: SyncStatusProps) {
  const [showToast, setShowToast] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showToast) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowToast(false));
    }
  }, [showToast, fadeAnim]);

  const handlePress = () => {
    if (isMobile) {
      setShowToast(true);
    }
  };

  const getIcon = () => {
    const iconSize = isMobile ? 16 : 14;
    switch (state) {
      case 'synced':
        return <Cloud size={iconSize} color={colors.success} />;
      case 'syncing':
        return <Loader2 size={iconSize} color={colors.accent} />;
      case 'offline':
      case 'error':
        return <CloudOff size={iconSize} color={colors.text.tertiary} />;
    }
  };

  const getText = () => {
    switch (state) {
      case 'synced':
        if (lastSync) {
          const now = Date.now();
          const diff = now - lastSync.getTime();
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          if (seconds < 60) return 'Synced just now';
          if (minutes < 60) return `Synced ${minutes}m ago`;
          if (hours < 24) return `Synced ${hours}h ago`;
          return 'Synced';
        }
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Working offline';
      case 'error':
        return 'Sync error';
    }
  };

  const getToastText = () => {
    const statusText = getText();
    const versionText = version !== undefined ? `\nVersion: ${version}` : '';
    const stateText = state === 'offline' ? '\nLocal only' : state === 'synced' ? '\nSynced to cloud' : '';
    return statusText + versionText + stateText;
  };

  const getTextColor = () => {
    switch (state) {
      case 'synced':
        return colors.success;
      case 'syncing':
        return colors.accent;
      case 'offline':
      case 'error':
        return colors.text.tertiary;
    }
  };

  return (
    <>
      <Pressable style={styles.container} onPress={handlePress}>
        {getIcon()}
        {!isMobile && (
          <Text style={[styles.text, { color: getTextColor() }]}>
            {getText()}
          </Text>
        )}
      </Pressable>
      
      {showToast && isMobile && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>{getToastText()}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.tiny,
    fontFamily: typography.fontFamily.monospace,
  },
  toast: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        // @ts-ignore - web-specific boxShadow
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
    zIndex: 1000,
  },
  toastText: {
    fontSize: typography.fontSize.tiny,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.monospace,
    lineHeight: 18,
  },
});
